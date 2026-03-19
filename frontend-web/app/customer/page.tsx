'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    logo?: string;
    address: string;
    city: string;
    rating: number;
    distance?: number;
    category: {
        name: string;
        nameAr: string;
        icon?: string;
    };
    _count: {
        products: number;
    };
}

interface Category {
    id: string;
    name: string;
    nameAr: string;
    icon?: string;
}

interface User {
    id: string;
    fullName: string;
    email: string;
}

export default function CustomerPage() {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [storesRes, categoriesRes] = await Promise.all([
                fetch(`http://localhost:3000/api/stores${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`),
                fetch('http://localhost:3000/api/categories'),
            ]);

            const [storesData, categoriesData] = await Promise.all([
                storesRes.json(),
                categoriesRes.json(),
            ]);

            if (storesData.success) setStores(storesData.data.stores);
            if (categoriesData.success) setCategories(categoriesData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const isRtl = i18n.language === 'ar';
    const nameKey = isRtl ? 'nameAr' : 'name';

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
            {/* Header */}
            <header className="glass p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-glow">
                            <span className="text-xl font-bold text-white">MW</span>
                        </div>
                        <span className="text-xl font-bold text-white">My World</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        {user ? (
                            <>
                                <Link href="/customer/orders" className="btn-secondary text-sm py-2 px-3 flex items-center gap-2">
                                    <span>📦</span>
                                    <span className="hidden md:inline">طلباتي</span>
                                </Link>
                                <span className="text-gray-300 hidden md:inline">{t('common.hello')}، {user.fullName}</span>
                                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm">
                                    {t('common.logout')}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => router.push('/')}
                                className="btn-primary text-sm py-2 px-4"
                            >
                                {t('common.login')}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative overflow-hidden py-16 px-4">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {t('customer.discoverWorld')}
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        {t('customer.shopBestStores')}
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto mb-10">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('customer.searchPlaceholder')}
                                className="input-field pr-12 text-lg"
                                style={{ textAlign: isRtl ? 'right' : 'left' }}
                            />
                            <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-2xl`}>🔍</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {user && (
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/customer/subscriptions" className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-white/10 transition group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">🏋️</span>
                                <span className="font-bold text-white">اشتراكاتي الرياضية</span>
                            </Link>
                            <Link href="/customer/loyalty" className="glass-card px-6 py-3 flex items-center gap-3 hover:bg-white/10 transition group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">🎁</span>
                                <span className="font-bold text-white">برنامج الولاء</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-6xl mx-auto px-4 mb-8">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {t('customer.all')}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat[nameKey as keyof Category] || cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stores Grid */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                <h2 className="text-2xl font-bold text-white mb-6">{t('customer.nearbyStores')}</h2>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4">🏪</div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('customer.noStoresFound')}</h3>
                        <p className="text-gray-400">{t('customer.tryOtherCategory')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <div
                                key={store.id}
                                className="glass-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
                                onClick={() => router.push(`/customer/store/${store.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl">
                                        {store.category.icon || '🏪'}
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
                                        <span className="text-amber-400">⭐</span>
                                        <span className="text-amber-400 font-bold">{store.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">
                                    {isRtl ? (store.nameAr || store.name) : store.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {isRtl ? (store.category.nameAr || store.category.name) : store.category.name}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>📍</span>
                                        <span>{store.city}</span>
                                        {store.distance && (
                                            <span className="text-blue-400">• {store.distance} km</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>📦</span>
                                        <span>{store._count.products} {t('seller.product')}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <button className="w-full btn-primary text-sm py-2">
                                        {t('customer.viewStore')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="glass py-8 px-4 text-center">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <span>🌍</span>
                        </div>
                        <span className="text-lg font-bold text-white">My World</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {t('customer.footerText')}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        {t('customer.rightsReserved')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
