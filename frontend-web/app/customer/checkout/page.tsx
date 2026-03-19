'use client';

import { useCart } from '../../context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        address: '',
        notes: '',
        // Guest fields
        guestName: '',
        guestPhone: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    if (items.length === 0) {
        router.push('/customer/cart');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');

        // Prepare payload
        const payload = {
            items: items.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            deliveryAddress: formData.address,
            deliveryLatitude: 36.75, // Mock coordinates for now (Algiers)
            deliveryLongitude: 3.05,
            notes: formData.notes,
            deliveryFee: 0, // Free delivery for now
            // Guest fields if no user
            ...(!user ? {
                guestName: formData.guestName,
                guestPhone: formData.guestPhone
            } : {})
        };

        try {
            const url = 'http://localhost:3000/api/orders';
            const headers: any = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                clearCart();
                // Redirect to success or orders page
                router.push('/customer/orders'); // Assuming this exists, or we create a success page
                alert('تم تقديم طلبك بنجاح!');
            } else {
                alert(data.message || 'فشل في تقديم الطلب');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <CreditCard className="text-green-500" />
                إتمام الطلب
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Guest Info (if not logged in) */}
                    {!user && (
                        <section className="glass-card p-6">
                            <h2 className="text-xl font-bold text-white mb-4">معلوماتك</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">الاسم الكامل</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field w-full"
                                        value={formData.guestName}
                                        onChange={e => setFormData({ ...formData, guestName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        required
                                        className="input-field w-full"
                                        value={formData.guestPhone}
                                        onChange={e => setFormData({ ...formData, guestPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Delivery Info */}
                    <section className="glass-card p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-400" />
                            العنوان والتوصيل
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-2">العنوان الدقيق</label>
                                <textarea
                                    required
                                    className="input-field w-full min-h-[100px]"
                                    placeholder="الحي، اسم الشارع، رقم المنزل..."
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">ملاحظات للتوصيل (اختياري)</label>
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    placeholder="مثال: يرجى الاتصال قبل الوصول"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section className="glass-card p-6">
                        <h2 className="text-xl font-bold text-white mb-4">طريقة الدفع</h2>
                        <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black">
                                <CheckCircle size={14} />
                            </div>
                            <div>
                                <p className="font-bold text-white">الدفع عند الاستلام (Cash on Delivery)</p>
                                <p className="text-sm text-gray-400">ادفع نقداً عند استلام طلبك</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                    <div className="glass-card p-6 sticky top-24">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">ملخص الطلب</h3>

                        <div className="space-y-4 mb-6">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-start text-sm">
                                    <span className="text-gray-300">x{item.quantity} {item.name}</span>
                                    <span className="text-white">{(item.price * item.quantity).toLocaleString()} دج</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6 border-t border-white/10 pt-4 text-gray-300">
                            <div className="flex justify-between">
                                <span>المجموع الفرعي</span>
                                <span>{total.toLocaleString()} دج</span>
                            </div>
                            <div className="flex justify-between">
                                <span>التوصيل</span>
                                <span className="text-green-400">مجاني</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-lg border-t border-white/10 pt-3">
                                <span>الإجمالي</span>
                                <span className="text-amber-500">{total.toLocaleString()} دج</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`btn-gold w-full text-center block py-3 text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'جاري المعالجة...' : 'تأكيد الطلب'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
