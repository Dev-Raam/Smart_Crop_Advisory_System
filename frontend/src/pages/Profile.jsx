import { useEffect, useState } from 'react';
import { Clock, Globe, LogOut, MapPin, MoonStar, Palette, RefreshCw, Settings, SunMedium, Trash2 } from 'lucide-react';
import { del, get, set } from 'idb-keyval';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { LANGUAGE_OPTIONS } from '../lib/constants';
import { formatHistoryType } from '../utils/formatters';
import { translate } from '../utils/translations';

const THEMES = [
  { value: 'light', label: 'Fresh Light', icon: SunMedium, description: 'Bright and clean for field use.' },
  { value: 'earth', label: 'Earth Warm', icon: Palette, description: 'Warmer tones with softer contrast.' },
  { value: 'dusk', label: 'Dusk Mint', icon: MoonStar, description: 'Cool and polished late-evening theme.' },
];

const Profile = () => {
  const {
    user,
    logout,
    language,
    changeLanguage,
    token,
    isOffline,
    theme,
    changeTheme,
    locationInfo,
    refreshLocalContext,
  } = useAuth();
  const [history, setHistory] = useState([]);
  const [syncingLocation, setSyncingLocation] = useState(false);
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

  const syncLocation = async () => {
    setSyncingLocation(true);
    try {
      await refreshLocalContext();
    } finally {
      setSyncingLocation(false);
    }
  };

  const handleDeleteHistory = async (id, type) => {
    try {
      if (!isOffline && token) {
        await api.delete(`/api/services/history/${id}`, {
          headers: getAuthHeaders(token),
        });
      }

      const nextHistory = history.filter((item) => item._id !== id);
      setHistory(nextHistory);
      await set('user_history', nextHistory);

      if (type === 'chat') {
        await del(`chat_history_${user?.phone || 'guest'}_${language}`);
      }
    } catch (error) {
      console.warn('Failed to delete history item', error);
    }
  };

  return (
    <div className="farm-page">
      <div className="farm-content max-w-6xl space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="farm-section-card overflow-hidden bg-[linear-gradient(135deg,#1d3418_0%,#365d24_55%,#8aba40_100%)] text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/14 text-4xl font-black text-white backdrop-blur-sm">
                  {user?.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/65">{t('profileTitle')}</p>
                  <h1 className="mt-2 text-3xl font-black md:text-4xl">{user?.name || t('farmer')}</h1>
                  <p className="mt-2 text-white/80">{user?.phone || t('noPhone')}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/85">
                    <MapPin size={14} />
                    <span>{locationInfo?.name || 'Ludhiana, Punjab'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[240px]">
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Theme</p>
                  <p className="mt-2 text-lg font-bold">{THEMES.find((item) => item.value === theme)?.label || 'Fresh Light'}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">History</p>
                  <p className="mt-2 text-lg font-bold">{history.length} records</p>
                </div>
              </div>
            </div>
          </div>

          <div className="farm-section-card">
            <div className="mb-4 flex items-center gap-2 text-[#314331]">
              <Settings size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-xl font-black">{t('settings')}</h2>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] bg-[#f7f8f2] p-4">
                <div className="mb-3 flex items-center gap-3 text-[#425342]">
                  <Globe size={18} className="text-[var(--color-primary)]" />
                  <span className="font-semibold">{t('language')}</span>
                </div>
                <select
                  value={language}
                  onChange={(event) => changeLanguage(event.target.value)}
                  className="farm-field"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[24px] bg-[#f7f8f2] p-4">
                <div className="mb-3 flex items-center gap-3 text-[#425342]">
                  <Palette size={18} className="text-[var(--color-primary)]" />
                  <span className="font-semibold">Theme</span>
                </div>
                <div className="grid gap-3">
                  {THEMES.map((themeOption) => {
                    const Icon = themeOption.icon;
                    const active = themeOption.value === theme;

                    return (
                      <button
                        key={themeOption.value}
                        type="button"
                        onClick={() => changeTheme(themeOption.value)}
                        className={`flex items-center justify-between rounded-[22px] border px-4 py-3 text-left transition ${
                          active
                            ? 'border-[var(--color-primary)] bg-white shadow-[0_12px_24px_rgba(72,114,35,0.12)]'
                            : 'border-transparent bg-white/75 hover:border-[#dbe5c7]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5df] text-[var(--color-primary)]">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-[#233223]">{themeOption.label}</p>
                            <p className="text-xs text-[#6c7b67]">{themeOption.description}</p>
                          </div>
                        </div>
                        {active ? <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Active</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={syncLocation}
                disabled={syncingLocation || isOffline}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#eef5df] px-5 py-3 font-semibold text-[#44643b] transition hover:bg-[#e3eccf] disabled:opacity-60"
              >
                <RefreshCw size={16} className={syncingLocation ? 'animate-spin' : ''} />
                <span>{syncingLocation ? 'Updating location...' : 'Sync my location'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut size={18} />
                {t('signOut')}
              </button>
            </div>
          </div>
        </section>

        <section className="farm-section-card">
          <div className="mb-4 flex items-center gap-2 text-[#314331]">
            <Clock size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-xl font-black">{t('recentActivity')}</h2>
          </div>

          {history.length > 0 ? (
            <div className="grid gap-3">
              {history.map((item) => (
                <div key={item._id} className="rounded-[24px] border border-[#ebefdf] bg-[#fafbf7] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold capitalize text-[#243224]">{formatHistoryType(item.type)}</p>
                      <p className="mt-1 text-sm text-[#60705d]">
                        {item.type === 'crop_recommendation' && `${t('recommendedPrefix')}: ${item.data.recommendation}`}
                        {item.type === 'disease_detection' && `${t('foundPrefix')}: ${item.data.disease}`}
                        {item.type === 'chat' && `${t('askedPrefix')}: ${(item.data.user_message || '').slice(0, 90)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#8b9886]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.type === 'chat' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteHistory(item._id, item.type)}
                          className="rounded-full bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                          aria-label="Delete chat history"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-[#fafbf7] p-8 text-center text-[#697665]">
              {t('noRecentActivity')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
