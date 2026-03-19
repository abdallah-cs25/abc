'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface ChartData {
    sales: Array<{ date: string; sales: number }>;
    topProducts: Array<{ name: string; sales: number }>;
    topStores: Array<{ name: string; revenue: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30days');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchData(token);
    }, [range]);

    const fetchData = async (token: string) => {
        try {
            const [salesRes, productsRes, storesRes] = await Promise.all([
                fetch(`http://localhost:3000/api/analytics/sales?range=${range}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/analytics/top-products', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/analytics/top-stores', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const salesData = await salesRes.json();
            const productsData = await productsRes.json();
            const storesData = await storesRes.json();

            if (salesData.success && productsData.success && storesData.success) {
                setData({
                    sales: salesData.data,
                    topProducts: productsData.data,
                    topStores: storesData.data
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;

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
                    <Link href="/admin/analytics" className="sidebar-link active">
                        <span>📈</span>
                        <span>التقارير</span>
                    </Link>
                    <Link href="/admin/commissions" className="sidebar-link">
                        <span>💰</span>
                        <span>العمولات</span>
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
            <main className="flex-1 main-content p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">التقارير والتحليلات</h1>
                        <p className="text-gray-400">رؤية شاملة لأداء المنصة</p>
                    </div>
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2"
                    >
                        <option value="7days">آخر 7 أيام</option>
                        <option value="30days">آخر 30 يوم</option>
                        <option value="year">هذا العام</option>
                    </select>
                </div>

                {/* Sales Chart */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6">مبيعات المنصة</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.sales}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="sales" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Products */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-white mb-6">أكثر المنتجات مبيعاً</h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis type="number" stroke="#9ca3af" />
                                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                        cursor={{ fill: '#ffffff10' }}
                                    />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Stores */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-white mb-6">أفضل المتاجر أداءً</h2>
                        <div className="h-64 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.topStores}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="revenue"
                                    >
                                        {data?.topStores.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
