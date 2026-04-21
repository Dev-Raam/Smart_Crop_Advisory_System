import { useRef, useState } from 'react';
import { AlertCircle, Bug, Loader2, ScanSearch, Upload, X } from 'lucide-react';
import heroImage from '../assets/pestdet.jpg';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { formatConfidence } from '../utils/formatters';
import { translate } from '../utils/translations';

const supportedPests = ['Aphids', 'Armyworm', 'Beetle', 'Bollworm', 'Grasshopper', 'Mites', 'Mosquito', 'Sawfly', 'Stem borer'];

const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { isOffline, token, language } = useAuth();
  const t = (key) => translate(language, key);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

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
      setError(err.response?.data?.message || 'Failed to analyze the image. Make sure the backend and ML service are running.');
    } finally {
      setLoading(false);
    }
  };

  const label = result?.label || result?.disease;

  return (
    <div className="farm-page">
      <div className="farm-content space-y-8">
        <section className="farm-banner min-h-[220px]" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="farm-banner-content mx-auto max-w-4xl text-center">
            <div className="farm-badge mx-auto mb-5">
              <Bug size={14} />
              <span>{t('pestDiseaseDetection')}</span>
            </div>
            <h1 className="text-4xl font-black md:text-5xl">Pest Detection Studio</h1>
            <p className="mt-4 text-base text-white/82 md:text-lg">
              Upload a clear crop image to classify likely pest patterns and get response guidance.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="farm-section-card">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf6dd] text-[var(--color-primary)]">
                <ScanSearch size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#243224]">Image upload</h2>
                <p className="text-sm text-[#71806e]">Best results come from a close, bright image with the pest or damaged area visible.</p>
              </div>
            </div>

            {error ? (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {!preview ? (
              <div className="farm-upload-zone cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf5da] text-[#7baa33]">
                  <Upload size={30} />
                </div>
                <p className="mt-5 text-lg font-bold text-[#263826]">{t('tapToUpload')}</p>
                <p className="mt-2 text-sm text-[#7a8674]">{t('takePhotoHint')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 text-[#d14343] shadow-lg"
                  >
                    <X size={18} />
                  </button>
                  <img src={preview} alt="Preview" className="h-80 w-full rounded-[28px] object-cover" />
                </div>

                <button
                  type="button"
                  onClick={analyzeImage}
                  disabled={loading}
                  className="farm-submit-button inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {t('analyzing')}
                    </>
                  ) : (
                    <>
                      <Bug size={18} />
                      Analyze pest image
                    </>
                  )}
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

          <div className="farm-section-card">
            <div className="mb-5 flex items-center gap-2 text-[#314331]">
              <AlertCircle size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-2xl font-black">Supported pest classes</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {supportedPests.map((item) => (
                <span key={item} className="rounded-full border border-[#dbe5c7] bg-[#f6f9ef] px-3 py-2 text-sm font-semibold text-[#4f6343]">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] bg-[#fafbf7] p-5 text-sm leading-relaxed text-[#5f6f5d]">
              The current backend now supports a trainable pest classifier artifact. If the trained model file is missing, it falls back to visual heuristics and tells you the result should be verified in the field.
            </div>
          </div>
        </section>

        {result ? (
          <section className="mx-auto max-w-4xl">
            <div className="farm-section-card bg-gradient-to-br from-[#1d3418] via-[#2c4f22] to-[#7baa33] text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/65">{t('detectionResult')}</p>
                  <h2 className="mt-2 text-4xl font-black">{label}</h2>
                  {result.source ? <p className="mt-2 text-sm text-white/70">Source: {result.source}</p> : null}
                </div>
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold">
                  {formatConfidence(result.confidence)} {t('match')}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                  <h3 className="mb-2 font-semibold">{t('summary')}</h3>
                  <p className="leading-relaxed text-white/85">{result.summary}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                  <h3 className="mb-2 font-semibold">{t('treatment')}</h3>
                  <p className="leading-relaxed text-white/85">{result.treatment}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default DiseaseDetection;
