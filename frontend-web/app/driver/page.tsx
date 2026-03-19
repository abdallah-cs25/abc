'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet (SSR needs to be disabled)
const DeliveryMap = dynamic(() => import('../components/DeliveryMap'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
        </div>
    ),
});

interface Delivery {
    id: string;
    status: string;
    cashCollected?: number;
    cashPaidToSeller?: number;
    pickupTime?: string;
    deliveryTime?: string;
    createdAt: string;
    distance?: number;
    order: {
        id: string;
        orderNumber: string;
        total: number;
        deliveryFee: number;
        deliveryAddress: string;
        customer?: {
            fullName: string;
            phone?: string;
        };
        guestName?: string;
        guestPhone?: string;
        items: Array<{
            store: {
                name: string;
                nameAr?: string;
                address: string;
                latitude: number;
                longitude: number;
            };
        }>;
    };
}

interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    driverStatus?: string;
}

interface Earnings {
    totalDeliveries: number;
    totalEarnings: number;
    totalCashCollected: number;
}

export default function DriverDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
    const [earnings, setEarnings] = useState<Earnings | null>(null);
    const [driverStatus, setDriverStatus] = useState<string>('AVAILABLE');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'my' | 'map'>('pending');
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [showMap, setShowMap] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'DRIVER') {
            router.push('/');
            return;
        }

        setUser(parsedUser);
        setDriverStatus(parsedUser.driverStatus || 'AVAILABLE');
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const [pendingRes, myRes, earningsRes] = await Promise.all([
                fetch('http://localhost:3000/api/delivery/pending', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('http://localhost:3000/api/delivery/my', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('http://localhost:3000/api/delivery/earnings?period=month', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const [pendingData, myData, earningsData] = await Promise.all([
                pendingRes.json(),
                myRes.json(),
                earningsRes.json(),
            ]);

            if (pendingData.success) setPendingDeliveries(pendingData.data);
            if (myData.success) setMyDeliveries(myData.data.deliveries);
            if (earningsData.success) setEarnings(earningsData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptDelivery = async (deliveryId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/delivery/${deliveryId}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                fetchData(token!);
                setActiveTab('my');
            }
        } catch (error) {
            console.error('Error accepting delivery:', error);
        }
    };

    const handleUpdateStatus = async (deliveryId: string, status: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/delivery/${deliveryId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            fetchData(token!);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleToggleStatus = async () => {
        const token = localStorage.getItem('token');
        const newStatus = driverStatus === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
        try {
            await fetch('http://localhost:3000/api/delivery/status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            setDriverStatus(newStatus);
        } catch (error) {
            console.error('Error updating driver status:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'في الانتظار' },
            ASSIGNED: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'مخصص لك' },
            PICKED_UP: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'تم الاستلام' },
            IN_TRANSIT: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'في الطريق' },
            DELIVERED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'تم التسليم' },
            FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'فشل' },
        };
        const badge = statuses[status] || statuses.PENDING;
        return <span className={`badge ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
            {/* Header */}
            <header className="glass p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <span className="text-xl">🚗</span>
                        </div>
                        <div>
                            <p className="font-bold text-white">{user?.fullName}</p>
                            <p className="text-xs text-gray-400">سائق توصيل</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleStatus}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${driverStatus === 'AVAILABLE'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-500 text-white'
                                }`}
                        >
                            {driverStatus === 'AVAILABLE' ? '🟢 متاح' : '⚫ غير متاح'}
                        </button>
                        <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats */}
            <div className="max-w-4xl mx-auto p-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-white">{earnings?.totalDeliveries || 0}</p>
                        <p className="text-xs text-gray-400">توصيلات الشهر</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-green-400">{(earnings?.totalEarnings || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">الأرباح (دج)</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{(earnings?.totalCashCollected || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">النقد المستلم</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => { setActiveTab('pending'); setShowMap(false); }}
                        className={`flex-1 py-3 rounded-xl font-medium transition ${activeTab === 'pending' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'
                            }`}
                    >
                        طلبات جديدة ({pendingDeliveries.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('my'); setShowMap(false); }}
                        className={`flex-1 py-3 rounded-xl font-medium transition ${activeTab === 'my' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'
                            }`}
                    >
                        توصيلاتي
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex-1 py-3 rounded-xl font-medium transition ${activeTab === 'map' ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400'
                            }`}
                    >
                        🗺️ الخريطة
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingDeliveries.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="text-5xl mb-4">📦</div>
                                <p className="text-gray-400">لا توجد طلبات توصيل جديدة</p>
                            </div>
                        ) : (
                            pendingDeliveries.map((delivery) => (
                                <div key={delivery.id} className="glass-card p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-white">
                                                طلب #{delivery.order.orderNumber.slice(-6)}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {delivery.order.customer?.fullName || delivery.order.guestName}
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-green-400">
                                            {delivery.order.deliveryFee} دج
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex items-start gap-2">
                                            <span className="text-green-400">📍</span>
                                            <span className="text-gray-300">{delivery.order.items[0]?.store.address}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-red-400">🏠</span>
                                            <span className="text-gray-300">{delivery.order.deliveryAddress}</span>
                                        </div>
                                        {delivery.distance && (
                                            <div className="flex items-center gap-2">
                                                <span>🛣️</span>
                                                <span className="text-gray-400">{delivery.distance} كم</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleAcceptDelivery(delivery.id)}
                                        className="w-full btn-primary"
                                    >
                                        ✅ قبول التوصيل
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'my' && (
                    <div className="space-y-4">
                        {myDeliveries.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <div className="text-5xl mb-4">🚗</div>
                                <p className="text-gray-400">لا توجد توصيلات حالية</p>
                            </div>
                        ) : (
                            myDeliveries.map((delivery) => (
                                <div key={delivery.id} className="glass-card p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-white">
                                                طلب #{delivery.order.orderNumber.slice(-6)}
                                            </p>
                                            {getStatusBadge(delivery.status)}
                                        </div>
                                        <p className="text-lg font-bold text-white">
                                            {delivery.order.total.toLocaleString()} دج
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm mb-4">
                                        <p className="text-gray-300">
                                            📞 {delivery.order.customer?.phone || delivery.order.guestPhone}
                                        </p>
                                        <p className="text-gray-300">🏠 {delivery.order.deliveryAddress}</p>
                                    </div>

                                    {delivery.status !== 'DELIVERED' && delivery.status !== 'FAILED' && (
                                        <div className="flex gap-2">
                                            {delivery.status === 'ASSIGNED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(delivery.id, 'PICKED_UP')}
                                                    className="flex-1 btn-primary text-sm py-2"
                                                >
                                                    تم الاستلام
                                                </button>
                                            )}
                                            {delivery.status === 'PICKED_UP' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(delivery.id, 'IN_TRANSIT')}
                                                    className="flex-1 btn-primary text-sm py-2"
                                                >
                                                    في الطريق
                                                </button>
                                            )}
                                            {delivery.status === 'IN_TRANSIT' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(delivery.id, 'DELIVERED')}
                                                    className="flex-1 btn-gold text-sm py-2"
                                                >
                                                    ✅ تم التسليم
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Map Tab */}
                {activeTab === 'map' && (
                    <div className="space-y-4">
                        {/* Delivery Selector */}
                        <div className="glass-card p-4">
                            <h3 className="font-bold text-white mb-3">اختر التوصيل للتتبع</h3>
                            {myDeliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'FAILED').length === 0 ? (
                                <p className="text-gray-400 text-sm">لا توجد توصيلات نشطة للتتبع</p>
                            ) : (
                                <div className="space-y-2">
                                    {myDeliveries
                                        .filter(d => d.status !== 'DELIVERED' && d.status !== 'FAILED')
                                        .map((delivery) => (
                                            <button
                                                key={delivery.id}
                                                onClick={() => setSelectedDelivery(delivery)}
                                                className={`w-full p-3 rounded-xl text-right transition flex items-center justify-between ${selectedDelivery?.id === delivery.id
                                                        ? 'bg-green-500/20 border border-green-500'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-white">
                                                        طلب #{delivery.order.orderNumber.slice(-6)}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {delivery.order.items[0]?.store.nameAr || delivery.order.items[0]?.store.name}
                                                    </p>
                                                </div>
                                                <span className="text-lg">{selectedDelivery?.id === delivery.id ? '✅' : '📍'}</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Map Display */}
                        {selectedDelivery ? (
                            <DeliveryMap
                                pickupLocation={
                                    selectedDelivery.order.items[0]?.store
                                        ? {
                                            lat: selectedDelivery.order.items[0].store.latitude || 36.7538,
                                            lng: selectedDelivery.order.items[0].store.longitude || 3.0588,
                                            label: selectedDelivery.order.items[0].store.nameAr || selectedDelivery.order.items[0].store.name,
                                        }
                                        : undefined
                                }
                                deliveryLocation={{
                                    lat: 36.7638 + Math.random() * 0.02, // Demo coordinates
                                    lng: 3.0688 + Math.random() * 0.02,
                                    label: selectedDelivery.order.deliveryAddress,
                                }}
                                onLocationUpdate={(lat, lng) => {
                                    console.log('Driver location updated:', lat, lng);
                                    // Here you would send the location to your backend
                                }}
                            />
                        ) : (
                            <div className="glass-card p-8 text-center">
                                <div className="text-5xl mb-4">🗺️</div>
                                <h3 className="text-xl font-bold text-white mb-2">خريطة التتبع GPS</h3>
                                <p className="text-gray-400">اختر توصيل من القائمة أعلاه لعرض المسار على الخريطة</p>
                            </div>
                        )}

                        {/* Navigation Shortcuts */}
                        {selectedDelivery && (
                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.order.items[0]?.store.latitude || 36.7538},${selectedDelivery.order.items[0]?.store.longitude || 3.0588}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary text-center py-3"
                                >
                                    🧭 توجه للمتجر
                                </a>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDelivery.order.deliveryAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-gold text-center py-3"
                                >
                                    🏠 توجه للعميل
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
