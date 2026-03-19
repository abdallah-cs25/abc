'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    nameAr: string;
}

export default function NewStorePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        nameAr: '',
        description: '',
        categoryId: '',
        city: '',
        wilaya: '',
        address: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) { router.push('/'); return; }
        const user = JSON.parse(userData);
        if (user.role !== 'SELLER') { router.push('/'); return; }

        // Fetch categories
        fetch('http://localhost:3000/api/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setCategories(data.data);
                    setForm(prev => ({ ...prev, categoryId: data.data[0].id }));
                }
            })
            .catch(console.error);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const token = localStorage.getItem('token');

        // Generate a slug from the store name
        const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

        try {
            const response = await fetch('http://localhost:3000/api/stores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...form, slug }),
            });

            const data = await response.json();
            if (data.success) {
                router.push('/seller/stores');
            } else {
                setError(data.message || data.messageAr || 'فشل إنشاء المتجر');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const WILAYAS = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Sidi Bel Abbès', 'Béjaïa', 'Tizi Ouzou'];

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="sidebar w-64 fixed h-full p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                        <span className="text-xl">🌍</span>
                    </div>
                    <span className="text-xl font-bold text-white">My World</span>
                </div>
                <nav className="flex-1 space-y-2">
                    <Link href="/seller" className="sidebar-link"><span>📊</span><span>لوحة التحكم</span></Link>
                    <Link href="/seller/stores" className="sidebar-link active"><span>🏪</span><span>متاجري</span></Link>
                    <Link href="/seller/products" className="sidebar-link"><span>📦</span><span>المنتجات</span></Link>
                    <Link href="/seller/orders" className="sidebar-link"><span>🛒</span><span>الطلبات</span></Link>
                    <Link href="/seller/earnings" className="sidebar-link"><span>💰</span><span>الأرباح</span></Link>
                </nav>
                <div className="border-t border-white/10 pt-4 mt-4">
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <span>🚪</span><span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller/stores" className="text-gray-400 hover:text-white transition">
                        ← رجوع
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">إنشاء متجر جديد</h1>
                        <p className="text-gray-400">أدخل بيانات متجرك الجديد</p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                        {/* Store Names */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">اسم المتجر (بالإنجليزية)</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="input-field"
                                    placeholder="My Shop"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">اسم المتجر (بالعربية)</label>
                                <input
                                    type="text"
                                    value={form.nameAr}
                                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                                    className="input-field"
                                    placeholder="متجري"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">وصف المتجر</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="input-field min-h-[100px]"
                                placeholder="اكتب وصفاً مختصراً لمتجرك..."
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">فئة المتجر</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="input-field"
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">الولاية</label>
                                <select
                                    value={form.wilaya}
                                    onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">اختر الولاية</option>
                                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">المدينة</label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="input-field"
                                    placeholder="الجزائر العاصمة"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">العنوان التفصيلي</label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="input-field"
                                placeholder="شارع، حي، رقم..."
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">رقم هاتف المتجر</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="input-field"
                                placeholder="0550000000"
                                required
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-gold py-3 disabled:opacity-50"
                            >
                                {loading ? 'جاري الإنشاء...' : '🏪 إنشاء المتجر'}
                            </button>
                            <Link
                                href="/seller/stores"
                                className="flex-1 bg-white/5 text-gray-300 py-3 rounded-xl hover:bg-white/10 transition text-center"
                            >
                                إلغاء
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
