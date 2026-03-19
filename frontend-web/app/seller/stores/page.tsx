'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    logo?: string;
    address: string;
    city: string;
    rating: number;
    isActive: boolean;
    isVerified: boolean;
    category: {
        id: string;
        name: string;
        nameAr: string;
    };
    _count: {
        products: number;
        orderItems: number;
    };
}

export default function SellerStoresPage() {
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
        const user = JSON.parse(userData);
        if (user.role !== 'SELLER') {
            router.push('/');
            return;
        }
        fetchStores(token);
    }, [router]);

    const fetchStores = async (token: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/stores/my/stores', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
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
                    <Link href="/seller" className="sidebar-link">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/seller/stores" className="sidebar-link active">
                        <span>🏪</span>
                        <span>متاجري</span>
                    </Link>
                    <Link href="/seller/products" className="sidebar-link">
                        <span>📦</span>
                        <span>المنتجات</span>
                    </Link>
                    <Link href="/seller/orders" className="sidebar-link">
                        <span>🛒</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/seller/earnings" className="sidebar-link">
                        <span>💰</span>
                        <span>الأرباح</span>
                    </Link>
                </nav>

                <div className="border-t border-white/10 pt-4 mt-4">
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <span>🚪</span>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">متاجري</h1>
                        <p className="text-gray-400">إدارة متاجرك</p>
                    </div>
                    <Link href="/seller/stores/new" className="btn-gold">
                        + إضافة متجر
                    </Link>
                </div>

                {/* Stores Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-4">🏪</div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد متاجر</h3>
                        <p className="text-gray-400 mb-4">ابدأ بإنشاء متجرك الأول</p>
                        <Link href="/seller/stores/new" className="btn-gold inline-block">
                            إنشاء متجر
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <div key={store.id} className="glass-card p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center text-3xl">
                                        🏪
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {store.isVerified && (
                                            <span className="badge badge-success">موثق ✓</span>
                                        )}
                                        {store.isActive ? (
                                            <span className="badge badge-primary">نشط</span>
                                        ) : (
                                            <span className="badge badge-error">معطل</span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{store.nameAr || store.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">{store.category.nameAr}</p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white/5 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{store._count.products}</p>
                                        <p className="text-xs text-gray-400">منتج</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-white">{store._count.orderItems}</p>
                                        <p className="text-xs text-gray-400">طلب</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm mb-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>📍</span>
                                        <span>{store.city} - {store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <span>⭐</span>
                                        <span>{store.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 btn-primary text-sm py-2">
                                        إدارة
                                    </button>
                                    <Link href={`/seller/products?store=${store.id}`} className="flex-1 bg-white/5 text-gray-300 py-2 rounded-lg text-center hover:bg-white/10 transition text-sm">
                                        المنتجات
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
