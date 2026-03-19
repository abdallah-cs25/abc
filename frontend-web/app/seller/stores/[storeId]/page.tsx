'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    nameAr: string;
}

const ALGERIAN_CITIES = [
    'الجزائر العاصمة', 'وهران', 'قسنطينة', 'عنابة', 'باتنة',
    'سطيف', 'البليدة', 'تلمسان', 'بجاية', 'تيزي وزو',
];

export default function SellerStoreDetailsPage() {
    const params = useParams();
    const [store, setStore] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        nameAr: '',
        description: '',
        phone: '',
        address: '',
        city: '',
        categoryId: '',
        deliveryRadius: 5,
        minOrder: 500,
    });
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchData(token);
    }, []);

    const fetchData = async (token: string) => {
        try {
            const [storeRes, categoriesRes] = await Promise.all([
                fetch(`http://localhost:3000/api/stores/${params.storeId}`),
                fetch('http://localhost:3000/api/categories'),
            ]);
            const [storeData, categoriesData] = await Promise.all([
                storeRes.json(),
                categoriesRes.json(),
            ]);

            if (storeData.success) {
                setStore(storeData.data);
                setEditForm({
                    name: storeData.data.name || '',
                    nameAr: storeData.data.nameAr || '',
                    description: storeData.data.description || '',
                    phone: storeData.data.phone || '',
                    address: storeData.data.address || '',
                    city: storeData.data.city || '',
                    categoryId: storeData.data.categoryId || '',
                    deliveryRadius: storeData.data.deliveryRadius || 5,
                    minOrder: storeData.data.minOrder || 500,
                });
            }
            if (categoriesData.success) setCategories(categoriesData.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        const token = localStorage.getItem('token');
        setSaving(true);

        try {
            const response = await fetch(`http://localhost:3000/api/stores/${params.storeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
            if (data.success) {
                setStore({ ...store, ...editForm });
                setShowEditModal(false);
            } else {
                alert(data.message || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error('Error updating store:', error);
            alert('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/stores/${params.storeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !store.isActive }),
            });

            const data = await response.json();
            if (data.success) {
                setStore({ ...store, isActive: !store.isActive });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) return <div className="p-8 text-white">جاري التحميل...</div>;
    if (!store) return <div className="p-8 text-white">المتجر غير موجود</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <Link href="/seller/stores" className="text-gray-400 hover:text-white mb-4 block">← العودة للمتاجر</Link>

            <div className="glass-card p-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{store.nameAr || store.name}</h1>
                        <p className="text-gray-400">{store.category?.nameAr}</p>
                    </div>
                    <button
                        onClick={handleToggleActive}
                        className={`text-2xl cursor-pointer hover:scale-110 transition`}
                        title={store.isActive ? 'انقر لإيقاف المتجر' : 'انقر لتفعيل المتجر'}
                    >
                        {store.isActive ? '✅' : '🔴'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">معلومات الاتصال</h3>
                        <div className="space-y-2 text-gray-300">
                            <p>📍 {store.city} - {store.address}</p>
                            <p>📱 {store.phone || 'غير متوفر'}</p>
                            {store.description && <p className="text-sm italic">{store.description}</p>}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4">الإحصائيات</h3>
                        <div className="flex gap-4">
                            <div className="bg-white/5 p-4 rounded-xl text-center flex-1">
                                <p className="text-2xl font-bold">{store.products?.length || store._count?.products || 0}</p>
                                <p className="text-sm text-gray-400">منتجات</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl text-center flex-1">
                                <p className="text-2xl font-bold">⭐ {store.rating?.toFixed(1) || '0.0'}</p>
                                <p className="text-sm text-gray-400">التقييم</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn-primary"
                    >
                        ✏️ تعديل البيانات
                    </button>
                    <Link href={`/seller/stores/${store.id}/products`} className="btn-secondary">
                        📦 إدارة المنتجات
                    </Link>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">تعديل بيانات المتجر</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">اسم المتجر (عربي) *</label>
                                    <input
                                        type="text"
                                        value={editForm.nameAr}
                                        onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">اسم المتجر (إنجليزي) *</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">فئة المتجر</label>
                                <select
                                    value={editForm.categoryId}
                                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">اختر الفئة</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">وصف المتجر</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="input-field"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الولاية</label>
                                    <select
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="">اختر الولاية</option>
                                        {ALGERIAN_CITIES.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">العنوان التفصيلي</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">نطاق التوصيل (كم)</label>
                                    <input
                                        type="number"
                                        value={editForm.deliveryRadius}
                                        onChange={(e) => setEditForm({ ...editForm, deliveryRadius: Number(e.target.value) })}
                                        className="input-field"
                                        min="1"
                                        max="50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الحد الأدنى للطلب (دج)</label>
                                    <input
                                        type="number"
                                        value={editForm.minOrder}
                                        onChange={(e) => setEditForm({ ...editForm, minOrder: Number(e.target.value) })}
                                        className="input-field"
                                        min="0"
                                        step="100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="btn-secondary flex-1"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
