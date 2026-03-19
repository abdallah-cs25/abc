'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    sortOrder: number;
    _count: {
        stores: number;
        products: number;
    };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', nameAr: '', nameFr: '', icon: '' });
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/categories?activeOnly=false');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3000/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newCategory),
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setNewCategory({ name: '', nameAr: '', nameFr: '', icon: '' });
                fetchCategories();
            } else {
                alert(data.message || data.messageAr || 'فشل إنشاء الفئة');
            }
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    const handleEditCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: editingCategory.name,
                    nameAr: editingCategory.nameAr,
                    nameFr: editingCategory.nameFr,
                    icon: editingCategory.icon,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setEditingCategory(null);
                fetchCategories();
            } else {
                alert(data.message || data.messageAr || 'فشل تعديل الفئة');
            }
        } catch (error) {
            console.error('Error editing category:', error);
        }
    };

    const handleToggleActive = async (category: Category) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/categories/${category.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !category.isActive }),
            });
            const data = await response.json();
            if (data.success) {
                setCategories(prev => prev.map(c =>
                    c.id === category.id ? { ...c, isActive: !c.isActive } : c
                ));
            }
        } catch (error) {
            console.error('Error toggling category:', error);
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
                    <Link href="/admin" className="sidebar-link"><span>📊</span><span>لوحة التحكم</span></Link>
                    <Link href="/admin/users" className="sidebar-link"><span>👥</span><span>المستخدمون</span></Link>
                    <Link href="/admin/stores" className="sidebar-link"><span>🏪</span><span>المتاجر</span></Link>
                    <Link href="/admin/orders" className="sidebar-link"><span>📦</span><span>الطلبات</span></Link>
                    <Link href="/admin/categories" className="sidebar-link active"><span>📁</span><span>الفئات</span></Link>
                    <Link href="/admin/commissions" className="sidebar-link"><span>💰</span><span>العمولات</span></Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 main-content p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">الفئات</h1>
                        <p className="text-gray-400">إدارة فئات المتاجر والمنتجات</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        + إضافة فئة
                    </button>
                </div>

                {/* Categories Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <div key={category.id} className={`glass-card p-6 text-center hover:scale-[1.02] transition-transform ${!category.isActive ? 'opacity-60' : ''}`}>
                                <div className="text-5xl mb-4">{category.icon || '📁'}</div>
                                <h3 className="text-xl font-bold text-white mb-1">{category.nameAr}</h3>
                                <p className="text-sm text-gray-400 mb-4">{category.name}</p>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-lg font-bold text-white">{category._count.stores}</p>
                                        <p className="text-xs text-gray-400">متجر</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-lg font-bold text-white">{category._count.products}</p>
                                        <p className="text-xs text-gray-400">منتج</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {category.isActive ? (
                                        <span className="badge badge-success">نشط</span>
                                    ) : (
                                        <span className="badge badge-error">معطل</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingCategory({ ...category })}
                                        className="flex-1 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2 rounded-lg transition"
                                    >
                                        ✏️ تعديل
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(category)}
                                        className={`flex-1 text-xs py-2 rounded-lg transition ${category.isActive
                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                            }`}
                                    >
                                        {category.isActive ? '🔴 تعطيل' : '🟢 تفعيل'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Category Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-card w-full max-w-md p-6 m-4">
                            <h2 className="text-xl font-bold text-white mb-6">إضافة فئة جديدة</h2>
                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالإنجليزية</label>
                                    <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالعربية</label>
                                    <input type="text" value={newCategory.nameAr} onChange={(e) => setNewCategory({ ...newCategory, nameAr: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالفرنسية</label>
                                    <input type="text" value={newCategory.nameFr} onChange={(e) => setNewCategory({ ...newCategory, nameFr: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الأيقونة (إيموجي)</label>
                                    <input type="text" value={newCategory.icon} onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })} className="input-field" placeholder="📁" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 btn-primary">إضافة</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-gray-300 py-3 rounded-lg hover:bg-white/10 transition">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Category Modal */}
                {editingCategory && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-card w-full max-w-md p-6 m-4">
                            <h2 className="text-xl font-bold text-white mb-6">تعديل الفئة</h2>
                            <form onSubmit={handleEditCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالإنجليزية</label>
                                    <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالعربية</label>
                                    <input type="text" value={editingCategory.nameAr} onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الاسم بالفرنسية</label>
                                    <input type="text" value={editingCategory.nameFr} onChange={(e) => setEditingCategory({ ...editingCategory, nameFr: e.target.value })} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الأيقونة (إيموجي)</label>
                                    <input type="text" value={editingCategory.icon || ''} onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })} className="input-field" placeholder="📁" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 btn-primary">💾 حفظ</button>
                                    <button type="button" onClick={() => setEditingCategory(null)} className="flex-1 bg-white/5 text-gray-300 py-3 rounded-lg hover:bg-white/10 transition">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
