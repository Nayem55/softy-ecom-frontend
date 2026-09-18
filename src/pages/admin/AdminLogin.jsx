import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SEO from '../../components/common/SEO';
import { API_BASE_URL } from '../../api/axios';

const adminAPI = axios.create({ baseURL: API_BASE_URL });
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('softy_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('softy_admin_token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    adminAPI
      .get('/auth/admin/me')
      .then(() => navigate('/admin'))
      .catch(() => {
        localStorage.removeItem('softy_admin_token');
        setCheckingAuth(false);
      });
  }, [navigate]);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
        email: email.trim(),
        password,
      });
      localStorage.setItem('softy_admin_token', data.token);
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => navigate('/admin'), 800);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-oxblood border-t-transparent rounded-full animate-spin" />
          <p className="text-charcoal/60 text-sm font-medium tracking-wide">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4">
      <SEO
        title="Admin Login"
        description="Softy ecommerce admin login."
        noIndex
      />
      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium tracking-wide transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-oxblood text-ivory'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-line overflow-hidden">
        {/* Header */}
        <div className="bg-oxblood px-8 py-10 text-center">
          <h1 className="text-2xl font-bold text-ivory tracking-[0.15em] uppercase">
            Softy
          </h1>
          <p className="text-gold mt-2 text-sm tracking-widest uppercase font-medium">
            Admin Panel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-charcoal mb-2 tracking-wide"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@softy.local"
              className="w-full px-4 py-3 rounded-lg border border-line bg-ivory/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-oxblood/40 focus:border-oxblood transition-all text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-charcoal mb-2 tracking-wide"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-line bg-ivory/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-oxblood/40 focus:border-oxblood transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/45 hover:text-oxblood transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.595 0 3.106-.356 4.459-.992M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-oxblood hover:bg-oxblood-dark text-ivory font-semibold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <Link
            to="/"
            className="text-xs text-charcoal/50 hover:text-oxblood transition-colors tracking-wide"
          >
            &larr; Back to Store
          </Link>
        </div>
      </div>

      {/* Brand watermark */}
      <p className="mt-8 text-xs text-charcoal/30 tracking-[0.2em] uppercase font-medium">
        &copy; {new Date().getFullYear()} Softy
      </p>
    </div>
  );
}
