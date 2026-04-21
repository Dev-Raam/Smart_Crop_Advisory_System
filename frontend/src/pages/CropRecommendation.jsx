import { useState } from 'react';
import { Search, Sprout, FlaskConical } from 'lucide-react';
import heroImage from '../assets/wheat.jpg';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { formatConfidence } from '../utils/formatters';
import { translate } from '../utils/translations';

const CropRecommendation = () => {
  const { token, isOffline, language } = useAuth();
  const [formData, setFormData] = useState({
    nitrogen: 80,
    phosphorus: 45,
    potassium: 40,
    temperature: 25,
    humidity: 70,
    ph: 6.5,
    rainfall: 150,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = (key) => translate(language, key);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: Number.parseFloat(e.target.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOffline) {
      setError(t('offlineCropError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/services/recommend-crop', formData, {
        headers: getAuthHeaders(token),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendation. Make sure the ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8">
        <section className="farm-banner min-h-[180px] md:min-h-[220px]" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content text-center max-w-3xl mx-auto">
            <div className="farm-badge mx-auto mb-5">
              <Sprout size={14} />
              <span>{t('cropRecommendation')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black">{t('cropRecommendation')}</h1>
            <p className="mt-4 text-white/82 text-base md:text-lg">{t('cropRecommendationSubtitle')}</p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <div className="farm-section-card">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-[#243224]">Enter Soil Details</h2>
              <p className="text-[#778270] mt-2">Check your Soil Health Card for these values</p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="farm-input-grid">
                <div>
                  <label className="farm-label">{t('nitrogen')}</label>
                  <input type="number" step="0.1" name="nitrogen" className="farm-field" value={formData.nitrogen} onChange={handleChange} required />
                </div>
                <div>
                  <label className="farm-label">{t('phosphorus')}</label>
                  <input type="number" step="0.1" name="phosphorus" className="farm-field" value={formData.phosphorus} onChange={handleChange} required />
                </div>
                <div>
                  <label className="farm-label">{t('potassium')}</label>
                  <input type="number" step="0.1" name="potassium" className="farm-field" value={formData.potassium} onChange={handleChange} required />
                </div>
                <div>
                  <label className="farm-label">{t('soilPh')}</label>
                  <input type="number" step="0.1" name="ph" className="farm-field" value={formData.ph} onChange={handleChange} required />
                </div>
                <div>
                  <label className="farm-label">{t('rainfall')}</label>
                  <input type="number" step="0.1" name="rainfall" className="farm-field" value={formData.rainfall} onChange={handleChange} required />
                </div>
                <div>
                  <label className="farm-label">{t('temperature')}</label>
                  <input type="number" step="0.1" name="temperature" className="farm-field" value={formData.temperature} onChange={handleChange} required />
                </div>
                <div className="md:col-span-2">
                  <label className="farm-label">{t('humidity')}</label>
                  <input type="number" step="0.1" name="humidity" className="farm-field" value={formData.humidity} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" disabled={loading || isOffline} className="farm-submit-button inline-flex items-center justify-center gap-2">
                <Search size={18} />
                <span>{loading ? 'Loading...' : 'Predict Best Crop'}</span>
              </button>
            </form>
          </div>
        </section>

        {result && (
          <section className="max-w-4xl mx-auto">
            <div className="farm-section-card bg-gradient-to-br from-[#1d3418] via-[#2c4f22] to-[#7baa33] text-white">
              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/65">{t('recommendedCrop')}</p>
                  <h2 className="text-4xl md:text-5xl font-black capitalize mt-2">{result.crop}</h2>
                  <p className="mt-5 text-white/85 leading-relaxed">{result.explanation}</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                    <p className="text-sm text-white/70">{t('confidence')}</p>
                    <p className="text-3xl font-black mt-2">{formatConfidence(result.confidence)}</p>
                  </div>
                  {result.fertilizer && (
                    <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-2 text-white/80">
                        <FlaskConical size={16} />
                        <p className="text-sm font-semibold">{t('fertilizerGuidance')}</p>
                      </div>
                      <p className="mt-3 leading-relaxed">
                        {result.fertilizer.name} for {result.fertilizer.crop} in {result.fertilizer.soil}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;
