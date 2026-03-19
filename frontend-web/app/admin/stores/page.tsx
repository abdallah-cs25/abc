'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    logo?: string;
    address: string;
    city: string;
    phone?: string;
    rating: number;
    isActive: boolean;
    isVerified: boolean;
    category: {
        id: string;
        name: string;
        nameAr: string;
    };
    _count: {
        products: number;
    };
}

interface Category {
    id: string;
    name: string;
    nameAr: string;
}

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        nameAr: '',
        address: '',
        city: '',
        phone: '',
        isActive: true,
        isVerified: false,
    });
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const [storesRes, categoriesRes] = await Promise.all([
                fetch('http://localhost:3000/api/stores'),
                fetch('http://localhost:3000/api/categories'),
            ]);
            const [storesData, categoriesData] = await Promise.all([
                storesRes.json(),
                categoriesRes.json(),
            ]);
            if (storesData.success) setStores(storesData.data.stores);
            if (categoriesData.success) setCategories(categoriesData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewClick = (store: Store) => {
        setSelectedStore(store);
        setShowViewModal(true);
    };

    const handleEditClick = (store: Store) => {
        setSelectedStore(store);
        setEditForm({
            name: store.name,
            nameAr: store.nameAr || '',
            address: store.address,
            city: store.city,
            phone: store.phone || '',
            isActive: store.isActive,
            isVerified: store.isVerified,
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedStore) return;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:3000/api/stores/${selectedStore.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
            if (data.success) {
                setStores(stores.map(s => s.id === selectedStore.id ? { ...s, ...editForm } : s));
                setShowEditModal(false);
                setSelectedStore(null);
            } else {
                alert(data.message || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error('Error updating store:', error);
            alert('حدث خطأ في الاتصال');
        }
    };

    const handleToggleStatus = async (storeId: string, field: 'isActive' | 'isVerified', currentValue: boolean) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/stores/${storeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [field]: !currentValue }),
            });

            const data = await response.json();
            if (data.success) {
                setStores(stores.map(s => s.id === storeId ? { ...s, [field]: !currentValue } : s));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
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
                    <Link href="/admin" className="sidebar-link">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/admin/users" className="sidebar-link">
                        <span>👥</span>
                        <span>المستخدمون</span>
                    </Link>
                    <Link href="/admin/stores" className="sidebar-link active">
                        <span>🏪</span>
                        <span>المتاجر</span>
                    </Link>
                    <Link href="/admin/orders" className="sidebar-link">
                        <span>📦</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/admin/categories" className="sidebar-link">
                        <span>📁</span>
                        <span>الفئات</span>
                    </Link>
                    <Link href="/admin/commissions" className="sidebar-link">
                        <span>💰</span>
                        <span>العمولات</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">المتاجر</h1>
                        <p className="text-gray-400">إدارة جميع المتاجر على المنصة</p>
                    </div>
                </div>

                {/* Stores Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map((store) => (
                            <div key={store.id} className="glass-card p-6 hover:scale-[1.02] transition-transform">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                                        🏪
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(store.id, 'isVerified', store.isVerified)}
                                            className={`badge cursor-pointer hover:opacity-80 ${store.isVerified ? 'badge-success' : 'bg-gray-500/20 text-gray-400'}`}
                                        >
                                            {store.isVerified ? '✓ موثق' : 'غير موثق'}
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(store.id, 'isActive', store.isActive)}
                                            className={`badge cursor-pointer hover:opacity-80 ${store.isActive ? 'badge-primary' : 'badge-error'}`}
                                        >
                                            {store.isActive ? 'نشط' : 'معطل'}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{store.nameAr || store.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">{store.category.nameAr}</p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>📍</span>
                                        <span>{store.city} - {store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>📦</span>
                                        <span>{store._count.products} منتج</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <span>⭐</span>
                                        <span>{store.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                                    <button
                                        onClick={() => handleViewClick(store)}
                                        className="flex-1 btn-primary text-sm py-2"
                                    >
                                        👁️ عرض
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(store)}
                                        className="flex-1 bg-white/5 text-gray-300 py-2 rounded-lg hover:bg-white/10 transition text-sm"
                                    >
                                        ✏️ تعديل
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && stores.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🏪</div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد متاجر</h3>
                        <p className="text-gray-400">لم يتم إنشاء أي متاجر بعد</p>
                    </div>
                )}
            </main>

            {/* View Modal */}
            {showViewModal && selectedStore && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4">
                        <h2 className="text-2xl font-bold text-white mb-6">تفاصيل المتجر</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">الاسم (عربي)</p>
                                    <p className="text-white font-medium">{selectedStore.nameAr || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">الاسم (انجليزي)</p>
                                    <p className="text-white font-medium">{selectedStore.name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">الفئة</p>
                                <p className="text-white font-medium">{selectedStore.category.nameAr}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">العنوان</p>
                                <p className="text-white font-medium">{selectedStore.city} - {selectedStore.address}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">المنتجات</p>
                                    <p className="text-white font-medium">{selectedStore._count.products}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">التقييم</p>
                                    <p className="text-amber-400 font-medium">⭐ {selectedStore.rating.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => { setShowViewModal(false); handleEditClick(selectedStore); }}
                                className="btn-primary flex-1"
                            >
                                ✏️ تعديل
                            </button>
                            <button
                                onClick={() => { setShowViewModal(false); setSelectedStore(null); }}
                                className="btn-secondary flex-1"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedStore && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">تعديل بيانات المتجر</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الاسم (عربي)</label>
                                    <input
                                        type="text"
                                        value={editForm.nameAr}
                                        onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">الاسم (انجليزي)</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">المدينة</label>
                                <input
                                    type="text"
                                    value={editForm.city}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">العنوان</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="input-field"
                                />
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

                            <div className="flex gap-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="storeActive"
                                        checked={editForm.isActive}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <label htmlFor="storeActive" className="text-white">متجر نشط</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="storeVerified"
                                        checked={editForm.isVerified}
                                        onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <label htmlFor="storeVerified" className="text-white">متجر موثق</label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={handleSaveEdit} className="btn-primary flex-1">
                                💾 حفظ التغييرات
                            </button>
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedStore(null); }}
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
