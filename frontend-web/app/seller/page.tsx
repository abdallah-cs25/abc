'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    logo?: string;
    rating: number;
    isActive: boolean;
    _count: {
        products: number;
        orderItems: number;
    };
}

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

export default function SellerDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'SELLER') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchStores(token);
    }, [router]);

    const fetchStores = async (token: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/stores/my/stores', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setStores(data.data);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" dir="rtl">
            {/* Sidebar - Right Side for RTL */}
            <aside className="w-64 fixed right-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4 flex flex-col border-l border-white/10">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">MW</span>
                    </div>
                    <span className="text-xl font-bold text-white">My World</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/seller" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/20 text-amber-400">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/seller/stores" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5">
                        <span>🏪</span>
                        <span>متاجري</span>
                    </Link>
                    <Link href="/seller/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5">
                        <span>📦</span>
                        <span>المنتجات</span>
                    </Link>
                    <Link href="/seller/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5">
                        <span>🛒</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/seller/earnings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5">
                        <span>💰</span>
                        <span>الأرباح</span>
                    </Link>
                    <Link href="/seller/subscriptions" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5">
                        <span>🏋️</span>
                        <span>اشتراكات الجيم</span>
                    </Link>
                </nav>

                <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="px-2 mb-4">
                        <p className="text-sm text-white font-medium">{user?.fullName}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400">بائع</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 w-full">
                        <span>🚪</span>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">مرحباً، {user?.fullName}</h1>
                        <p className="text-gray-400">إدارة متاجرك ومنتجاتك</p>
                    </div>
                    <Link href="/seller/stores/new" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90">
                        + إضافة متجر جديد
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">🏪</span>
                            <span className="text-amber-400 text-sm">متاجري</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stores.length}</p>
                        <p className="text-gray-400 text-sm">إجمالي المتاجر</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">📦</span>
                            <span className="text-green-400 text-sm">المنتجات</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {stores.reduce((sum, s) => sum + (s._count?.products || 0), 0)}
                        </p>
                        <p className="text-gray-400 text-sm">إجمالي المنتجات</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">🛒</span>
                            <span className="text-blue-400 text-sm">الطلبات</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {stores.reduce((sum, s) => sum + (s._count?.orderItems || 0), 0)}
                        </p>
                        <p className="text-gray-400 text-sm">إجمالي الطلبات</p>
                    </div>
                </div>

                {/* Stores Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">متاجري</h2>

                    {stores.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
                            <div className="text-5xl mb-4">🏪</div>
                            <h3 className="text-xl font-bold text-white mb-2">لا توجد متاجر بعد</h3>
                            <p className="text-gray-400 mb-4">ابدأ ببناء متجرك الأول الآن</p>
                            <Link href="/seller/stores/new" className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl">
                                إضافة متجر جديد
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stores.map((store) => (
                                <div key={store.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-amber-500/50 transition">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
                                            🏪
                                        </div>
                                        {store.isActive ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">نشط</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">متوقف</span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">{store.nameAr || store.name}</h3>
                                    <div className="flex items-center gap-1 text-amber-400 text-sm mb-4">
                                        <span>⭐</span>
                                        <span>{store.rating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400 mb-4">
                                        <span>📦 {store._count?.products || 0} منتج</span>
                                        <span>🛒 {store._count?.orderItems || 0} طلب</span>
                                    </div>
                                    <Link
                                        href={`/seller/stores/${store.id}`}
                                        className="block text-center bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition"
                                    >
                                        إدارة المتجر
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/seller/products/new" className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:border-amber-500/50 transition">
                            <span className="text-3xl mb-2 block">➕</span>
                            <span className="text-white">إضافة منتج</span>
                        </Link>
                        <Link href="/seller/orders" className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:border-amber-500/50 transition">
                            <span className="text-3xl mb-2 block">📋</span>
                            <span className="text-white">الطلبات الجديدة</span>
                        </Link>
                        <Link href="/seller/earnings" className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:border-amber-500/50 transition">
                            <span className="text-3xl mb-2 block">💰</span>
                            <span className="text-white">تقرير الأرباح</span>
                        </Link>
                        <Link href="/seller/products" className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/10 hover:border-amber-500/50 transition">
                            <span className="text-3xl mb-2 block">📦</span>
                            <span className="text-white">إدارة المنتجات</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
