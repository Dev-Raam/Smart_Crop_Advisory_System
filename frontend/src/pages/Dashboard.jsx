import { Link } from 'react-router-dom';
import {
  ArrowRight,
  PlayCircle,
  Cloud,
  Wind,
  Droplets,
  Sprout,
  Bug,
  MessageCircle,
  Lightbulb,
  BadgeCheck,
  TrendingUp,
  Languages,
  Mic,
  IndianRupee,
  MessageSquareQuote,
} from 'lucide-react';
import heroImage from '../assets/corn-field.jpg';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/translations';

const farmerStories = [
  {
    name: 'Gurpreet Singh',
    place: 'Ludhiana, Punjab',
    gain: 'Uses pest detection and early guidance to act faster before visible crop loss spreads across the field.',
    metric: 'Faster pest response',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Harpreet Kaur',
    place: 'Moga, Punjab',
    gain: 'Checks recommendations before sowing and uses weather plus advisory cards to plan irrigation more confidently.',
    metric: 'Better planning',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Baldev Kumar',
    place: 'Jagraon, Punjab',
    gain: 'Relies on local-language chat answers so family members can use the app without needing English terms.',
    metric: 'Higher family adoption',
    image: 'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80',
  },
];

const marketPrices = [
  {
    crop: 'Wheat',
    market: 'Ludhiana',
    price: 'Rs 2,585/qtl',
    updated: '12 Apr 2026',
  },
  {
    crop: 'Wheat',
    market: 'Punjab Avg',
    price: 'Rs 2,532/qtl',
    updated: '13 Apr 2026',
  },
  {
    crop: 'Maize',
    market: 'Ludhiana',
    price: 'Rs 2,389/qtl',
    updated: '22 Oct 2025',
  },
];

