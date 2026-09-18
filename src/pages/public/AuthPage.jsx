import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import SEO from '../../components/common/SEO';

export default function AuthPage() {
  const { user, login, register, logout } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  if (user) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-16">
        <SEO
          title="My Account"
          description="Manage your Softy account, orders, and wishlist."
          noIndex
        />
        <div className="bg-white border border-line rounded p-8 text-center">
          <div className="w-20 h-20 bg-oxblood text-white rounded-full flex items-center justify-center text-2xl font-serif mx-auto mb-4">{user.name?.[0]?.toUpperCase() || 'U'}</div>
          <h2 className="font-serif text-2xl mb-2">Welcome, {user.name}</h2>
          <p className="text-charcoal/60 text-sm mb-6">{user.email}</p>
          {user.phone && <p className="text-sm text-charcoal/60 mb-6">Phone: {user.phone}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/my-orders" className="bg-oxblood text-white px-6 py-3 text-xs tracking-wider uppercase hover:bg-oxblood-dark transition-colors">My Orders</Link>
            <Link to="/wishlist" className="border border-charcoal text-charcoal px-6 py-3 text-xs tracking-wider uppercase hover:bg-charcoal hover:text-white transition-colors">My Wishlist</Link>
            <button onClick={() => { logout(); toast.success('Logged out'); }} className="border border-red-300 text-red-500 px-6 py-3 text-xs tracking-wider uppercase hover:bg-red-50 transition-colors">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[460px] mx-auto px-4 py-16">
      <SEO
        title="Login or Register"
        description="Sign in or create a Softy account to manage your orders and wishlist."
        noIndex
      />
      <div className="bg-white border border-line rounded p-8">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl mb-1">Softy</h1>
          <p className="text-charcoal/50 text-sm">Gentle care for real skin</p>
        </div>
        <div className="flex border-b border-line mb-6">
          <button onClick={() => setTab('login')} className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${tab === 'login' ? 'border-b-2 border-oxblood text-oxblood font-semibold' : 'text-charcoal/50 hover:text-charcoal'}`}>Login</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${tab === 'register' ? 'border-b-2 border-oxblood text-oxblood font-semibold' : 'text-charcoal/50 hover:text-charcoal'}`}>Register</button>
        </div>
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" /></div>
            <PasswordField value={form.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword((prev) => !prev)} />
            <button type="submit" disabled={loading} className="w-full bg-oxblood text-white py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div><label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Full Name</label><input name="name" value={form.name} onChange={handleChange} required className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" /></div>
            <div><label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" /></div>
            <div><label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-line px-4 py-3 text-sm focus:border-oxblood focus:outline-none" /></div>
            <PasswordField value={form.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword((prev) => !prev)} minLength={6} />
            <button type="submit" disabled={loading} className="w-full bg-oxblood text-white py-3.5 text-xs tracking-[0.16em] uppercase hover:bg-oxblood-dark transition-colors disabled:opacity-50">{loading ? 'Creating account...' : 'Create Account'}</button>
          </form>
        )}
        <div className="text-center mt-6"><Link to="/" className="text-xs text-charcoal/50 hover:text-oxblood-dark">Back to Store</Link></div>
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggle, minLength }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-charcoal/60 block mb-1.5">Password</label>
      <div className="relative">
        <input
          name="password"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          minLength={minLength}
          className="w-full border border-line px-4 py-3 pr-12 text-sm focus:border-oxblood focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/45 hover:text-oxblood transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
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
  );
}
