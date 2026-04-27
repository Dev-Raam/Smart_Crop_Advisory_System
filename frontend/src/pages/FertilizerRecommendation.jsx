import { useState } from 'react';
import { FlaskConical, Leaf, Search, Sprout, Waves, Droplets } from 'lucide-react';
import heroImage from '../assets/corn-field.jpg';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { FERTILIZER_CROP_OPTIONS, FERTILIZER_SOIL_OPTIONS } from '../lib/fertilizerOptions';
import { formatConfidence } from '../utils/formatters';

const FertilizerRecommendation = () => {
  const { token, isOffline } = useAuth();
  const [formData, setFormData] = useState({
    crop: 'Wheat',
    soil: 'Loamy Soil',
    nitrogen: 50,
    phosphorus: 50,
    potassium: 50,
    temperature: 26,
    humidity: 50,
    moisture: 40,
    ph: 6.8,
    rainfall: 110,
    carbon: 1.2,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = ['crop', 'soil'].includes(name) ? value : Number.parseFloat(value);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isOffline) {
      setError('Fertilizer recommendation needs an online ML service connection.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/services/recommend-fertilizer', formData, {
        headers: getAuthHeaders(token),
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get fertilizer recommendation. Make sure the ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8">
        <section className="farm-banner min-h-[190px] md:min-h-[240px]" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content text-center max-w-4xl mx-auto">
            <div className="farm-badge mx-auto mb-5">
              <FlaskConical size={14} />
              <span>Fertilizer Recommendation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black">Input Data</h1>
            <p className="mt-4 text-white/82 text-base md:text-lg">
              Enter crop details, soil type, and nutrient values to get a fertilizer recommendation from your dataset-driven model.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          <div className="rounded-[32px] border border-[#ecefe2] bg-white p-6 shadow-[0_20px_50px_rgba(35,45,20,0.08)] md:p-8">
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[#7baa33]">
                  <Sprout size={18} />
                  <h2 className="text-lg font-black uppercase tracking-[0.08em]">Crop & Soil Profile</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="farm-label">Crop Type</label>
                    <select name="crop" className="farm-field" value={formData.crop} onChange={handleChange}>
                      {FERTILIZER_CROP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="farm-label">Soil Type</label>
                    <select name="soil" className="farm-field" value={formData.soil} onChange={handleChange}>
                      {FERTILIZER_SOIL_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-[#7baa33]">
                  <Leaf size={18} />
                  <h2 className="text-lg font-black uppercase tracking-[0.08em]">Nutrient Levels</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="farm-label">Nitrogen (N)</label>
                    <input type="number" step="0.1" name="nitrogen" className="farm-field" value={formData.nitrogen} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Phosphorus (P)</label>
                    <input type="number" step="0.1" name="phosphorus" className="farm-field" value={formData.phosphorus} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Potassium (K)</label>
                    <input type="number" step="0.1" name="potassium" className="farm-field" value={formData.potassium} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-[#7baa33]">
                  <Droplets size={18} />
                  <h2 className="text-lg font-black uppercase tracking-[0.08em]">Environmental Data</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="farm-label">Temperature</label>
                    <input type="number" step="0.1" name="temperature" className="farm-field" value={formData.temperature} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Humidity</label>
                    <input type="number" step="0.1" name="humidity" className="farm-field" value={formData.humidity} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Moisture</label>
                    <input type="number" step="0.1" name="moisture" className="farm-field" value={formData.moisture} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">pH</label>
                    <input type="number" step="0.1" name="ph" className="farm-field" value={formData.ph} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Rainfall</label>
                    <input type="number" step="0.1" name="rainfall" className="farm-field" value={formData.rainfall} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="farm-label">Carbon</label>
                    <input type="number" step="0.1" name="carbon" className="farm-field" value={formData.carbon} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || isOffline} className="farm-submit-button inline-flex items-center justify-center gap-2">
                <Search size={18} />
                <span>{loading ? 'Getting recommendation...' : 'Get Fertilizer Recommendation'}</span>
              </button>
            </form>
          </div>
        </section>

        {result ? (
          <section className="max-w-5xl mx-auto">
            <div className="farm-section-card bg-gradient-to-br from-[#1d3418] via-[#2c4f22] to-[#7baa33] text-white">
              <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Recommended Fertilizer</p>
                  <h2 className="mt-2 text-4xl font-black">{result.fertilizer}</h2>
                  <p className="mt-4 leading-relaxed text-white/85">{result.explanation}</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                    <p className="text-sm text-white/70">Confidence</p>
                    <p className="mt-2 text-3xl font-black">{formatConfidence(result.confidence)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                    <div className="flex items-center gap-2 text-white/85">
                      <Waves size={16} />
                      <p className="text-sm font-semibold">Applied profile</p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/82">
                      {formData.crop} in {formData.soil} with N:{formData.nitrogen}, P:{formData.phosphorus}, K:{formData.potassium}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default FertilizerRecommendation;
