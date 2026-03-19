'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    customer?: {
        fullName: string;
        phone?: string;
    };
    guestName?: string;
    guestPhone?: string;
    items: Array<{
        id: string;
        quantity: number;
        totalPrice: number;
        product: {
            name: string;
            nameAr?: string;
        };
    }>;
}

interface Store {
    id: string;
    name: string;
    nameAr?: string;
}

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/');
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'SELLER') {
            router.push('/');
            return;
        }
        fetchData(token);
    }, [router, selectedStore]);

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            const storesRes = await fetch('http://localhost:3000/api/stores/my/stores', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const storesData = await storesRes.json();
            if (storesData.success) {
                setStores(storesData.data);

                // Fetch orders for selected store or first store
                const storeId = selectedStore || storesData.data[0]?.id;
                if (storeId) {
                    setSelectedStore(storeId);
                    const ordersRes = await fetch(`http://localhost:3000/api/orders/store/${storeId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const ordersData = await ordersRes.json();
                    if (ordersData.success) {
                        setOrders(ordersData.data);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            fetchData(token!);
            if (selectedOrder && selectedOrder.id === orderId) {
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'في الانتظار' },
            CONFIRMED: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'مؤكد' },
            PREPARING: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'قيد التحضير' },
            READY: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'جاهز' },
            PICKED_UP: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'تم الاستلام' },
            DELIVERED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'تم التوصيل' },
            CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'ملغي' },
        };
        const badge = statuses[status] || statuses.PENDING;
        return <span className={`badge ${badge.bg} ${badge.text}`}>{badge.label}</span>;
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
                    <Link href="/seller" className="sidebar-link">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/seller/stores" className="sidebar-link">
                        <span>🏪</span>
                        <span>متاجري</span>
                    </Link>
                    <Link href="/seller/products" className="sidebar-link">
                        <span>📦</span>
                        <span>المنتجات</span>
                    </Link>
                    <Link href="/seller/orders" className="sidebar-link active">
                        <span>🛒</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/seller/earnings" className="sidebar-link">
                        <span>💰</span>
                        <span>الأرباح</span>
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
            <main className="flex-1 mr-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">الطلبات</h1>
                        <p className="text-gray-400">إدارة طلبات متاجرك</p>
                    </div>
                </div>

                {/* Store Tabs */}
                <div className="flex gap-2 mb-6">
                    {stores.map((store) => (
                        <button
                            key={store.id}
                            onClick={() => setSelectedStore(store.id)}
                            className={`px-4 py-2 rounded-lg transition ${selectedStore === store.id ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {store.nameAr || store.name}
                        </button>
                    ))}
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-4">🛒</div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد طلبات</h3>
                        <p className="text-gray-400">لم يتم استلام أي طلبات بعد</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="glass-card p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-mono text-blue-400 mb-1">#{order.orderNumber.slice(-8)}</p>
                                        <p className="text-white font-bold">{order.customer?.fullName || order.guestName}</p>
                                        <p className="text-sm text-gray-400">{order.customer?.phone || order.guestPhone}</p>
                                    </div>
                                    <div className="text-left">
                                        {getStatusBadge(order.status)}
                                        <p className="text-2xl font-bold text-amber-400 mt-2">{order.total.toLocaleString()} دج</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-white/5 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-gray-400 mb-2">المنتجات:</p>
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm py-1">
                                            <span className="text-white">{item.product.nameAr || item.product.name} × {item.quantity}</span>
                                            <span className="text-gray-400">{item.totalPrice} دج</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowModal(true);
                                        }}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition text-sm"
                                    >
                                        👁️ التفاصيل
                                    </button>

                                    {order.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                                className="flex-1 btn-primary text-sm py-2"
                                            >
                                                ✅ تأكيد
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                                                className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-lg hover:bg-red-500/20 transition text-sm"
                                            >
                                                ❌ إلغاء
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'CONFIRMED' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                            className="flex-1 btn-primary text-sm py-2"
                                        >
                                            🔄 تحضير
                                        </button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                                            className="flex-1 btn-gold text-sm py-2"
                                        >
                                            ✅ جاهز
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 mt-4 text-left" dir="ltr">
                                    {new Date(order.createdAt).toLocaleString('ar-DZ')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">تفاصيل الطلب</h2>
                                <p className="font-mono text-blue-400 text-sm">#{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-gray-400 text-sm mb-3">معلومات العميل</h3>
                                <p className="text-white font-bold text-lg mb-1">{selectedOrder.customer?.fullName || selectedOrder.guestName}</p>
                                <p className="text-gray-300 dir-ltr text-right">{selectedOrder.customer?.phone || selectedOrder.guestPhone}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-gray-400 text-sm mb-3">حالة الطلب</h3>
                                <div className="flex items-center justify-between">
                                    {getStatusBadge(selectedOrder.status)}
                                    <span className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-white font-bold mb-4">المنتجات</h3>
                            <div className="bg-white/5 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-black/20 text-xs text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 text-right">المنتج</th>
                                            <th className="px-4 py-3 text-center">الكمية</th>
                                            <th className="px-4 py-3 text-left">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {selectedOrder.items.map((item) => (
                                            <tr key={item.id} className="border-b border-white/5">
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {item.product.nameAr || item.product.name}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-300">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-left text-amber-400 font-bold">
                                                    {item.totalPrice} دج
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-white/5 font-bold">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-3 text-right text-white">المجموع الكلي</td>
                                            <td className="px-4 py-3 text-left text-amber-400 text-lg">
                                                {selectedOrder.total} دج
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-white/10">
                            {selectedOrder.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                                        className="flex-1 btn-primary py-3"
                                    >
                                        قبول الطلب
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                                        className="flex-1 bg-red-500/10 text-red-400 py-3 rounded-xl hover:bg-red-500/20 font-bold"
                                    >
                                        رفض
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === 'CONFIRMED' && (
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                                    className="flex-1 btn-primary py-3"
                                >
                                    بدء التحضير
                                </button>
                            )}
                            {selectedOrder.status === 'PREPARING' && (
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')}
                                    className="flex-1 btn-gold py-3"
                                >
                                    جاهز للاستلام
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 bg-white/5 text-white rounded-xl hover:bg-white/10"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
