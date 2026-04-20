import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, User, Phone, Lock, Languages, UserPlus } from 'lucide-react';
import heroImage from '../assets/hero.png';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { LANGUAGE_OPTIONS } from '../lib/constants';
import { translate } from '../utils/translations';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', password: '', language: 'en' });
  const [error, setError] = useState('');
  const { login, language } = useAuth();
  const navigate = useNavigate();
  const t = (key) => translate(language, key);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/api/auth/register', formData);
      login(res.data.user, res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="farm-auth-shell" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="farm-auth-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#dff28d] to-[#6daa2b] flex items-center justify-center text-white shadow-[0_14px_35px_rgba(109,166,47,0.35)] mb-4">
            <Sprout size={28} />
          </div>
          <h2 className="text-3xl font-black text-[#243224]">{t('registerTitle')}</h2>
          <p className="text-[#6c7765] text-sm mt-2 text-center">Create your farming account and start using smart tools.</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-2xl text-sm mb-6 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="farm-label">{t('fullName')}</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#90a086]" />
              <input
                type="text"
                name="name"
                className="farm-field pl-11"
                placeholder="Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="farm-label">{t('phoneNumber')}</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#90a086]" />
              <input
                type="tel"
                name="phone"
                className="farm-field pl-11"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="farm-label">{t('preferredLanguage')}</label>
            <div className="relative">
              <Languages size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#90a086]" />
              <select
                name="language"
                className="farm-field pl-11 appearance-none"
                value={formData.language}
                onChange={handleChange}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="farm-label">{t('password')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#90a086]" />
              <input
                type="password"
                name="password"
                className="farm-field pl-11"
                placeholder={t('createPassword')}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full farm-primary-button rounded-2xl">
            <span>{t('signUp')}</span>
            <UserPlus size={18} />
          </button>
        </form>

        <div className="farm-auth-divider mt-6">or</div>

        <p className="mt-6 text-center text-sm text-[#657061]">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-[#7baa33] font-semibold hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
