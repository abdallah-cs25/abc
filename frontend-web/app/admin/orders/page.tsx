'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: { name: string; nameAr?: string };
    store: { name: string; nameAr?: string };
}

interface Order {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    status: string;
    createdAt: string;
    deliveryAddress: string;
    notes?: string;
    customer?: { fullName: string; phone?: string; email?: string };
    guestName?: string;
    guestPhone?: string;
    guestEmail?: string;
    items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'في الانتظار', color: 'badge-warning' },
    CONFIRMED: { label: 'مؤكد', color: 'badge-primary' },
    PREPARING: { label: 'قيد التحضير', color: 'badge-info' },
    READY: { label: 'جاهز', color: 'badge-primary' },
    PICKED_UP: { label: 'تم الاستلام', color: 'badge-primary' },
    DELIVERED: { label: 'تم التوصيل', color: 'badge-success' },
    CANCELLED: { label: 'ملغي', color: 'badge-error' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        fetchOrders(token);
    }, [router, filter]);

    const fetchOrders = async (token: string) => {
        setLoading(true);
        try {
            const url = filter
                ? `http://localhost:3000/api/orders?status=${filter}`
                : 'http://localhost:3000/api/orders';
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                // API returns { data: { orders: [], pagination: {} } }
                setOrders(data.data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
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
            fetchOrders(token!);
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const statusFilters = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    const filterLabels: Record<string, string> = {
        '': 'الكل', PENDING: 'في الانتظار', CONFIRMED: 'مؤكد',
        PREPARING: 'قيد التحضير', READY: 'جاهز', DELIVERED: 'تم التوصيل', CANCELLED: 'ملغي',
    };

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
                    <Link href="/admin" className="sidebar-link"><span>📊</span><span>لوحة التحكم</span></Link>
                    <Link href="/admin/users" className="sidebar-link"><span>👥</span><span>المستخدمون</span></Link>
                    <Link href="/admin/stores" className="sidebar-link"><span>🏪</span><span>المتاجر</span></Link>
                    <Link href="/admin/orders" className="sidebar-link active"><span>📦</span><span>الطلبات</span></Link>
                    <Link href="/admin/categories" className="sidebar-link"><span>📁</span><span>الفئات</span></Link>
                    <Link href="/admin/commissions" className="sidebar-link"><span>💰</span><span>العمولات</span></Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">الطلبات</h1>
                    <p className="text-gray-400">إدارة جميع طلبات المنصة</p>
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {statusFilters.map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-lg transition text-sm ${filter === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {filterLabels[s]}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد طلبات</h3>
                        <p className="text-gray-400">لم يتم العثور على أي طلبات</p>
                    </div>
                ) : (
                    <div className="card">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>رقم الطلب</th>
                                        <th>العميل</th>
                                        <th>الإجمالي</th>
                                        <th>الحالة</th>
                                        <th>التاريخ</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => {
                                        const status = STATUS_LABELS[order.status] || { label: order.status, color: '' };
                                        return (
                                            <tr key={order.id}>
                                                <td className="font-mono text-blue-400">#{order.orderNumber.slice(-8)}</td>
                                                <td className="text-white">{order.customer?.fullName || order.guestName || 'ضيف'}</td>
                                                <td className="text-amber-400 font-bold">{order.total.toLocaleString()} دج</td>
                                                <td><span className={`badge ${status.color}`}>{status.label}</span></td>
                                                <td className="text-gray-400">{new Date(order.createdAt).toLocaleDateString('ar-DZ')}</td>
                                                <td>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="text-blue-400 hover:text-blue-300 transition"
                                                    >
                                                        عرض
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">تفاصيل الطلب</h2>
                                <p className="font-mono text-blue-400 text-sm">#{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Customer & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-gray-400 text-sm mb-3">معلومات العميل</h3>
                                <p className="text-white font-bold">{selectedOrder.customer?.fullName || selectedOrder.guestName || 'ضيف'}</p>
                                <p className="text-gray-300 text-sm">{selectedOrder.customer?.phone || selectedOrder.guestPhone}</p>
                                <p className="text-gray-400 text-xs mt-1">{selectedOrder.customer?.email || selectedOrder.guestEmail}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-gray-400 text-sm mb-3">تفاصيل الطلب</h3>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-400 text-sm">الحالة:</span>
                                    <span className={`badge ${STATUS_LABELS[selectedOrder.status]?.color}`}>{STATUS_LABELS[selectedOrder.status]?.label}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">التاريخ:</span>
                                    <span className="text-white text-sm">{new Date(selectedOrder.createdAt).toLocaleString('ar-DZ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        {selectedOrder.deliveryAddress && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6">
                                <h3 className="text-gray-400 text-sm mb-2">عنوان التوصيل</h3>
                                <p className="text-white">{selectedOrder.deliveryAddress}</p>
                            </div>
                        )}

                        {/* Items */}
                        <div className="mb-6">
                            <h3 className="text-white font-bold mb-4">المنتجات</h3>
                            <div className="bg-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-black/20 text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 text-right">المنتج</th>
                                            <th className="px-4 py-3 text-center">الكمية</th>
                                            <th className="px-4 py-3 text-center">سعر الوحدة</th>
                                            <th className="px-4 py-3 text-left">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item) => (
                                            <tr key={item.id} className="border-b border-white/5">
                                                <td className="px-4 py-3 text-white">{item.product.nameAr || item.product.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-300">{item.quantity}</td>
                                                <td className="px-4 py-3 text-center text-gray-300">{item.unitPrice.toLocaleString()} دج</td>
                                                <td className="px-4 py-3 text-left text-amber-400 font-bold">{item.totalPrice.toLocaleString()} دج</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-white/5">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right text-gray-400">المجموع الفرعي</td>
                                            <td className="px-4 py-3 text-left text-white">{(selectedOrder.subtotal || 0).toLocaleString()} دج</td>
                                        </tr>
                                        {selectedOrder.deliveryFee > 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-gray-400">رسوم التوصيل</td>
                                                <td className="px-4 py-3 text-left text-white">{selectedOrder.deliveryFee.toLocaleString()} دج</td>
                                            </tr>
                                        )}
                                        <tr className="font-bold">
                                            <td colSpan={3} className="px-4 py-3 text-right text-white">المجموع الكلي</td>
                                            <td className="px-4 py-3 text-left text-amber-400 text-lg">{selectedOrder.total.toLocaleString()} دج</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/10 flex-wrap">
                            {selectedOrder.status === 'PENDING' && (
                                <>
                                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')} className="btn-primary text-sm">
                                        ✅ تأكيد الطلب
                                    </button>
                                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm">
                                        ❌ إلغاء
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === 'CONFIRMED' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')} className="btn-primary text-sm">🔄 بدء التحضير</button>
                            )}
                            {selectedOrder.status === 'PREPARING' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')} className="btn-gold text-sm">✅ جاهز</button>
                            )}
                            {selectedOrder.status === 'READY' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PICKED_UP')} className="btn-primary text-sm">🚗 تم الاستلام</button>
                            )}
                            {selectedOrder.status === 'PICKED_UP' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')} className="btn-primary text-sm">🏠 تم التوصيل</button>
                            )}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition text-sm"
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
