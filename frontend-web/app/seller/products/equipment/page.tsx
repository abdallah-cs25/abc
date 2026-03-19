'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Box, Ruler, Info } from 'lucide-react';

export default function AddEquipmentProductPage() {
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [product, setProduct] = useState({
        name: '',
        nameAr: '',
        description: '',
        price: 0,
        salePrice: 0,
        storeId: '',
        stock: 0,
        image: ''
    });
    const [attributes, setAttributes] = useState({
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        material: '',
        warranty: '1 Year',
        brand: '',
        color: ''
    });
    
    const router = useRouter();

    useEffect(() => {
        fetchStores();
    }, []);

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

    const handleSubmit = async () => {
        if (!product.name || !product.storeId || !product.price) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            const res = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...product,
                    categoryId: 'equipment...', // Should be dynamic
                    attributes: JSON.stringify({
                        type: 'equipment',
                        ...attributes
                    }),
                    images: JSON.stringify(product.image ? [product.image] : [])
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('تم إضافة المعدات بنجاح!');
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
                
                <h1 className="text-3xl font-bold mb-2">إضافة معدات رياضية</h1>
                <p className="text-gray-400 mb-8">أضف المواصفات الفنية، الأبعاد، والضمان للمعدات</p>

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
                                <label className="block text-gray-400 mb-2">اسم المنتج</label>
                                <input
                                    type="text"
                                    value={product.nameAr}
                                    onChange={(e) => setProduct(prev => ({ ...prev, nameAr: e.target.value, name: e.target.value }))}
                                    className="input-field w-full"
                                    placeholder="مثال: جهاز ركض كهربائي"
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
                                    <label className="block text-gray-400 mb-2">المخزون</label>
                                    <input
                                        type="number"
                                        value={product.stock}
                                        onChange={(e) => setProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
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

                    {/* Equipment Specs */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Ruler size={20} className="text-blue-400" />
                                المواصفات الفنية
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 mb-2">العلامة التجارية</label>
                                        <input 
                                            type="text" 
                                            value={attributes.brand}
                                            onChange={(e) => setAttributes(prev => ({ ...prev, brand: e.target.value }))}
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-2">المادة</label>
                                        <input 
                                            type="text" 
                                            value={attributes.material}
                                            onChange={(e) => setAttributes(prev => ({ ...prev, material: e.target.value }))}
                                            className="input-field w-full"
                                            placeholder="Steel, Plastic..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-2">الوزن (kg)</label>
                                    <input 
                                        type="text" 
                                        value={attributes.weight}
                                        onChange={(e) => setAttributes(prev => ({ ...prev, weight: e.target.value }))}
                                        className="input-field w-full"
                                    />
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl">
                                    <label className="block text-gray-300 font-bold mb-3">الأبعاد (سم)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">الطول</label>
                                            <input 
                                                type="number"
                                                value={attributes.dimensions.length}
                                                onChange={(e) => setAttributes(prev => ({ ...prev, dimensions: { ...prev.dimensions, length: e.target.value } }))}
                                                className="input-field w-full text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">العرض</label>
                                            <input 
                                                type="number"
                                                value={attributes.dimensions.width}
                                                onChange={(e) => setAttributes(prev => ({ ...prev, dimensions: { ...prev.dimensions, width: e.target.value } }))}
                                                className="input-field w-full text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">الارتفاع</label>
                                            <input 
                                                type="number"
                                                value={attributes.dimensions.height}
                                                onChange={(e) => setAttributes(prev => ({ ...prev, dimensions: { ...prev.dimensions, height: e.target.value } }))}
                                                className="input-field w-full text-center"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-2">الضمان</label>
                                    <select 
                                        value={attributes.warranty}
                                        onChange={(e) => setAttributes(prev => ({ ...prev, warranty: e.target.value }))}
                                        className="input-field w-full"
                                    >
                                        <option value="None">بدون ضمان</option>
                                        <option value="6 Months">6 أشهر</option>
                                        <option value="1 Year">1 سنة</option>
                                        <option value="2 Years">2 سنوات</option>
                                        <option value="5 Years">5 سنوات</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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
