'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Droplets, Star } from 'lucide-react';

const SCENT_FAMILIES = ['Floral', 'Woody', 'Fresh', 'Oriental', 'Fruity', 'Spicy', 'Citrus'];
const CONCENTRATIONS = ['Parfum', 'Eau de Parfum (EDP)', 'Eau de Toilette (EDT)', 'Eau de Cologne (EDC)'];

interface ScentNote {
    type: 'TOP' | 'HEART' | 'BASE';
    note: string;
}

export default function AddPerfumeProductPage() {
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
        family: 'Floral',
        concentration: 'Eau de Parfum (EDP)',
        gender: 'Unisex',
        size: '100ml',
        topNotes: [] as string[],
        heartNotes: [] as string[],
        baseNotes: [] as string[]
    });

    // Helper state for input fields
    const [currentNote, setCurrentNote] = useState({ top: '', heart: '', base: '' });

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

    const addNote = (type: 'top' | 'heart' | 'base') => {
        if (!currentNote[type]) return;
        setAttributes(prev => ({
            ...prev,
            [`${type}Notes`]: [...prev[`${type}Notes`], currentNote[type]]
        }));
        setCurrentNote(prev => ({ ...prev, [type]: '' }));
    };

    const removeNote = (type: 'top' | 'heart' | 'base', noteToRemove: string) => {
        setAttributes(prev => ({
            ...prev,
            [`${type}Notes`]: prev[`${type}Notes`].filter(note => note !== noteToRemove)
        }));
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
                    categoryId: 'ckz9d...', // Should be dynamic, but assuming ID for now or handling in backend
                    attributes: JSON.stringify({
                        type: 'perfume',
                        ...attributes
                    }),
                    images: JSON.stringify(product.image ? [product.image] : [])
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('تم إضافة العطر بنجاح!');
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

                <h1 className="text-3xl font-bold mb-2">إضافة عطر جديد</h1>
                <p className="text-gray-400 mb-8">أضف تفاصيل العطر، التركيز، والمكونات العطرية</p>

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
                                <label className="block text-gray-400 mb-2">اسم العطر</label>
                                <input
                                    type="text"
                                    value={product.nameAr}
                                    onChange={(e) => setProduct(prev => ({ ...prev, nameAr: e.target.value, name: e.target.value }))}
                                    className="input-field w-full"
                                    placeholder="مثال: مسك الليل"
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
                                    placeholder="وصف العطر..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Perfume Specifics */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Droplets size={20} className="text-purple-400" />
                                خصائص العطر
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">العائلة العطرية</label>
                                    <select
                                        value={attributes.family}
                                        onChange={(e) => setAttributes(prev => ({ ...prev, family: e.target.value }))}
                                        className="input-field w-full"
                                    >
                                        {SCENT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-400 mb-2">التركيز</label>
                                    <select
                                        value={attributes.concentration}
                                        onChange={(e) => setAttributes(prev => ({ ...prev, concentration: e.target.value }))}
                                        className="input-field w-full"
                                    >
                                        {CONCENTRATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 mb-2">الحجم</label>
                                        <input
                                            type="text"
                                            value={attributes.size}
                                            onChange={(e) => setAttributes(prev => ({ ...prev, size: e.target.value }))}
                                            className="input-field w-full"
                                            placeholder="e.g. 100ml"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-2">الجنس</label>
                                        <select
                                            value={attributes.gender}
                                            onChange={(e) => setAttributes(prev => ({ ...prev, gender: e.target.value }))}
                                            className="input-field w-full"
                                        >
                                            <option value="Unisex">للجنسين</option>
                                            <option value="Men">رجالي</option>
                                            <option value="Women">نسائي</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Olfactory Pyramid */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Star size={20} className="text-yellow-400" />
                                الهرم العطري
                            </h2>

                            {/* Top Notes */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">القمة العطرية (Top Notes)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={currentNote.top}
                                        onChange={(e) => setCurrentNote(prev => ({ ...prev, top: e.target.value }))}
                                        className="input-field flex-1 py-1 px-3 text-sm"
                                        placeholder="إضافة مكون..."
                                    />
                                    <button onClick={() => addNote('top')} className="btn-primary py-1 px-3">+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {attributes.topNotes.map(note => (
                                        <span key={note} className="bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">
                                            {note}
                                            <button onClick={() => removeNote('top', note)}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Heart Notes */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">قلب العطر (Heart Notes)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={currentNote.heart}
                                        onChange={(e) => setCurrentNote(prev => ({ ...prev, heart: e.target.value }))}
                                        className="input-field flex-1 py-1 px-3 text-sm"
                                        placeholder="إضافة مكون..."
                                    />
                                    <button onClick={() => addNote('heart')} className="btn-primary py-1 px-3">+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {attributes.heartNotes.map(note => (
                                        <span key={note} className="bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">
                                            {note}
                                            <button onClick={() => removeNote('heart', note)}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Base Notes */}
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">قاعدة العطر (Base Notes)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={currentNote.base}
                                        onChange={(e) => setCurrentNote(prev => ({ ...prev, base: e.target.value }))}
                                        className="input-field flex-1 py-1 px-3 text-sm"
                                        placeholder="إضافة مكون..."
                                    />
                                    <button onClick={() => addNote('base')} className="btn-primary py-1 px-3">+</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {attributes.baseNotes.map(note => (
                                        <span key={note} className="bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">
                                            {note}
                                            <button onClick={() => removeNote('base', note)}><X size={12} /></button>
                                        </span>
                                    ))}
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
                        {loading ? 'جاري الإضافة...' : '✓ إضافة العطر'}
                    </button>
                </div>
            </div>
        </div>
    );
}
