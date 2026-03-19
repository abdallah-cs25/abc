'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface LoyaltyData {
    balance: number;
    tier: string;
    history: Array<{
        id: string;
        points: number;
        source: string;
        createdAt: string;
        order?: {
            orderNumber: string;
            total: number;
        };
    }>;
}

export default function LoyaltyPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<LoyaltyData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const res = await fetch('http://localhost:3000/api/loyalty/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const resData = await res.json();
            if (resData.success) {
                setData(resData.data);
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Platinum': return 'from-slate-300 to-slate-100';
            case 'Gold': return 'from-yellow-400 to-amber-600';
            case 'Silver': return 'from-gray-400 to-gray-200';
            default: return 'from-orange-400 to-orange-700'; // Bronze
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/customer" className="text-gray-400 hover:text-white mb-6 block transition-colors">
                    ← {t('common.back') || 'العودة للرئيسية'}
                </Link>

                {/* Loyalty Card */}
                <div className={`relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-br ${getTierColor(data?.tier || 'Bronze')} shadow-2xl transition-transform hover:scale-[1.01]`}>
                    <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-black/60 font-bold mb-1 uppercase tracking-widest">{t('loyalty.membership')}</p>
                            <h1 className="text-4xl font-black text-black mb-2">{data?.tier} {t('loyalty.member')}</h1>
                            <p className="text-black/70">{t('loyalty.earnPoints')}</p>
                        </div>
                        <div className="text-center md:text-right bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                            <p className="text-white/80 text-sm mb-1">{t('loyalty.balance')}</p>
                            <p className="text-5xl font-bold text-white">{data?.balance} <span className="text-xl">pts</span></p>
                        </div>
                    </div>
                </div>

                {/* Rewards Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-card p-6 text-center hover:bg-white/5 transition">
                        <div className="text-3xl mb-2">🎁</div>
                        <h3 className="font-bold mb-1">{t('loyalty.rewards')}</h3>
                        <p className="text-sm text-gray-400">{t('loyalty.rewardsDesc')}</p>
                    </div>
                    <div className="glass-card p-6 text-center hover:bg-white/5 transition">
                        <div className="text-3xl mb-2">⭐</div>
                        <h3 className="font-bold mb-1">{t('loyalty.status')}</h3>
                        <p className="text-sm text-gray-400">{t('loyalty.statusDesc')}</p>
                    </div>
                    <div className="glass-card p-6 text-center hover:bg-white/5 transition">
                        <div className="text-3xl mb-2">🛍️</div>
                        <h3 className="font-bold mb-1">{t('loyalty.earn')}</h3>
                        <p className="text-sm text-gray-400">{t('loyalty.earnDesc')}</p>
                    </div>
                </div>

                {/* Transactions History */}
                <h2 className="text-2xl font-bold mb-4">{t('loyalty.history')}</h2>
                <div className="glass-card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4 text-right">التاريخ</th>
                                <th className="p-4 text-right">النشاط</th>
                                <th className="p-4 text-left">النقاط</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {data?.history.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition">
                                    <td className="p-4 text-gray-300">
                                        {new Date(item.createdAt).toLocaleDateString('ar-DZ')}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-white">{item.source === 'order' ? t('loyalty.purchaseReward') : t('loyalty.bonus')}</div>
                                        {item.order && (
                                            <div className="text-xs text-gray-500">طلب #{item.order.orderNumber.slice(-8)} • {item.order.total} دج</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-left font-bold text-green-400" dir="ltr">
                                        +{item.points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data?.history.length === 0 && (
                        <div className="p-8 text-center text-gray-400">{t('loyalty.noHistory')}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
