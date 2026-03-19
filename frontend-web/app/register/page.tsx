'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'CUSTOMER' // Default role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                // Auto login after register
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Redirect based on role
                const role = data.data.user.role;
                if (role === 'SELLER') router.push('/seller');
                else if (role === 'DRIVER') router.push('/driver');
                else router.push('/customer');
            } else {
                setError(data.messageAr || data.message || 'فشل التسجيل');
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
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">إنشاء حساب جديد</h1>
                    <p className="text-gray-400">انضم إلينا في My World</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">الاسم الكامل</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="محمد بن عبد الله"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">رقم الهاتف</label>
                        <input
                            type="tel"
                            className="input-field"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0550..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">نوع الحساب</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                                className={`p-2 rounded-lg border ${formData.role === 'CUSTOMER' ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-600 text-gray-400'}`}
                            >
                                زبون
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'SELLER' })}
                                className={`p-2 rounded-lg border ${formData.role === 'SELLER' ? 'border-amber-500 bg-amber-500/20 text-white' : 'border-gray-600 text-gray-400'}`}
                            >
                                بائع
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
                                className={`p-2 rounded-lg border ${formData.role === 'DRIVER' ? 'border-green-500 bg-green-500/20 text-white' : 'border-gray-600 text-gray-400'}`}
                            >
                                سائق
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full mt-6"
                    >
                        {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/" className="text-blue-400 hover:text-blue-300 transition">
                            سجل الدخول هنا
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
