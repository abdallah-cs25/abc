'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EarningOrder {
    id: string;
    total: number;
    createdAt: string;
    items: Array<{ totalPrice: number; storeId: string }>;
    commission?: {
        commissionRate: number;
        commissionAmount: number;
        sellerPayout: number;
    };
}

interface EarningsSummary {
    totalOrders: number;
    totalSales: number;
    totalCommissionPaid: number;
    totalPayout: number;
    orders: EarningOrder[];
}

export default function SellerEarningsPage() {
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) { router.push('/'); return; }
        const user = JSON.parse(userData);
        if (user.role !== 'SELLER') { router.push('/'); return; }
        fetchEarnings(token, user.id);
    }, [router]);

    const fetchEarnings = async (token: string, sellerId: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/commissions/seller/${sellerId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
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
                    <Link href="/seller" className="sidebar-link"><span>📊</span><span>لوحة التحكم</span></Link>
                    <Link href="/seller/stores" className="sidebar-link"><span>🏪</span><span>متاجري</span></Link>
                    <Link href="/seller/products" className="sidebar-link"><span>📦</span><span>المنتجات</span></Link>
                    <Link href="/seller/orders" className="sidebar-link"><span>🛒</span><span>الطلبات</span></Link>
                    <Link href="/seller/earnings" className="sidebar-link active"><span>💰</span><span>الأرباح</span></Link>
                </nav>
                <div className="border-t border-white/10 pt-4 mt-4">
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <span>🚪</span><span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">الأرباح</h1>
                    <p className="text-gray-400">تتبع أرباحك ومبيعاتك</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="stat-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{summary?.totalOrders || 0}</p>
                                        <p className="text-sm text-gray-400">طلب مكتمل</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <span className="text-2xl">💵</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{(summary?.totalSales || 0).toLocaleString()} دج</p>
                                        <p className="text-sm text-gray-400">إجمالي المبيعات</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                        <span className="text-2xl">📉</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-400">{(summary?.totalCommissionPaid || 0).toLocaleString()} دج</p>
                                        <p className="text-sm text-gray-400">عمولة المنصة</p>
                                    </div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-400">{(summary?.totalPayout || 0).toLocaleString()} دج</p>
                                        <p className="text-sm text-gray-400">صافي الأرباح</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Orders Table */}
                        {!summary?.orders || summary.orders.length === 0 ? (
                            <div className="card text-center py-12">
                                <div className="text-5xl mb-4">💰</div>
                                <h3 className="text-xl font-bold text-white mb-2">لا توجد مبيعات بعد</h3>
                                <p className="text-gray-400">ستظهر هنا أرباحك عند اكتمال أول طلب</p>
                            </div>
                        ) : (
                            <div className="card">
                                <h3 className="text-lg font-bold text-white mb-4">تفاصيل الطلبات المكتملة</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>التاريخ</th>
                                                <th>قيمة الطلب</th>
                                                <th>نسبة العمولة</th>
                                                <th>العمولة</th>
                                                <th>صافي الربح</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.orders.map((order) => {
                                                const commission = order.commission;
                                                const sellerItems = order.items;
                                                const sellerTotal = sellerItems.reduce((s, i) => s + i.totalPrice, 0);
                                                return (
                                                    <tr key={order.id}>
                                                        <td className="text-gray-400">{new Date(order.createdAt).toLocaleDateString('ar-DZ')}</td>
                                                        <td className="text-white">{sellerTotal.toLocaleString()} دج</td>
                                                        <td className="text-gray-400">{commission?.commissionRate || 10}%</td>
                                                        <td className="text-red-400">{(commission?.commissionAmount ? (commission.commissionAmount * sellerTotal / (commission.commissionAmount + (commission.sellerPayout || sellerTotal))) : sellerTotal * 0.1).toLocaleString()} دج</td>
                                                        <td className="text-green-400 font-bold">{(sellerTotal - (commission?.commissionAmount ? (commission.commissionAmount * sellerTotal / (commission.commissionAmount + (commission.sellerPayout || sellerTotal))) : sellerTotal * 0.1)).toLocaleString()} دج</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
