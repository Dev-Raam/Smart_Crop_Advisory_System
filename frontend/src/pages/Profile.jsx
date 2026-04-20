import { useEffect, useState } from 'react';
import { LogOut, Settings, Clock, Globe } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { LANGUAGE_OPTIONS } from '../lib/constants';
import { formatHistoryType } from '../utils/formatters';
import { translate } from '../utils/translations';

const Profile = () => {
  const { user, logout, language, changeLanguage, token, isOffline } = useAuth();
  const [history, setHistory] = useState([]);
  const t = (key) => translate(language, key);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOffline && token) {
        try {
          const res = await api.get('/api/services/history', {
            headers: getAuthHeaders(token),
          });
          setHistory(res.data);
          await set('user_history', res.data);
          return;
        } catch (e) {
          console.warn('Could not fetch history', e);
        }
      }

      const cached = await get('user_history');
      if (cached) {
        setHistory(cached);
      }
    };

    fetchHistory();
  }, [isOffline, token]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('profileTitle')}</h1>
      </header>

      <div className="glass-panel p-6 flex items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {user?.name?.charAt(0) || 'F'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{user?.name || t('farmer')}</h2>
          <p className="text-gray-500">{user?.phone || t('noPhone')}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-medium text-gray-700">
          <Settings size={18} /> {t('settings')}
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Globe size={20} className="text-blue-500" />
              <span>{t('language')}</span>
            </div>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-gray-100 border-none rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} /> {t('signOut')}
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 font-medium text-gray-700">
          <Clock size={18} /> {t('recentActivity')}
        </div>
        <div className="p-0">
          {history.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {history.map((item) => (
                <li key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{formatHistoryType(item.type)}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.type === 'crop_recommendation' && `${t('recommendedPrefix')}: ${item.data.recommendation}`}
                        {item.type === 'disease_detection' && `${t('foundPrefix')}: ${item.data.disease}`}
                        {item.type === 'chat' && `${t('askedPrefix')}: ${(item.data.user_message || '').slice(0, 30)}...`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {t('noRecentActivity')}
            </div>
          )}
        </div>
      </div>

      <div className="h-8"></div>
    </div>
  );
};

export default Profile;
