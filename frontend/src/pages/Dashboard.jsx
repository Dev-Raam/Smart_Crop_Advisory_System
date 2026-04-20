import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle, Cloud, Wind, Droplets, Sprout, Bug, MessageCircle, Lightbulb } from 'lucide-react';
import { get, set } from 'idb-keyval';
import axios from 'axios';
import heroImage from '../assets/hero.png';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/translations';

const Dashboard = () => {
  const { user, isOffline, language } = useAuth();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = (key) => translate(language, key);

  const tools = [
    { title: 'Crop Advisory', description: 'Get AI-powered crop advice based on soil health and season.', icon: Sprout, path: '/crop-recommendation' },
    { title: 'Disease Detection', description: 'Upload leaf photos to identify plant diseases and get cure suggestions.', icon: Bug, path: '/disease-detection' },
    { title: 'Farm Assistant', description: 'Ask questions on irrigation, fertilizer timing, and pest management.', icon: MessageCircle, path: '/chatbot' },
    { title: 'Future Scope', description: 'See how the platform will evolve with smarter and broader services.', icon: Lightbulb, path: '/future-scope' },
  ];

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = res.data.current_weather;
        setWeather(weatherData);
        await set('cached_weather', weatherData);
      } catch {
        const cached = await get('cached_weather');
        if (cached) {
          setWeather(cached);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isOffline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => fetchWeather(28.6139, 77.2090),
      );
      return;
    }

    get('cached_weather').then((cached) => {
      if (cached) {
        setWeather(cached);
      }
      setLoading(false);
    });
  }, [isOffline]);

  return (
    <div className="farm-page">
      <div className="farm-content space-y-10">
        <section className="farm-banner" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content flex flex-col items-center text-center md:items-start md:text-left max-w-3xl">
            <div className="farm-badge mb-5">
              <Cloud size={14} />
              <span>{t('currentWeather')}</span>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-4">{t('hello')}, {user?.name || t('farmer')}</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight max-w-3xl">
              Revolutionizing
              <span className="block text-[#8fda38]">Indian Farming</span>
            </h1>
            <p className="mt-6 text-base md:text-xl text-white/85 max-w-2xl">
              Maximize your yield with real-time weather tracking, soil analysis, and expert advisory in one smart platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <Link to="/crop-recommendation" className="farm-primary-button">
                <span>Explore Tools</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/future-scope" className="farm-secondary-button">
                <PlayCircle size={18} />
                <span>Watch Demo</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="farm-section-card">
            <div className="flex items-center gap-3 text-[#7baa33] mb-3">
              <Cloud size={18} />
              <h2 className="text-lg font-bold">{t('currentWeather')}</h2>
            </div>
            {loading ? (
              <p className="text-[#6a7364]">Loading weather...</p>
            ) : weather ? (
              <div className="space-y-4">
                <div className="text-4xl font-black text-[#243224]">{weather.temperature} C</div>
                <div className="grid grid-cols-2 gap-3 text-sm text-[#5b6653]">
                  <div className="rounded-2xl bg-[#f5f7ef] p-3">
                    <Wind size={16} className="mb-2 text-[#7baa33]" />
                    <div>{weather.windspeed} km/h</div>
                  </div>
                  <div className="rounded-2xl bg-[#f5f7ef] p-3">
                    <Droplets size={16} className="mb-2 text-[#7baa33]" />
                    <div>{isOffline ? 'Offline' : 'Live sync'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#6a7364]">{t('noWeather')}</p>
            )}
          </div>

          <div className="farm-section-card md:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-2xl font-black text-[#243224]">Service Highlights</h2>
              <Link to="/future-scope" className="text-sm font-semibold text-[#7baa33] inline-flex items-center gap-2">
                <span>{t('navFutureScope')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {tools.map((tool, index) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="farm-dark-card"
                  style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: `${20 + index * 18}% center` }}
                >
                  <div className="farm-dark-card-content">
                    <div className="w-12 h-12 rounded-2xl bg-[#8fda38]/20 backdrop-blur-sm flex items-center justify-center text-[#9fe241] mb-5">
                      <tool.icon size={22} />
                    </div>
                    <h3 className="text-2xl font-black uppercase leading-tight">{tool.title}</h3>
                    <p className="text-sm text-white/82 mt-3 min-h-[72px]">{tool.description}</p>
                    <span className="farm-mini-button mt-5">Read More</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
