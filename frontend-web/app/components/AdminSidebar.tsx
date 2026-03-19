'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import '../i18n';

interface User {
    fullName: string;
    email: string;
    role: string;
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const isActive = (path: string) => pathname === path ? 'sidebar-link active' : 'sidebar-link';

    if (!mounted) return null;

    return (
        <aside className="sidebar w-64 fixed h-full p-4 flex flex-col z-50">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-white">MW</span>
                </div>
                <span className="text-xl font-bold text-white">My World</span>
            </div>

            <nav className="flex-1 space-y-2">
                <Link href="/admin" className={isActive('/admin')}>
                    <span>📊</span>
                    <span>{t('admin.dashboard')}</span>
                </Link>
                <Link href="/admin/users" className={isActive('/admin/users')}>
                    <span>👥</span>
                    <span>{t('admin.users')}</span>
                </Link>
                <Link href="/admin/stores" className={isActive('/admin/stores')}>
                    <span>🏪</span>
                    <span>{t('admin.stores')}</span>
                </Link>
                <Link href="/admin/orders" className={isActive('/admin/orders')}>
                    <span>📦</span>
                    <span>{t('admin.orders')}</span>
                </Link>
                <Link href="/admin/categories" className={isActive('/admin/categories')}>
                    <span>📁</span>
                    <span>{t('admin.categories')}</span>
                </Link>
                <Link href="/admin/commissions" className={isActive('/admin/commissions')}>
                    <span>💰</span>
                    <span>{t('admin.commissions')}</span>
                </Link>
                <Link href="/admin/settings" className={isActive('/admin/settings')}>
                    <span>⚙️</span>
                    <span>{t('admin.settings')}</span>
                </Link>
            </nav>

            <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                {/* Language Switcher */}
                <div className="px-2">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{t('admin.language')}</p>
                    <LanguageSwitcher />
                </div>

                {/* User Profile */}
                <div>
                    <div className="px-2 mb-2">
                        <p className="text-sm text-white font-medium">{user?.fullName}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <span>🚪</span>
                        <span>{t('admin.logout')}</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
