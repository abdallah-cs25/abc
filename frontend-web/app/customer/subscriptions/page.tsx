'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Subscription {
    id: string;
    gymId: string;
    name: string; // Gym name
    type: string; // Plan name
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    startDate: string;
    endDate: string;
    price: number;
    qrCode?: string;
}

export default function MySubscriptionsPage() {
    const { t } = useTranslation();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchSubscriptions(token);
    }, [router]);

    const fetchSubscriptions = async (token: string) => {
        try {
            const res = await fetch('http://localhost:3000/api/subscriptions/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSubscriptions(data.data);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/customer" className="text-gray-400 hover:text-white mb-6 block transition-colors">
                    ← {t('common.back') || 'العودة للرئيسية'}
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">اشتراكاتي الرياضية</h1>
                        <p className="text-gray-400">إدارة اشتراكات الجيم والوصول للكود الخاص بك</p>
                    </div>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4">🏋️</div>
                        <h3 className="text-xl font-bold mb-2">لا توجد اشتراكات نشطة</h3>
                        <p className="text-gray-400 mb-6">لم تقم بالاشتراك في أي صالة رياضية بعد</p>
                        <Link href="/customer/map" className="btn-primary inline-flex items-center gap-2">
                            🔍 استكشف الصالات الرياضية
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="glass-card overflow-hidden hover:scale-[1.02] transition-transform">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{sub.name}</h3>
                                        <span className="text-amber-400 text-sm font-medium">{sub.type} Plan</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                            sub.status === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {sub.status === 'ACTIVE' ? 'نشط' : sub.status === 'EXPIRED' ? 'منتهي' : 'قيد الانتظار'}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <span>📅</span>
                                        <div className="text-sm">
                                            <p className="text-gray-400 text-xs">فترة الاشتراك</p>
                                            <p>{new Date(sub.startDate).toLocaleDateString('ar-DZ')} - {new Date(sub.endDate).toLocaleDateString('ar-DZ')}</p>
                                        </div>
                                    </div>

                                    {/* QR Code Placeholder/Display */}
                                    <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 mt-4">
                                        {/* Assuming QR code is an image URL or generating it on client, 
                                            for now using a placeholder icon if no URL provided by backend yet */}
                                        <div className="w-32 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                                            <span className="text-4xl">🏁</span>
                                        </div>
                                        <p className="text-black text-xs font-bold text-center mt-1">امسح الكود عند الدخول</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
