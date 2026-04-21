import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { api, getAuthHeaders } from '../lib/api';

const AuthContext = createContext();
const DEFAULT_LOCATION = {
  name: 'Ludhiana, Punjab',
  lat: 30.900965,
  lon: 75.857277,
};
const DEFAULT_THEME = 'light';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || DEFAULT_THEME);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [locationInfo, setLocationInfo] = useState(DEFAULT_LOCATION);
  const [weatherInfo, setWeatherInfo] = useState(null);

  async function loadProfile(currentToken) {
    try {
      const res = await api.get('/api/auth/profile', {
        headers: getAuthHeaders(currentToken),
      });
      setUser(res.data);
      setLanguage(res.data.language || 'en');
      localStorage.setItem('language', res.data.language || 'en');
      await set('user_profile', res.data);
      if (res.data.location?.lat && res.data.location?.lon) {
        setLocationInfo((prev) => ({
          ...prev,
          lat: res.data.location.lat,
          lon: res.data.location.lon,
        }));
      }
    } catch (err) {
      console.error('Failed to load profile, using cached if available', err);
      const cached = await get('user_profile');
      if (cached) setUser(cached);
    }
  }

  const reverseGeocode = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (!res.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await res.json();
      const parts = [data.city || data.locality, data.principalSubdivision].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : DEFAULT_LOCATION.name;
    } catch {
      return DEFAULT_LOCATION.name;
    }
  }, []);

  const fetchWeather = useCallback(async (lat, lon) => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=auto`,
    );

    if (!res.ok) {
      throw new Error('Weather fetch failed');
    }

    const data = await res.json();
    return data.current;
  }, []);

  const refreshLocalContext = useCallback(async (coordsOverride) => {
    const fallbackLocation = coordsOverride || user?.location || DEFAULT_LOCATION;
    const persistLocation = async (payload) => {
      setLocationInfo(payload);
      await set('local_location', payload);
    };

    try {
      let coords = coordsOverride;

      if (!coords && navigator.geolocation && !isOffline) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) =>
              resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
          );
        });
      }

      const activeCoords = coords || fallbackLocation;
      const [locationName, weather] = await Promise.all([
        reverseGeocode(activeCoords.lat, activeCoords.lon),
        fetchWeather(activeCoords.lat, activeCoords.lon),
      ]);

      const nextLocation = {
        name: locationName,
        lat: activeCoords.lat,
        lon: activeCoords.lon,
      };

      await persistLocation(nextLocation);
      setWeatherInfo(weather);
      await set('cached_weather', weather);

      if (token && !isOffline) {
        try {
          const res = await api.put(
            '/api/auth/profile',
            { location: { lat: activeCoords.lat, lon: activeCoords.lon } },
            { headers: getAuthHeaders(token) },
          );
          setUser(res.data);
          await set('user_profile', res.data);
        } catch (e) {
          console.warn('Failed to sync location to profile', e);
        }
      }
    } catch (err) {
      console.warn('Using cached local context', err);
      const [cachedLocation, cachedWeather] = await Promise.all([
        get('local_location'),
        get('cached_weather'),
      ]);

      setLocationInfo(cachedLocation || {
        ...DEFAULT_LOCATION,
        lat: fallbackLocation.lat || DEFAULT_LOCATION.lat,
        lon: fallbackLocation.lon || DEFAULT_LOCATION.lon,
      });
      if (cachedWeather) {
        setWeatherInfo(cachedWeather);
      }
    }
  }, [fetchWeather, isOffline, reverseGeocode, token, user?.location]);

  useEffect(() => {
    // Offline status listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    if (token) {
      loadProfile(token);
    } else {
      // Check idb for cached user if offline
      get('user_profile').then(cached => {
        if (cached) setUser(cached);
      });
    }

    get('local_location').then((cachedLocation) => {
      if (cachedLocation) {
        setLocationInfo(cachedLocation);
      }
    });
    get('cached_weather').then((cachedWeather) => {
      if (cachedWeather) {
        setWeatherInfo(cachedWeather);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isOffline) {
      return;
    }

    void refreshLocalContext();
  }, [isOffline, refreshLocalContext]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setLanguage(userData.language || 'en');
    localStorage.setItem('token', authToken);
    localStorage.setItem('language', userData.language || 'en');
    void set('user_profile', userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('language');
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    if (token && !isOffline) {
      try {
        await api.put('/api/auth/profile', { language: lang }, {
          headers: getAuthHeaders(token),
        });
      } catch (e) {
        console.error('Failed to update language on server', e);
      }
    }
  };

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
  };

  const updateProfile = async (payload) => {
    if (!token) {
      return;
    }

    const res = await api.put('/api/auth/profile', payload, {
      headers: getAuthHeaders(token),
    });
    setUser(res.data);
    await set('user_profile', res.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        language,
        changeLanguage,
        theme,
        changeTheme,
        isOffline,
        locationInfo,
        weatherInfo,
        refreshLocalContext,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
