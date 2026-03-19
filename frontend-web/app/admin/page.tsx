'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
}

interface DashboardStats {
    counts: {
        users: number;
        stores: number;
        products: number;
        orders: number;
        todayOrders: number;
        pendingOrders: number;
        activeDrivers: number;
    };
    revenue: {
        monthly: number;
        monthlyCommission: number;
    };
}

import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
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
        if (parsedUser.role !== 'ADMIN') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        fetchStats(token);
    }, [router]);

    const fetchStats = async (token: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/commissions/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم</h1>
                    <p className="text-gray-400">مرحباً بك، {user?.fullName}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">👥</span>
                            <span className="badge badge-primary">المستخدمون</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats?.counts.users || 0}</p>
                        <p className="text-sm text-gray-400">إجمالي المستخدمين</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">🏪</span>
                            <span className="badge badge-success">المتاجر</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats?.counts.stores || 0}</p>
                        <p className="text-sm text-gray-400">متجر نشط</p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">📦</span>
                            <span className="badge badge-warning">الطلبات</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats?.counts.orders || 0}</p>
                        <p className="text-sm text-gray-400">
                            <span className="text-amber-400">{stats?.counts.pendingOrders || 0}</span> قيد الانتظار
                        </p>
                    </div>

                    <div className="stat-card">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl">💰</span>
                            <span className="badge badge-success">الإيرادات</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{(stats?.revenue.monthly || 0).toLocaleString()} دج</p>
                        <p className="text-sm text-gray-400">
                            عمولة: <span className="text-green-400">{(stats?.revenue.monthlyCommission || 0).toLocaleString()} دج</span>
                        </p>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <span className="text-2xl">📱</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.counts.products || 0}</p>
                            <p className="text-sm text-gray-400">منتج</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <span className="text-2xl">🚗</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.counts.activeDrivers || 0}</p>
                            <p className="text-sm text-gray-400">سائق متاح</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.counts.todayOrders || 0}</p>
                            <p className="text-sm text-gray-400">طلب اليوم</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/admin/users" className="btn-primary text-center">
                            إضافة مستخدم
                        </Link>
                        <Link href="/admin/categories" className="btn-primary text-center">
                            إضافة فئة
                        </Link>
                        <Link href="/admin/orders" className="btn-gold text-center">
                            مراجعة الطلبات
                        </Link>
                        <Link href="/admin/commissions" className="btn-gold text-center">
                            تقرير العمولات
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
