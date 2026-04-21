import { Outlet, NavLink } from 'react-router-dom';
import { CloudSun, Home, Lightbulb, MapPin, MessageCircle, Sprout, User, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/translations';
import ChatAssistantWidget from './ChatAssistantWidget';

const Layout = () => {
  const { isOffline, language, user, locationInfo, weatherInfo } = useAuth();
  const t = (key) => translate(language, key);

  const navItems = [
    { name: t('navHome'), path: '/', icon: Home },
    { name: t('navCrops'), path: '/crop-recommendation', icon: Sprout },
    { name: t('navPests'), path: '/disease-detection', icon: Bug },
    { name: t('navChat'), path: '/chatbot', icon: MessageCircle },
    { name: t('navFutureScope'), path: '/future-scope', icon: Lightbulb },
    { name: t('navProfile'), path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
        <div className="farm-content">
          <div className="flex h-16 items-center justify-between rounded-full border border-white/70 bg-white/92 px-4 shadow-[0_12px_36px_rgba(34,48,21,0.12)] backdrop-blur-md md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d6f17f] to-[#5e9727] text-white shadow-md">
                <Sprout size={20} />
              </div>
              <p className="truncate text-lg font-semibold tracking-tight text-[#7baa33] md:text-xl">
                {t('appName')}
              </p>
            </div>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive ? 'bg-[#edf6dd] text-[#5b8e25]' : 'text-[#334433] hover:bg-[#f5f7ef]'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 text-sm md:flex">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f7ef] px-3 py-2 text-[#415141]">
                <MapPin size={14} className="text-[#7baa33]" />
                <span>{locationInfo?.name || 'Ludhiana, Punjab'}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f7ef] px-3 py-2 text-[#415141]">
                <CloudSun size={14} className="text-[#7baa33]" />
                <span>{weatherInfo?.temperature_2m != null ? `${Math.round(weatherInfo.temperature_2m)}°C` : '--'}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8d6] bg-white px-3 py-2 text-[#334433]">
                <span>{language.toUpperCase()}</span>
              </div>
              <NavLink
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full bg-[#86c440] px-4 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(134,196,64,0.26)]"
              >
                <User size={14} />
                <span>{user?.name || t('navProfile')}</span>
              </NavLink>
            </div>
          </div>

          {isOffline ? (
            <div className="mt-2 rounded-full bg-red-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
              {t('offlineBanner')}
            </div>
          ) : null}
        </div>
      </header>

      <main className="pb-24 pt-24 md:pb-10 md:pt-28">
        <Outlet />
      </main>

      <ChatAssistantWidget />

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[26px] border border-[#ece7db] bg-white/95 shadow-[0_20px_50px_rgba(35,45,20,0.18)] backdrop-blur-md md:hidden">
        <div className="grid h-18 grid-cols-6 items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 transition-colors ${
                  isActive ? 'text-[#7baa33]' : 'text-[#6d7566]'
                }`
              }
            >
              <item.icon size={18} />
              <span className="mt-1 text-[10px] font-semibold">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
