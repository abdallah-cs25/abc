'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Redirect based on role
        const role = data.data.user.role;
        if (role === 'ADMIN') {
          router.push('/admin');
        } else if (role === 'SELLER') {
          router.push('/seller');
        } else if (role === 'DRIVER') {
          router.push('/driver');
        } else {
          router.push('/customer');
        }
      } else {
        setError(data.messageAr || data.message || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)'
    }}>
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="glass-card w-full max-w-md p-8 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 animate-glow">
            <span className="text-3xl font-bold text-white">MW</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My World</h1>
          <p className="text-gray-400">مرحباً بك في منصتك</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@myworld.dz"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 transition">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>

        {/* Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray-400 text-sm mb-4">حسابات تجريبية</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setEmail('admin@myworld.dz'); setPassword('admin123'); }}
              className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/30 transition"
            >
              مدير النظام
            </button>
            <button
              type="button"
              onClick={() => { setEmail('seller@myworld.dz'); setPassword('seller123'); }}
              className="bg-amber-500/20 text-amber-300 px-3 py-2 rounded-lg hover:bg-amber-500/30 transition"
            >
              بائع
            </button>
            <button
              type="button"
              onClick={() => { setEmail('driver@myworld.dz'); setPassword('driver123'); }}
              className="bg-green-500/20 text-green-300 px-3 py-2 rounded-lg hover:bg-green-500/30 transition"
            >
              سائق
            </button>
            <button
              type="button"
              onClick={() => { setEmail('customer@myworld.dz'); setPassword('customer123'); }}
              className="bg-purple-500/20 text-purple-300 px-3 py-2 rounded-lg hover:bg-purple-500/30 transition"
            >
              زبون
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
