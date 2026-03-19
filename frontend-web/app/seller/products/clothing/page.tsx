'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Palette, Ruler } from 'lucide-react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COLORS = [
    { name: 'أسود', nameEn: 'Black', hex: '#000000' },
    { name: 'أبيض', nameEn: 'White', hex: '#FFFFFF' },
    { name: 'أحمر', nameEn: 'Red', hex: '#EF4444' },
    { name: 'أزرق', nameEn: 'Blue', hex: '#3B82F6' },
    { name: 'أخضر', nameEn: 'Green', hex: '#22C55E' },
    { name: 'بني', nameEn: 'Brown', hex: '#92400E' },
    { name: 'رمادي', nameEn: 'Gray', hex: '#6B7280' },
    { name: 'بيج', nameEn: 'Beige', hex: '#D4A574' },
];

interface ProductVariant {
    size: string;
    color: string;
    stock: number;
    sku: string;
}

export default function AddClothingProductPage() {
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [product, setProduct] = useState({
        name: '',
        nameAr: '',
        description: '',
        price: 0,
        salePrice: 0,
        storeId: '',
    });
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    const router = useRouter();

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        // Auto-generate variants when sizes or colors change
        const newVariants: ProductVariant[] = [];
        selectedSizes.forEach(size => {
            selectedColors.forEach(color => {
                const existing = variants.find(v => v.size === size && v.color === color);
                newVariants.push(existing || {
                    size,
                    color,
                    stock: 0,
                    sku: `${product.name.substring(0, 3).toUpperCase()}-${size}-${color.substring(0, 2).toUpperCase()}`
                });
            });
        });
        setVariants(newVariants);
    }, [selectedSizes, selectedColors]);

    const fetchStores = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/stores/my/stores', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStores(data.data);
                if (data.data.length > 0) {
                    setProduct(prev => ({ ...prev, storeId: data.data[0].id }));
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const updateVariantStock = (size: string, color: string, stock: number) => {
        setVariants(prev => prev.map(v =>
            v.size === size && v.color === color ? { ...v, stock } : v
        ));
    };

    const handleSubmit = async () => {
        if (!product.name || !product.storeId || variants.length === 0) {
            alert('يرجى ملء جميع الحقول المطلوبة وإضافة متغيرات');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Calculate total stock
            const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

            // Create product with variants as attributes
            const res = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...product,
                    stock: totalStock,
                    attributes: JSON.stringify({
                        type: 'clothing',
                        variants: variants,
                        availableSizes: selectedSizes,
                        availableColors: selectedColors,
                    })
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('تم إضافة المنتج بنجاح!');
                router.push('/seller/products');
            } else {
                alert(data.message || 'حدث خطأ');
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/seller/products" className="text-gray-400 hover:text-white text-sm mb-4 block">
                    ← العودة للمنتجات
                </Link>

                <h1 className="text-3xl font-bold mb-2">إضافة منتج ملابس</h1>
                <p className="text-gray-400 mb-8">أضف منتج ملابس مع المقاسات والألوان المتاحة</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            📝 المعلومات الأساسية
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-2">المتجر</label>
                                <select
                                    value={product.storeId}
                                    onChange={(e) => setProduct(prev => ({ ...prev, storeId: e.target.value }))}
                                    className="input-field w-full"
                                >
                                    {stores.map(store => (
                                        <option key={store.id} value={store.id}>{store.nameAr || store.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">اسم المنتج (عربي)</label>
                                <input
                                    type="text"
                                    value={product.nameAr}
                                    onChange={(e) => setProduct(prev => ({ ...prev, nameAr: e.target.value }))}
                                    className="input-field w-full"
                                    placeholder="مثال: تيشيرت قطني"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">اسم المنتج (إنجليزي)</label>
                                <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))}
                                    className="input-field w-full"
                                    placeholder="e.g. Cotton T-Shirt"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">السعر (دج)</label>
                                    <input
                                        type="number"
                                        value={product.price}
                                        onChange={(e) => setProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">سعر التخفيض</label>
                                    <input
                                        type="number"
                                        value={product.salePrice}
                                        onChange={(e) => setProduct(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">الوصف</label>
                                <textarea
                                    value={product.description}
                                    onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))}
                                    className="input-field w-full h-24"
                                    placeholder="وصف المنتج..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className="space-y-6">
                        {/* Sizes */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Ruler size={20} className="text-blue-400" />
                                المقاسات المتاحة
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {SIZES.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => toggleSize(size)}
                                        className={`px-4 py-2 rounded-lg font-bold transition ${selectedSizes.includes(size)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Palette size={20} className="text-pink-400" />
                                الألوان المتاحة
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map(color => (
                                    <button
                                        key={color.nameEn}
                                        onClick={() => toggleColor(color.nameEn)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${selectedColors.includes(color.nameEn)
                                                ? 'ring-2 ring-amber-500 bg-white/20'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white/30"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <span className="text-sm">{color.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants Stock Table */}
                {variants.length > 0 && (
                    <div className="glass-card p-6 mt-8">
                        <h2 className="text-xl font-bold mb-4">📦 المخزون حسب المتغيرات</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="text-right px-4 py-3 text-gray-400">المقاس</th>
                                        <th className="text-right px-4 py-3 text-gray-400">اللون</th>
                                        <th className="text-right px-4 py-3 text-gray-400">الكمية</th>
                                        <th className="text-right px-4 py-3 text-gray-400">SKU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((variant, idx) => (
                                        <tr key={idx} className="border-b border-white/5">
                                            <td className="px-4 py-3 font-bold">{variant.size}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: COLORS.find(c => c.nameEn === variant.color)?.hex }}
                                                    />
                                                    {COLORS.find(c => c.nameEn === variant.color)?.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) => updateVariantStock(variant.size, variant.color, Number(e.target.value))}
                                                    className="input-field w-24 text-center"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">{variant.sku}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-left">
                            <p className="text-gray-400">
                                إجمالي المخزون: <span className="text-white font-bold">{variants.reduce((sum, v) => sum + v.stock, 0)}</span> قطعة
                            </p>
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-gold px-8 py-3 text-lg"
                    >
                        {loading ? 'جاري الإضافة...' : '✓ إضافة المنتج'}
                    </button>
                </div>
            </div>
        </div>
    );
}
