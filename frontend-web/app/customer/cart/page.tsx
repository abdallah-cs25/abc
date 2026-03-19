'use client';

import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={48} className="text-gray-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">سلة المشتريات فارغة</h1>
                <p className="text-gray-400 mb-8 max-w-sm">
                    لم تقم بإضافة أي منتجات للسلة بعد. تصفح المتاجر وابدأ التسوق الآن!
                </p>
                <Link href="/customer" className="btn-primary">
                    تصفح المتاجر
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <ShoppingBag className="text-amber-500" />
                سلة المشتريات
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="glass-card p-4 flex gap-4 items-center">
                            {/* Product Image Placeholder */}
                            <div className="w-20 h-20 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <ShoppingBag size={24} className="text-gray-600" />
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                                {item.selectedVariant && (
                                    <p className="text-xs text-gray-400 mb-2">
                                        {Object.entries(item.selectedVariant).map(([key, val]) => `${key}: ${val}`).join(' | ')}
                                    </p>
                                )}
                                <div className="text-amber-500 font-bold">{item.price.toLocaleString()} دج</div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white"
                                    >
                                        -
                                    </button>
                                    <span className="text-white font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-400 text-sm hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={clearCart}
                        className="text-red-400 text-sm hover:underline"
                    >
                        إفراغ السلة بالكامل
                    </button>
                </div>

                {/* Summary Card */}
                <div className="glass-card p-6 h-fit sticky top-24">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">ملخص الطلب</h3>

                    <div className="space-y-3 mb-6 text-gray-300">
                        <div className="flex justify-between">
                            <span>المجموع الفرعي</span>
                            <span>{total.toLocaleString()} دج</span>
                        </div>
                        <div className="flex justify-between">
                            <span>رسوم التوصيل (تقديري)</span>
                            <span>0 دج</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg border-t border-white/10 pt-3">
                            <span>الإجمالي</span>
                            <span className="text-amber-500">{total.toLocaleString()} دج</span>
                        </div>
                    </div>

                    <Link href="/customer/checkout" className="btn-primary w-full text-center block py-3 text-lg">
                        إتمام الطلب
                    </Link>

                    <Link href="/customer" className="block text-center text-gray-400 hover:text-white mt-4 text-sm">
                        متابعة التسوق
                    </Link>
                </div>
            </div>
        </div>
    );
}
