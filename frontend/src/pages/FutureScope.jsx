import { Rocket, Languages, LineChart, WifiOff, RefreshCw } from 'lucide-react';
import heroImage from '../assets/farmf.jpg';
import { useAuth } from '../context/AuthContext';
import { translate } from '../utils/translations';

const FutureScope = () => {
  const { language } = useAuth();
  const t = (key) => translate(language, key);

  const items = [
    { icon: Rocket, text: 'Improve AI models for more accurate crop recommendations and disease detection.' },
    { icon: Languages, text: 'Add support for more regional languages and dialects to increase accessibility.' },
    { icon: LineChart, text: 'Integrate real-time market price information for better crop selling decisions.' },
    { icon: WifiOff, text: 'Enhance offline capabilities for seamless use in low-internet areas.' },
    { icon: RefreshCw, text: 'Use farmer feedback and usage data for continuous system improvement.' },
  ];

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8">
        <section className="farm-banner min-h-[180px] md:min-h-[240px]" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content text-center max-w-3xl mx-auto">
            <div className="farm-badge mx-auto mb-5">
              <Rocket size={14} />
              <span>{t('futureScopeTitle')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black">{t('futureScopeTitle')}</h1>
            <p className="mt-4 text-white/82 text-base md:text-lg">{t('futureScopeSubtitle')}</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item, index) => (
            <article key={index} className="farm-section-card flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#edf6dd] text-[#7baa33] flex items-center justify-center shrink-0">
                <item.icon size={24} />
              </div>
              <p className="text-[#495545] leading-relaxed">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="farm-section-card bg-gradient-to-r from-[#1f3d18] via-[#345926] to-[#79b43a] text-white">
          <p className="text-lg leading-relaxed max-w-4xl">{t('futureScopeClosing')}</p>
        </section>
      </div>
    </div>
  );
};

export default FutureScope;
