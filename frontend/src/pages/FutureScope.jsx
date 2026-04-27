import { Rocket, Languages, LineChart, WifiOff, RefreshCw } from 'lucide-react';
import heroImage from '../assets/farmf.jpg';

const FutureScope = () => {
  const items = [
    { icon: Rocket, text: 'Smarter crop and pest models with stronger retraining checks and richer field-level confidence reporting.' },
    { icon: Languages, text: 'More regional language support, including simpler farmer-first guidance and voice-led interactions.' },
    { icon: LineChart, text: 'Live mandi pricing, trend views, and local selling insights connected to crop planning decisions.' },
    { icon: WifiOff, text: 'Deeper offline support so core advisories remain useful even when the field has weak connectivity.' },
    { icon: RefreshCw, text: 'Farmer feedback loops that keep improving recommendations, workflows, and practical usefulness over time.' },
  ];

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8">
        <section className="farm-banner min-h-[180px] md:min-h-[240px]" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content text-center max-w-3xl mx-auto">
            <div className="farm-badge mx-auto mb-5">
              <Rocket size={14} />
              <span>Upcoming Features</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black">Upcoming Features</h1>
            <p className="mt-4 text-white/82 text-base md:text-lg">
              This page shows what is coming next in the platform as we expand the project beyond the current release.
            </p>
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
          <p className="text-lg leading-relaxed max-w-4xl">
            These are upcoming features, not live modules yet. The goal is to keep the current system practical now while clearly showing the next capabilities planned for farmers.
          </p>
        </section>
      </div>
    </div>
  );
};

export default FutureScope;
