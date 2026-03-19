'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    price: number;
    salePrice?: number;
    stock: number;
    isActive: boolean;
    images: string;
    categoryId?: string;
    category: {
        id: string;
        name: string;
        nameAr: string;
    };
}

interface Store {
    id: string;
    name: string;
    nameAr?: string;
}

export default function StoreProductsPage() {
    const params = useParams();
    const router = useRouter();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);

    // New product form state
    const [productForm, setProductForm] = useState({
        name: '',
        nameAr: '',
        description: '',
        price: 0,
        salePrice: 0,
        stock: 0,
        categoryId: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchData(token);
    }, [params.storeId]);

    const fetchData = async (token: string) => {
        try {
            const [storeRes, productsRes, categoriesRes] = await Promise.all([
                fetch(`http://localhost:3000/api/stores/${params.storeId}`),
                fetch(`http://localhost:3000/api/products?storeId=${params.storeId}`),
                fetch('http://localhost:3000/api/categories'),
            ]);

            const [storeData, productsData, categoriesData] = await Promise.all([
                storeRes.json(),
                productsRes.json(),
                categoriesRes.json(),
            ]);

            if (storeData.success) setStore(storeData.data);
            if (productsData.success) setProducts(productsData.data.products);
            if (categoriesData.success) setCategories(categoriesData.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        setSaving(true);

        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...productForm,
                    storeId: params.storeId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setProducts([data.data, ...products]);
                setShowAddModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            nameAr: product.nameAr || '',
            description: product.description || '',
            price: product.price,
            salePrice: product.salePrice || 0,
            stock: product.stock,
            categoryId: product.categoryId || product.category?.id || '',
        });
        setShowEditModal(true);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        const token = localStorage.getItem('token');
        setSaving(true);

        try {
            const response = await fetch(`http://localhost:3000/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(productForm),
            });

            const data = await response.json();
            if (data.success) {
                setProducts(products.map(p =>
                    p.id === editingProduct.id ? { ...p, ...productForm } : p
                ));
                setShowEditModal(false);
                setEditingProduct(null);
                resetForm();
            } else {
                alert(data.message || 'حدث خطأ أثناء التحديث');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setProductForm({
            name: '',
            nameAr: '',
            description: '',
            price: 0,
            salePrice: 0,
            stock: 0,
            categoryId: '',
        });
    };

    const toggleProductStatus = async (productId: string, isActive: boolean) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !isActive }),
            });
            setProducts(products.map(p => p.id === productId ? { ...p, isActive: !isActive } : p));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setProducts(products.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Reusable form JSX
    const ProductFormFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">اسم المنتج (عربي) *</label>
                    <input
                        type="text"
                        value={productForm.nameAr}
                        onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                        className="input-field"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">اسم المنتج (إنجليزي) *</label>
                    <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="input-field"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">الفئة</label>
                <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="input-field"
                    required
                >
                    <option value="">اختر الفئة</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">السعر (دج) *</label>
                    <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">سعر التخفيض</label>
                    <input
                        type="number"
                        value={productForm.salePrice}
                        onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-2">الكمية *</label>
                    <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">الوصف</label>
                <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <div className="mb-6">
                <Link href={`/seller/stores/${params.storeId}`} className="text-gray-400 hover:text-white">
                    ← العودة لتفاصيل المتجر
                </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">منتجات: {store?.nameAr || store?.name}</h1>
                    <p className="text-gray-400">{products.length} منتج</p>
                </div>
                <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
                    + إضافة منتج
                </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="glass-card p-4">
                        <div className="h-32 bg-white/5 rounded-xl mb-4 flex items-center justify-center relative">
                            <span className="text-4xl">📦</span>
                            {product.salePrice && product.salePrice > 0 && (
                                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg">
                                    خصم
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{product.nameAr || product.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{product.category?.nameAr}</p>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-amber-400 font-bold">{product.price.toLocaleString()} دج</span>
                                {product.salePrice && product.salePrice > 0 && (
                                    <span className="text-xs text-green-400 mr-2">
                                        → {product.salePrice.toLocaleString()} دج
                                    </span>
                                )}
                            </div>
                            <span className={`text-sm ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {product.stock > 0 ? `${product.stock} متوفر` : 'نفذ'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleProductStatus(product.id, product.isActive)}
                                className={`flex-1 py-2 rounded-lg text-sm ${product.isActive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                            >
                                {product.isActive ? 'إخفاء' : 'تفعيل'}
                            </button>
                            <button
                                onClick={() => handleEditClick(product)}
                                className="flex-1 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400"
                            >
                                ✏️ تعديل
                            </button>
                            <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="py-2 px-3 rounded-lg text-sm bg-red-500/20 text-red-400"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-16">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-xl font-bold mb-2">لا توجد منتجات</h3>
                    <p className="text-gray-400 mb-4">أضف منتجك الأول لبدء البيع</p>
                    <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary">
                        + إضافة منتج
                    </button>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">إضافة منتج جديد</h2>
                        <form onSubmit={handleAddProduct}>
                            <ProductFormFields />
                            <div className="flex gap-4 pt-6">
                                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                                    {saving ? 'جاري الإضافة...' : '+ إضافة المنتج'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">تعديل المنتج</h2>
                        <form onSubmit={handleUpdateProduct}>
                            <ProductFormFields />
                            <div className="flex gap-4 pt-6">
                                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingProduct(null); }}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
