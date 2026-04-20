import { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { api, getAuthHeaders } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  async function loadProfile(currentToken) {
    try {
      const res = await api.get('/api/auth/profile', {
        headers: getAuthHeaders(currentToken),
      });
      setUser(res.data);
      setLanguage(res.data.language || 'en');
      localStorage.setItem('language', res.data.language || 'en');
      await set('user_profile', res.data);
    } catch (err) {
      console.error('Failed to load profile, using cached if available', err);
      const cached = await get('user_profile');
      if (cached) setUser(cached);
    }
  }

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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, language, changeLanguage, isOffline }}>
      {children}
    </AuthContext.Provider>
  );
};
