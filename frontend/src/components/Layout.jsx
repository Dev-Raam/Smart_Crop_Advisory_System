import { Outlet, NavLink } from 'react-router-dom';
import { Home, Sprout, Bug, MessageCircle, User, Lightbulb, MapPin, CloudSun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/translations';

const Layout = () => {
  const { isOffline, language, user } = useAuth();
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
    <div className="min-h-screen bg-[#f6f4ea]">
      <header className="fixed top-0 inset-x-0 z-50 px-3 md:px-5 pt-3">
        <div className="farm-content">
          <div className="rounded-full bg-white/95 border border-[#ece7db] shadow-[0_12px_36px_rgba(34,48,21,0.12)] px-4 md:px-6 h-16 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d6f17f] to-[#5e9727] flex items-center justify-center text-white shadow-md">
                <Sprout size={20} />
              </div>
              <p className="text-lg md:text-xl font-semibold text-[#7baa33] tracking-tight truncate">
                {t('appName')}
              </p>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      isActive ? 'bg-[#edf6dd] text-[#5b8e25]' : 'text-[#334433] hover:bg-[#f5f7ef]'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f7ef] px-3 py-2 text-[#415141]">
                <MapPin size={14} className="text-[#7baa33]" />
                <span>Meerut</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f7ef] px-3 py-2 text-[#415141]">
                <CloudSun size={14} className="text-[#7baa33]" />
                <span>24°C</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8d6] bg-white px-3 py-2 text-[#334433]">
                <span>{language.toUpperCase()}</span>
              </div>
              <NavLink
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full bg-[#86c440] px-4 py-2 text-white font-semibold shadow-[0_10px_24px_rgba(134,196,64,0.26)]"
              >
                <User size={14} />
                <span>{user?.name || t('navProfile')}</span>
              </NavLink>
            </div>
          </div>
          {isOffline && (
            <div className="mt-2 rounded-full bg-red-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
              {t('offlineBanner')}
            </div>
          )}
        </div>
      </header>

      <main className="pt-24 md:pt-28 pb-24 md:pb-10">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-3 inset-x-3 z-50 rounded-[26px] bg-white/95 border border-[#ece7db] shadow-[0_20px_50px_rgba(35,45,20,0.18)] backdrop-blur-md">
        <div className="grid grid-cols-6 items-center h-18">
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
              <span className="text-[10px] mt-1 font-semibold">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
