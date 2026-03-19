'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Settings, Shield, Globe, Activity, Database, Bell } from 'lucide-react';
import Link from 'next/link';

import AdminSidebar from '../../components/AdminSidebar';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'My World',
        maintenanceMode: false,
        globalCommission: 10,
        enableRegistration: true,
        supportEmail: 'support@myworld.dz',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });
            const data = await response.json();
            if (data.success) {
                alert('تم حفظ الإعدادات بنجاح!');
            } else {
                alert(data.message || 'فشل في حفظ الإعدادات');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex">
            <AdminSidebar />


            <main className="flex-1 main-content p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">إعدادات النظام</h1>
                            <p className="text-gray-400">التحكم في إعدادات المنصة العامة</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`btn-gold flex items-center gap-2 ${saving ? 'opacity-70' : ''}`}
                        >
                            <Save size={18} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Settings */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* General Info */}
                            <section className="glass-card p-6">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                    <Globe className="text-blue-400" size={24} />
                                    <h2 className="text-xl font-bold">معلومات المنصة</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-400 mb-2">اسم الموقع</label>
                                        <input
                                            type="text"
                                            value={settings.siteName}
                                            onChange={(e) => handleChange('siteName', e.target.value)}
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-2">بريد الدعم الفني</label>
                                        <input
                                            type="email"
                                            value={settings.supportEmail}
                                            onChange={(e) => handleChange('supportEmail', e.target.value)}
                                            className="input-field w-full"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Financial Settings */}
                            <section className="glass-card p-6">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                    <Activity className="text-green-400" size={24} />
                                    <h2 className="text-xl font-bold">الإعدادات المالية</h2>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">نسبة العمولة الافتراضية (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={settings.globalCommission}
                                            onChange={(e) => handleChange('globalCommission', Number(e.target.value))}
                                            className="input-field w-32 text-center text-xl font-bold"
                                        />
                                        <span className="text-gray-500 text-sm">يتم تطبيق هذه النسبة على المتاجر الجديدة تلقائياً</span>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Side Controls */}
                        <div className="space-y-6">

                            {/* System Status */}
                            <section className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield size={18} className="text-purple-400" />
                                    حالة النظام
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span>وضع الصيانة</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span>التسجيل متاح</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.enableRegistration}
                                                onChange={(e) => handleChange('enableRegistration', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            {/* Server Health (Mock) */}
                            <section className="glass-card p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Database size={18} className="text-blue-400" />
                                    السيرفر
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Status</span>
                                        <span className="text-green-400">Healthy</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Uptime</span>
                                        <span className="text-white">5d 12h 30m</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Version</span>
                                        <span className="text-white">v1.0.2</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
