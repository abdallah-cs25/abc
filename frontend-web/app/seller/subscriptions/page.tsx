'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, QrCode, Users, Plus } from 'lucide-react';

interface Subscription {
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number;
    status: string;
    startDate: string;
    endDate: string;
    user: {
        fullName: string;
        email: string;
    };
}

export default function GymSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSub, setNewSub] = useState({
        name: '',
        price: 0,
        duration: 30,
        userId: '',
    });
    const router = useRouter();

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/subscriptions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSubscriptions(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-green-400 bg-green-500/20';
            case 'EXPIRED': return 'text-red-400 bg-red-500/20';
            case 'CANCELLED': return 'text-gray-400 bg-gray-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/seller" className="text-gray-400 hover:text-white text-sm mb-2 block">← العودة للوحة التحكم</Link>
                        <h1 className="text-3xl font-bold">اشتراكات الجيم</h1>
                        <p className="text-gray-400">إدارة اشتراكات الأعضاء والباقات</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-gold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        إضافة اشتراك
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Users className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'ACTIVE').length}</p>
                            <p className="text-sm text-gray-400">اشتراك نشط</p>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Clock className="text-red-400" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'EXPIRED').length}</p>
                            <p className="text-sm text-gray-400">منتهي</p>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Calendar className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{subscriptions.length}</p>
                            <p className="text-sm text-gray-400">إجمالي</p>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <QrCode className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">QR</p>
                            <p className="text-sm text-gray-400">ماسح ضوئي</p>
                        </div>
                    </div>
                </div>

                {/* Subscriptions List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-4">🏋️</div>
                        <h3 className="text-xl font-bold mb-2">لا توجد اشتراكات</h3>
                        <p className="text-gray-400 mb-4">ابدأ بإضافة أول اشتراك لأعضاء الجيم</p>
                    </div>
                ) : (
                    <div className="glass-card overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">العضو</th>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">الباقة</th>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">المدة</th>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">الأيام المتبقية</th>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">الحالة</th>
                                    <th className="text-right px-6 py-4 text-gray-400 font-medium">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{sub.user?.fullName}</p>
                                            <p className="text-sm text-gray-400">{sub.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{sub.name}</p>
                                            <p className="text-sm text-amber-400">{sub.price} دج</p>
                                        </td>
                                        <td className="px-6 py-4">{sub.duration} يوم</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${getDaysRemaining(sub.endDate) < 7 ? 'text-red-400' : 'text-green-400'}`}>
                                                {getDaysRemaining(sub.endDate)} يوم
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(sub.status)}`}>
                                                {sub.status === 'ACTIVE' ? 'نشط' : sub.status === 'EXPIRED' ? 'منتهي' : 'ملغي'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-400 hover:text-blue-300 text-sm">عرض QR</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Subscription Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">إضافة اشتراك جديد</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">اسم الباقة</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="مثال: اشتراك شهري"
                                    value={newSub.name}
                                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">السعر (دج)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="0"
                                        value={newSub.price}
                                        onChange={(e) => setNewSub({ ...newSub, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">المدة (يوم)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                                        placeholder="30"
                                        value={newSub.duration}
                                        onChange={(e) => setNewSub({ ...newSub, duration: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني للعضو</label>
                                <input
                                    type="email"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                                    placeholder="student@example.com"
                                    value={newSub.userId}
                                    onChange={(e) => setNewSub({ ...newSub, userId: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">يجب أن يكون العضو مسجلاً في التطبيق</p>
                            </div>

                            <button
                                className="w-full btn-gold py-3 font-bold mt-4"
                                onClick={() => {
                                    // Handle creation logic here (placeholder for now)
                                    alert('سيتم إضافة خاصية إنشاء الاشتراك في التحديث القادم');
                                    setShowModal(false);
                                }}
                            >
                                إنشاء الاشتراك
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
