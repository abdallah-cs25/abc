'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map (SSR disabled)
const TrackingMap = dynamic(() => import('../../components/TrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
    ),
});

interface Order {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    deliveryAddress: string;
    createdAt: string;
    items: Array<{
        id: string;
        quantity: number;
        totalPrice: number;
        product: {
            name: string;
            nameAr?: string;
        };
        store: {
            name: string;
            nameAr?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
        };
    }>;
    delivery?: {
        id: string;
        status: string;
        driverLatitude?: number;
        driverLongitude?: number;
        driver?: {
            fullName: string;
            phone?: string;
        };
    };
}

export default function CustomerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showTracking, setShowTracking] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token || !user) {
            router.push('/');
            return;
        }
        fetchOrders(token);

        // Poll for updates every 10 seconds if tracking is active
        const interval = setInterval(() => {
            if (showTracking && selectedOrder) {
                fetchOrderUpdate(token, selectedOrder.id);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [showTracking, selectedOrder]);

    const fetchOrders = async (token: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/orders/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setOrders(data.data);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderUpdate = async (token: string, orderId: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setSelectedOrder(data.data);
                setOrders(orders.map(o => o.id === orderId ? data.data : o));
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const handleTrackOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowTracking(true);
    };

    const getStatusInfo = (status: string) => {
        const statuses: Record<string, { icon: string; label: string; color: string; step: number }> = {
            PENDING: { icon: '⏳', label: 'في انتظار التأكيد', color: 'text-yellow-400', step: 1 },
            CONFIRMED: { icon: '✅', label: 'تم التأكيد', color: 'text-blue-400', step: 2 },
            PREPARING: { icon: '👨‍🍳', label: 'قيد التحضير', color: 'text-purple-400', step: 3 },
            READY: { icon: '📦', label: 'جاهز للتوصيل', color: 'text-cyan-400', step: 4 },
            PICKED_UP: { icon: '🚗', label: 'السائق في الطريق', color: 'text-orange-400', step: 5 },
            IN_TRANSIT: { icon: '🛵', label: 'جاري التوصيل', color: 'text-amber-400', step: 5 },
            DELIVERED: { icon: '🎉', label: 'تم التسليم', color: 'text-green-400', step: 6 },
            CANCELLED: { icon: '❌', label: 'ملغي', color: 'text-red-400', step: 0 },
        };
        return statuses[status] || statuses.PENDING;
    };

    const getDeliveryStatusInfo = (status?: string) => {
        const statuses: Record<string, { icon: string; label: string }> = {
            PENDING: { icon: '⏳', label: 'في انتظار سائق' },
            ASSIGNED: { icon: '🚗', label: 'تم تعيين سائق' },
            PICKED_UP: { icon: '📦', label: 'تم الاستلام من المتجر' },
            IN_TRANSIT: { icon: '🛵', label: 'السائق في طريقه إليك' },
            DELIVERED: { icon: '✅', label: 'تم التسليم' },
        };
        return statuses[status || 'PENDING'] || statuses.PENDING;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
            {/* Header */}
            <header className="glass p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/customer" className="text-gray-400 hover:text-white">←</Link>
                        <h1 className="text-xl font-bold text-white">طلباتي</h1>
                    </div>
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                        <span className="text-lg">📦</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4">
                {orders.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold text-white mb-2">لا توجد طلبات</h2>
                        <p className="text-gray-400 mb-6">لم تقم بأي طلبات بعد</p>
                        <Link href="/customer" className="btn-primary inline-block">
                            تصفح المتاجر
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const status = getStatusInfo(order.status);
                            const isActive = !['DELIVERED', 'CANCELLED'].includes(order.status);

                            return (
                                <div key={order.id} className="glass-card p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-sm text-gray-400">طلب #{order.orderNumber ? order.orderNumber.slice(-6) : 'N/A'}</p>
                                            <p className="text-lg font-bold text-white">{order.total?.toLocaleString() || '0'} دج</p>
                                        </div>
                                        <div className={`flex items-center gap-2 ${status.color}`}>
                                            <span>{status.icon}</span>
                                            <span className="text-sm font-medium">{status.label}</span>
                                        </div>
                                    </div>

                                    {/* Order Items Summary */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="bg-white/5 rounded-xl p-3 mb-3">
                                            <p className="text-sm text-gray-400 mb-2">
                                                {order.items.length} منتج من {order.items[0]?.store?.nameAr || order.items[0]?.store?.name || 'متجر غير معروف'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.slice(0, 3).map((item) => (
                                                    <span key={item.id} className="text-xs bg-white/10 px-2 py-1 rounded-lg text-gray-300">
                                                        {(item.product?.nameAr || item.product?.name || 'منتج غير معروف')} × {item.quantity}
                                                    </span>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <span className="text-xs text-gray-400">+ {order.items.length - 3} آخر</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery Info */}
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                        <span>📍</span>
                                        <span>{order.deliveryAddress || 'العنوان غير متوفر'}</span>
                                    </div>

                                    {/* Driver Info (if assigned) */}
                                    {order.delivery?.driver && isActive && (
                                        <div className="bg-green-500/10 rounded-xl p-3 mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    🚗
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{order.delivery.driver.fullName}</p>
                                                    <p className="text-sm text-gray-400">{getDeliveryStatusInfo(order.delivery.status).label}</p>
                                                </div>
                                            </div>
                                            {order.delivery.driver.phone && (
                                                <a
                                                    href={`tel:${order.delivery.driver.phone}`}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                                                >
                                                    📞 اتصل
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {isActive && (
                                            <button
                                                onClick={() => handleTrackOrder(order)}
                                                className="flex-1 btn-primary py-3"
                                            >
                                                🗺️ تتبع الطلب
                                            </button>
                                        )}
                                        <button className="flex-1 bg-white/5 py-3 rounded-xl text-gray-300 hover:bg-white/10 transition">
                                            📋 التفاصيل
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-DZ', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }) : 'التاريخ غير متوفر'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full Screen Tracking Modal */}
            {
                showTracking && selectedOrder && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
                        {/* Header */}
                        <div className="glass p-4 flex items-center justify-between">
                            <button
                                onClick={() => setShowTracking(false)}
                                className="text-white text-2xl"
                            >
                                ←
                            </button>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">تتبع الطلب</p>
                                <p className="font-bold text-white">#{selectedOrder.orderNumber.slice(-6)}</p>
                            </div>
                            <div className="w-8"></div>
                        </div>

                        {/* Status Progress */}
                        <div className="p-4">
                            <div className="glass-card p-4">
                                <div className="flex items-center justify-between mb-4">
                                    {['CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'].map((step, index) => {
                                        const currentStep = getStatusInfo(selectedOrder.status).step;
                                        const stepNumber = index + 2;
                                        const isCompleted = currentStep >= stepNumber;
                                        const isCurrent = currentStep === stepNumber;

                                        return (
                                            <div key={step} className="flex-1 flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isCompleted ? 'bg-green-500 text-white' :
                                                    isCurrent ? 'bg-amber-500 text-white animate-pulse' :
                                                        'bg-white/10 text-gray-400'
                                                    }`}>
                                                    {isCompleted ? '✓' : index + 1}
                                                </div>
                                                {index < 4 && (
                                                    <div className={`h-1 w-full mt-2 ${isCompleted ? 'bg-green-500' : 'bg-white/10'}`}></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className={`text-center font-bold ${getStatusInfo(selectedOrder.status).color}`}>
                                    {getStatusInfo(selectedOrder.status).icon} {getStatusInfo(selectedOrder.status).label}
                                </p>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="flex-1 p-4">
                            <TrackingMap
                                storeLocation={
                                    selectedOrder.items?.[0]?.store
                                        ? {
                                            lat: selectedOrder.items[0].store.latitude || 36.7538,
                                            lng: selectedOrder.items[0].store.longitude || 3.0588,
                                            label: selectedOrder.items[0].store.nameAr || selectedOrder.items[0].store.name,
                                        }
                                        : undefined
                                }
                                customerLocation={{
                                    lat: 36.7738, // Would be actual customer location
                                    lng: 3.0788,
                                    label: selectedOrder.deliveryAddress,
                                }}
                                driverLocation={
                                    selectedOrder.delivery && ['PICKED_UP', 'IN_TRANSIT'].includes(selectedOrder.delivery.status)
                                        ? {
                                            lat: selectedOrder.delivery.driverLatitude || 36.7638,
                                            lng: selectedOrder.delivery.driverLongitude || 3.0688,
                                            label: selectedOrder.delivery.driver?.fullName || 'السائق',
                                        }
                                        : undefined
                                }
                                orderStatus={selectedOrder.status}
                            />
                        </div>

                        {/* Driver Card */}
                        {selectedOrder.delivery?.driver && (
                            <div className="p-4">
                                <div className="glass-card p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
                                            🚗
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{selectedOrder.delivery.driver.fullName}</p>
                                            <p className="text-sm text-gray-400">سائق التوصيل</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedOrder.delivery.driver.phone && (
                                            <>
                                                <a
                                                    href={`tel:${selectedOrder.delivery.driver.phone}`}
                                                    className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-xl"
                                                >
                                                    📞
                                                </a>
                                                <a
                                                    href={`sms:${selectedOrder.delivery.driver.phone}`}
                                                    className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl"
                                                >
                                                    💬
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
