import { useState, useRef } from 'react';
import { Bug, Upload, X, Loader2, Leaf } from 'lucide-react';
import heroImage from '../assets/hero.png';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { formatConfidence } from '../utils/formatters';
import { translate } from '../utils/translations';

const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { isOffline, token, language } = useAuth();
  const t = (key) => translate(language, key);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      setError(t('uploadImageFirst'));
      return;
    }
    if (isOffline) {
      setError(t('offlineDiseaseError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      const response = await api.post('/api/services/detect-disease', formData, {
        headers: getAuthHeaders(token),
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze the image. Make sure the ML service is running.');
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
              <Leaf size={14} />
              <span>{t('pestDiseaseDetection')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black">Upload Leaf Image</h1>
            <p className="mt-4 text-white/82 text-base md:text-lg">Supported crops: Potato, Tomato, Corn, Rice</p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto">
          <div className="farm-section-card">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-[#243224]">Upload Leaf Image</h2>
              <p className="text-[#778270] mt-2">Supported crops: Potato, Tomato, Corn, Rice</p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!preview ? (
              <div className="farm-upload-zone cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="mx-auto w-16 h-16 rounded-full bg-[#eaf5da] flex items-center justify-center text-[#7baa33]">
                  <Upload size={30} />
                </div>
                <p className="mt-5 text-lg font-bold text-[#263826]">{t('tapToUpload')}</p>
                <p className="mt-2 text-sm text-[#7a8674]">{t('takePhotoHint')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative">
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 z-10 rounded-full bg-white text-[#d14343] p-2 shadow-lg"
                  >
                    <X size={18} />
                  </button>
                  <img src={preview} alt="Preview" className="w-full h-72 object-cover rounded-[28px]" />
                </div>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="farm-submit-button inline-flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="animate-spin" size={18} /> {t('analyzing')}</> : <><Bug size={18} /> {t('analyzePlant')}</>}
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
        </section>

        {result && (
          <section className="max-w-3xl mx-auto">
            <div className={`farm-section-card text-white ${result.disease === 'Healthy' ? 'bg-gradient-to-br from-[#1e5f32] to-[#4fa35f]' : 'bg-gradient-to-br from-[#5b231f] to-[#b1483d]'}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/65">{t('detectionResult')}</p>
                  <h2 className="text-4xl font-black mt-2">{result.disease}</h2>
                </div>
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold">
                  {formatConfidence(result.confidence)} {t('match')}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-white/10 p-5 border border-white/10">
                  <h3 className="font-semibold mb-2">{t('summary')}</h3>
                  <p className="text-white/85 leading-relaxed">{result.summary}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 border border-white/10">
                  <h3 className="font-semibold mb-2">{t('treatment')}</h3>
                  <p className="text-white/85 leading-relaxed">{result.treatment}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetection;
