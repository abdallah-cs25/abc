'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    isFeatured: boolean;
    images: string;
    store: {
        id: string;
        name: string;
        nameAr?: string;
    };
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

interface Category {
    id: string;
    name: string;
    nameAr: string;
}

export default function SellerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedStore, setSelectedStore] = useState('');
    const router = useRouter();

    // New Product State
    const [newProduct, setNewProduct] = useState({
        name: '',
        nameAr: '',
        description: '',
        price: '',
        salePrice: '',
        stock: '',
        storeId: '',
        categoryId: '',
        image: ''
    });
    const [uploading, setUploading] = useState(false);

    // Edit product state
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState({
        name: '', nameAr: '', description: '', price: '', salePrice: '', stock: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (!token || !userData) {
            router.push('/');
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'SELLER') {
            router.push('/');
            return;
        }
        fetchData(token);
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const [storesRes, categoriesRes] = await Promise.all([
                fetch('http://localhost:3000/api/stores/my/stores', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('http://localhost:3000/api/categories')
            ]);

            const storesData = await storesRes.json();
            const categoriesData = await categoriesRes.json();

            if (storesData.success) {
                setStores(storesData.data);
                if (storesData.data.length > 0) {
                    setNewProduct(prev => ({ ...prev, storeId: storesData.data[0].id }));
                }

                // Fetch products
                const allProducts: Product[] = [];
                for (const store of storesData.data) {
                    const productsRes = await fetch(`http://localhost:3000/api/products?storeId=${store.id}`);
                    const productsData = await productsRes.json();
                    if (productsData.success) {
                        allProducts.push(...productsData.data.products);
                    }
                }
                setProducts(allProducts);
            }

            if (categoriesData.success) {
                setCategories(categoriesData.data);
                if (categoriesData.data.length > 0) {
                    setNewProduct(prev => ({ ...prev, categoryId: categoriesData.data[0].id }));
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setNewProduct({ ...newProduct, image: data.data.url });
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const payload = {
                ...newProduct,
                price: parseFloat(newProduct.price),
                salePrice: newProduct.salePrice ? parseFloat(newProduct.salePrice) : undefined,
                stock: parseInt(newProduct.stock),
                images: JSON.stringify([newProduct.image]) // Store as JSON array string
            };

            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setNewProduct({
                    name: '', nameAr: '', description: '', price: '',
                    salePrice: '', stock: '', storeId: stores[0]?.id || '',
                    categoryId: categories[0]?.id || '', image: ''
                });
                fetchData(token!);
            } else {
                alert(data.message || 'فشل إضافة المنتج');
            }
        } catch (error) {
            console.error('Create product error:', error);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            nameAr: product.nameAr || '',
            description: product.description || '',
            price: product.price.toString(),
            salePrice: product.salePrice?.toString() || '',
            stock: product.stock.toString(),
        });
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...editForm,
                    price: parseFloat(editForm.price),
                    salePrice: editForm.salePrice ? parseFloat(editForm.salePrice) : null,
                    stock: parseInt(editForm.stock),
                }),
            });
            const data = await response.json();
            if (data.success) {
                setEditingProduct(null);
                fetchData(token!);
            } else {
                alert(data.message || 'فشل تعديل المنتج');
            }
        } catch (error) {
            console.error('Edit product error:', error);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setProducts(prev => prev.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Delete product error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="sidebar w-64 fixed h-full p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                        <span className="text-xl">🌍</span>
                    </div>
                    <span className="text-xl font-bold text-white">My World</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/seller" className="sidebar-link">
                        <span>📊</span>
                        <span>لوحة التحكم</span>
                    </Link>
                    <Link href="/seller/stores" className="sidebar-link">
                        <span>🏪</span>
                        <span>متاجري</span>
                    </Link>
                    <Link href="/seller/products" className="sidebar-link active">
                        <span>📦</span>
                        <span>المنتجات</span>
                    </Link>
                    <Link href="/seller/orders" className="sidebar-link">
                        <span>🛒</span>
                        <span>الطلبات</span>
                    </Link>
                    <Link href="/seller/earnings" className="sidebar-link">
                        <span>💰</span>
                        <span>الأرباح</span>
                    </Link>
                </nav>

                <div className="border-t border-white/10 pt-4 mt-4">
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <span>🚪</span>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 mr-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">المنتجات</h1>
                        <p className="text-gray-400">إدارة جميع منتجاتك</p>
                    </div>
                    <div className="relative group">
                        <button className="btn-gold flex items-center gap-2">
                            + إضافة منتج
                        </button>
                        <div className="absolute left-0 top-full mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full text-right px-4 py-3 hover:bg-white/5 transition flex items-center gap-2"
                            >
                                <span>📦</span> عام
                            </button>
                            <Link
                                href="/seller/products/clothing"
                                className="w-full text-right px-4 py-3 hover:bg-white/5 transition flex items-center gap-2 block"
                            >
                                <span>👕</span> ملابس
                            </Link>
                            <Link
                                href="/seller/products/perfumes"
                                className="w-full text-right px-4 py-3 hover:bg-white/5 transition flex items-center gap-2 block"
                            >
                                <span>🧴</span> عطور
                            </Link>
                            <Link
                                href="/seller/products/equipment"
                                className="w-full text-right px-4 py-3 hover:bg-white/5 transition flex items-center gap-2 block"
                            >
                                <span>🏋️‍♀️</span> معدات رياضية
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter by Store */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setSelectedStore('')}
                        className={`px-4 py-2 rounded-lg transition ${!selectedStore ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        جميع المتاجر
                    </button>
                    {stores.map((store) => (
                        <button
                            key={store.id}
                            onClick={() => setSelectedStore(store.id)}
                            className={`px-4 py-2 rounded-lg transition ${selectedStore === store.id ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {store.nameAr || store.name}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد منتجات</h3>
                        <p className="text-gray-400 mb-4">ابدأ بإضافة منتجاتك</p>
                        <button onClick={() => setShowModal(true)} className="btn-gold">
                            إضافة منتج
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products
                            .filter((p) => !selectedStore || p.store.id === selectedStore)
                            .map((product) => {
                                let imageUrl = '';
                                try {
                                    const parsedImages = JSON.parse(product.images);
                                    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                                        imageUrl = parsedImages[0];
                                    }
                                } catch (e) { }

                                return (
                                    <div key={product.id} className="glass-card p-4 hover:scale-[1.02] transition-transform">
                                        <div className="aspect-square rounded-xl bg-gray-800 mb-4 overflow-hidden relative">
                                            {imageUrl ? (
                                                <img
                                                    src={`http://localhost:3000${imageUrl}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-white mb-1 truncate">{product.nameAr || product.name}</h3>
                                        <p className="text-sm text-gray-400 mb-2 truncate">{product.store.nameAr || product.store.name}</p>

                                        <div className="flex items-center gap-2 mb-3">
                                            {product.salePrice ? (
                                                <>
                                                    <span className="text-lg font-bold text-green-400">{product.salePrice} دج</span>
                                                    <span className="text-sm text-gray-500 line-through">{product.price} دج</span>
                                                </>
                                            ) : (
                                                <span className="text-lg font-bold text-white">{product.price} دج</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-sm mb-3">
                                            <span className="text-gray-400">المخزون: {product.stock}</span>
                                            {product.isActive ? (
                                                <span className="badge badge-success">نشط</span>
                                            ) : (
                                                <span className="badge badge-error">معطل</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(product)}
                                                className="flex-1 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2 rounded-lg transition"
                                            >
                                                ✏️ تعديل
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="flex-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 py-2 rounded-lg transition"
                                            >
                                                🗑️ حذف
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* Add Product Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">إضافة منتج جديد</h2>
                            <form onSubmit={handleCreateProduct} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">اسم المنج (EN)</label>
                                        <input
                                            type="text"
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">اسم المنتج (AR)</label>
                                        <input
                                            type="text"
                                            value={newProduct.nameAr}
                                            onChange={(e) => setNewProduct({ ...newProduct, nameAr: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">الوصف</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="input-field min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">السعر (دج)</label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">سعر التخفيض (اختياري)</label>
                                        <input
                                            type="number"
                                            value={newProduct.salePrice}
                                            onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">المخزون</label>
                                        <input
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">المتجر</label>
                                        <select
                                            value={newProduct.storeId}
                                            onChange={(e) => setNewProduct({ ...newProduct, storeId: e.target.value })}
                                            className="input-field"
                                            required
                                        >
                                            {stores.map(store => (
                                                <option key={store.id} value={store.id}>{store.nameAr || store.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-2">الفئة</label>
                                        <select
                                            value={newProduct.categoryId}
                                            onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                                            className="input-field"
                                            required
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">صورة المنتج</label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600"
                                        />
                                        {uploading && <div className="text-amber-400 text-sm">جاري الرفع...</div>}
                                    </div>
                                    {newProduct.image && (
                                        <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-white/20">
                                            <img src={`http://localhost:3000${newProduct.image}`} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="submit" className="flex-1 btn-gold" disabled={uploading}>
                                        حفظ المنتج
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-white/5 text-gray-300 py-3 rounded-lg hover:bg-white/10 transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