const Dashboard = () => {
  const { user, isOffline, language, weatherInfo, locationInfo } = useAuth();
  const t = (key) => translate(language, key);

  const tools = [
    {
      title: 'Crop Advisory',
      description: 'Get AI-powered crop advice based on soil health, season, and field conditions.',
      icon: Sprout,
      path: '/crop-recommendation',
    },
    {
      title: 'Disease Detection',
      description: 'Upload crop images to identify disease or pest signals and get treatment guidance.',
      icon: Bug,
      path: '/disease-detection',
    },
    {
      title: 'Farm Assistant',
      description: 'Ask about irrigation, fertilizer timing, pest control, and weather-based decisions.',
      icon: MessageCircle,
      path: '/chatbot',
    },
    {
      title: 'Future Scope',
      description: 'Explore how the platform will grow with smarter and broader farmer support.',
      icon: Lightbulb,
      path: '/future-scope',
    },
  ];

  const benefitPoints = [
    'One place for crop advice, pest detection, weather context, mandi snapshot, and AI assistance.',
    'Local field decisions become easier with practical recommendations instead of raw values only.',
    'The floating assistant stays available across tabs so help is always nearby.',
  ];

  const languageBenefits = [
    'Farmers can ask questions in their preferred app language and read simpler advice.',
    'Families can use the same app together because answers feel more local and less technical.',
    'Voice input makes the assistant easier to use directly from the field.',
  ];

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8 md:space-y-10">
        <section
          className="farm-banner min-h-[300px] md:min-h-[380px]"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="farm-banner-content grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="flex max-w-3xl flex-col items-center text-center md:items-start md:text-left">
              <div className="farm-badge mb-5">
                <Cloud size={14} />
                <span>{locationInfo?.name || 'Ludhiana, Punjab'}</span>
              </div>
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/70">
                {t('hello')}, {user?.name || t('farmer')}
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
                Smarter farming
                <span className="block text-[#8fda38]">without the clutter</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base text-white/85 md:text-xl">
                Weather, crop guidance, pest detection, multilingual AI support, and mandi insights in one cleaner dashboard.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:justify-start">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-white/12 bg-white/12 p-5 text-white backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2 text-[#b7ef71]">
                  <Cloud size={18} />
                  <h2 className="text-lg font-bold">{t('currentWeather')}</h2>
                </div>
                {weatherInfo ? (
                  <div className="space-y-4">
                    <div className="text-4xl font-black">{Math.round(weatherInfo.temperature_2m)} C</div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white/85">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Wind size={16} className="mb-2 text-[#b7ef71]" />
                        <div>{Math.round(weatherInfo.wind_speed_10m || 0)} km/h</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Droplets size={16} className="mb-2 text-[#b7ef71]" />
                        <div>{isOffline ? 'Offline' : 'Live sync'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/80">{t('noWeather')}</p>
                )}
              </div>

              <div className="rounded-[28px] bg-[#183016]/88 p-5 text-white">
                <div className="mb-3 flex items-center gap-2 text-[#b7ef71]">
                  <BadgeCheck size={18} />
                  <h2 className="text-lg font-bold">Why farmers use this</h2>
                </div>
                <div className="space-y-3">
                  {benefitPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#9fe241]" />
                      <p className="text-sm text-white/82">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="farm-section-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[#243224]">Service Highlights</h2>
            <Link to="/future-scope" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7baa33]">
              <span>{t('navFutureScope')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {tools.map((tool, index) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="farm-dark-card min-h-[280px]"
                style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: `${20 + index * 18}% center` }}
              >
                <div className="farm-dark-card-content">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8fda38]/20 text-[#9fe241] backdrop-blur-sm">
                    <tool.icon size={22} />
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-tight">{tool.title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm text-white/82">{tool.description}</p>
                  <span className="farm-mini-button mt-5">Read More</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="farm-section-card bg-[linear-gradient(180deg,#f9fbf5_0%,#ffffff_100%)]">
            <div className="mb-6 flex items-center gap-2 text-[#243224]">
              <TrendingUp size={18} className="text-[#7baa33]" />
              <h2 className="text-2xl font-black">Farmer Usage & Gains</h2>
            </div>
            <div className="grid gap-6">
              {farmerStories.map((story) => (
                <div
                  key={story.name}
                  className="grid overflow-hidden rounded-[30px] border border-[#ebefdf] bg-white shadow-[0_14px_40px_rgba(32,48,20,0.08)] md:grid-cols-[280px_1fr]"
                >
                  <div
                    className="min-h-[220px] bg-cover bg-center md:min-h-full"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.18)), url(${story.image})` }}
                  />
                  <div className="flex flex-col justify-center p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-[#243224]">{story.name}</h3>
                        <p className="mt-1 text-sm text-[#74806e]">{story.place}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-[#edf6dd] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6ea72f]">
                        {story.metric}
                      </span>
                    </div>
                    <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#5f6f5c]">{story.gain}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="farm-section-card overflow-hidden bg-[linear-gradient(180deg,#f5f8ec_0%,#ffffff_100%)]">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-stretch">
              <div className="rounded-[30px] bg-[#1d3418] p-6 text-white md:p-8">
                <div className="mb-5 flex items-center gap-2 text-[#c7f28c]">
                  <Languages size={18} />
                  <h2 className="text-2xl font-black">Multilingual Chatbot in Daily Use</h2>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-[#d9ffae]">
                    <Mic size={24} />
                  </div>
                  <h3 className="text-xl font-black">Speak or type in your language</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/82">
                    The assistant feels more useful when farmers can ask in familiar language and get advice that the whole family can understand quickly.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {['English', 'Hindi', 'Punjabi', 'Gujarati', 'Telugu'].map((item) => (
                      <span key={item} className="rounded-full bg-white/12 px-3 py-2 text-xs font-semibold text-white/88">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {languageBenefits.map((point, index) => (
                  <div
                    key={point}
                    className="flex items-start gap-4 rounded-[26px] border border-[#e7edd8] bg-white p-5 shadow-[0_10px_28px_rgba(33,47,20,0.05)]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf6dd] text-[#6ea72f]">
                      {index === 0 ? <MessageSquareQuote size={20} /> : index === 1 ? <Languages size={20} /> : <Mic size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b8a72]">
                        {index === 0 ? 'Local answers' : index === 1 ? 'Family friendly' : 'Field ready'}
                      </p>
                      <p className="mt-2 text-base leading-relaxed text-[#50614d]">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="farm-section-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#243224]">
              <IndianRupee size={18} className="text-[#7baa33]" />
              <h2 className="text-2xl font-black">Live Crop Price Snapshot</h2>
            </div>
            <span className="rounded-full bg-[#edf6dd] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6ea72f]">
              Public mandi reference
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {marketPrices.map((item) => (
              <div key={`${item.crop}-${item.market}`} className="rounded-[28px] border border-[#ebefdf] bg-[#fafbf7] p-5 shadow-[0_12px_36px_rgba(32,48,20,0.06)]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7d8978]">{item.market}</p>
                <h3 className="mt-2 text-2xl font-black text-[#243224]">{item.crop}</h3>
                <p className="mt-4 text-3xl font-black text-[#6ea72f]">{item.price}</p>
                <p className="mt-2 text-sm text-[#657261]">Updated: {item.updated}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-[#66725f]">
            Prices are shown as a latest public mandi snapshot to help farmers compare market direction quickly before selling.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
