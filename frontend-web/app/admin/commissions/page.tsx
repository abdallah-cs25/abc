'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CommissionReport {
    summary: {
        totalOrders: number;
        totalOrderAmount: number;
        totalCommission: number;
        totalSellerPayout: number;
        paidCommission: number;
        unpaidCommission: number;
    };
    commissions: Array<{
        id: string;
        orderTotal: number;
        commissionRate: number;
        commissionAmount: number;
        sellerPayout: number;
        isPaid: boolean;
        createdAt: string;
        order: {
            orderNumber: string;
        };
    }>;
}

interface CommissionSettings {
    percentage: number;
    minAmount: number;
    maxAmount: number | null;
}

export default function CommissionsPage() {
    const [report, setReport] = useState<CommissionReport | null>(null);
    const [settings, setSettings] = useState<CommissionSettings>({ percentage: 10, minAmount: 0, maxAmount: null });
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
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
            const [reportRes, settingsRes] = await Promise.all([
                fetch('http://localhost:3000/api/commissions/report', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('http://localhost:3000/api/commissions/settings', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const reportData = await reportRes.json();
            const settingsData = await settingsRes.json();

            if (reportData.success) setReport(reportData.data);
            if (settingsData.success) setSettings(settingsData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:3000/api/commissions/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });
            const data = await response.json();
            if (data.success) {
                setShowSettings(false);
                fetchData(token!);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const handleMarkPaid = async (id: string) => {
        if (!confirm('هل أنت متأكد من تحديد هذه العمولة كمدفوعة؟')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/commissions/${id}/pay`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchData(token!);
            } else {
                alert('فشل العملية');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="sidebar w-64 fixed h-full p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-white">MW</span>
                    </div>
                    <span className="text-xl font-bold text-white">My World</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/admin" className="sidebar-link">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/admin/users" className="sidebar-link">
                        <span>👥</span>
                        <span>المستخدمون</span>
                    </Link>
                    <Link href="/admin/stores" className="sidebar-link">
                        <span>🏪</span>
                        <span>المتاجر</span>
                    </Link>
                    <Link href="/admin/orders" className="sidebar-link">
                        <span>📦</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/admin/categories" className="sidebar-link">
                        <span>📁</span>
                        <span>الفئات</span>
                    </Link>
                    <Link href="/admin/commissions" className="sidebar-link active">
                        <span>💰</span>
                        <span>العمولات</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">العمولات</h1>
                        <p className="text-gray-400">تتبع وإدارة عمولات المنصة</p>
                    </div>
                    <button onClick={() => setShowSettings(true)} className="btn-gold">
                        ⚙️ إعدادات العمولة
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{report?.summary.totalOrders || 0}</p>
                                <p className="text-sm text-gray-400">إجمالي الطلبات</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <span className="text-2xl">💵</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {(report?.summary.totalOrderAmount || 0).toLocaleString()} دج
                                </p>
                                <p className="text-sm text-gray-400">قيمة الطلبات</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <span className="text-2xl">💰</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-400">
                                    {(report?.summary.totalCommission || 0).toLocaleString()} دج
                                </p>
                                <p className="text-sm text-gray-400">إجمالي العمولة</p>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{settings.percentage}%</p>
                                <p className="text-sm text-gray-400">نسبة العمولة</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Commission Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4">ملخص المدفوعات</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                                <span className="text-gray-300">عمولات مدفوعة</span>
                                <span className="text-green-400 font-bold">
                                    {(report?.summary.paidCommission || 0).toLocaleString()} دج
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                                <span className="text-gray-300">عمولات معلقة</span>
                                <span className="text-yellow-400 font-bold">
                                    {(report?.summary.unpaidCommission || 0).toLocaleString()} دج
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg">
                                <span className="text-gray-300">مدفوعات البائعين</span>
                                <span className="text-blue-400 font-bold">
                                    {(report?.summary.totalSellerPayout || 0).toLocaleString()} دج
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-4">إعدادات العمولة الحالية</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <span className="text-gray-300">نسبة العمولة</span>
                                <span className="text-white font-bold">{settings.percentage}%</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <span className="text-gray-300">الحد الأدنى</span>
                                <span className="text-white font-bold">{settings.minAmount} دج</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <span className="text-gray-300">الحد الأقصى</span>
                                <span className="text-white font-bold">
                                    {settings.maxAmount ? `${settings.maxAmount} دج` : 'غير محدد'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Commissions Table */}
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4">آخر العمولات</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>قيمة الطلب</th>
                                    <th>نسبة العمولة</th>
                                    <th>مبلغ العمولة</th>
                                    <th>للبائع</th>
                                    <th>الحالة</th>
                                    <th>التاريخ</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report?.commissions.slice(0, 10).map((commission) => (
                                    <tr key={commission.id}>
                                        <td className="font-mono text-blue-400">
                                            #{commission.order.orderNumber.slice(-8)}
                                        </td>
                                        <td className="text-white">{commission.orderTotal.toLocaleString()} دج</td>
                                        <td className="text-gray-400">{commission.commissionRate}%</td>
                                        <td className="text-green-400">{commission.commissionAmount.toLocaleString()} دج</td>
                                        <td className="text-blue-400">{commission.sellerPayout.toLocaleString()} دج</td>
                                        <td>
                                            {commission.isPaid ? (
                                                <span className="badge badge-success">مدفوع</span>
                                            ) : (
                                                <span className="badge badge-warning">معلق</span>
                                            )}
                                        </td>
                                        <td className="text-gray-400">
                                            {new Date(commission.createdAt).toLocaleDateString('ar-DZ')}
                                        </td>
                                        <td>
                                            {!commission.isPaid && (
                                                <button
                                                    onClick={() => handleMarkPaid(commission.id)}
                                                    className="text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 px-2 py-1 rounded transition"
                                                >
                                                    تحديد كمدفوع
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-card w-full max-w-md p-6 m-4">
                            <h2 className="text-xl font-bold text-white mb-6">إعدادات العمولة</h2>
                            <form onSubmit={handleUpdateSettings} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">نسبة العمولة (%)</label>
                                    <input
                                        type="number"
                                        value={settings.percentage}
                                        onChange={(e) => setSettings({ ...settings, percentage: parseFloat(e.target.value) })}
                                        className="input-field"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الحد الأدنى (دج)</label>
                                    <input
                                        type="number"
                                        value={settings.minAmount}
                                        onChange={(e) => setSettings({ ...settings, minAmount: parseFloat(e.target.value) })}
                                        className="input-field"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الحد الأقصى (دج) - اختياري</label>
                                    <input
                                        type="number"
                                        value={settings.maxAmount || ''}
                                        onChange={(e) => setSettings({ ...settings, maxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="input-field"
                                        min="0"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 btn-primary">
                                        حفظ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSettings(false)}
                                        className="flex-1 bg-white/5 text-gray-300 py-3 rounded-lg hover:bg-white/10 transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
