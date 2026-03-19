'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    salePrice?: number;
    images: string; // JSON string
    category: {
        nameAr: string;
    };
}

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    address: string;
    city: string;
}

export default function StoreDetailsPage() {
    const { storeId } = useParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStoreData();
    }, [storeId]);

    const fetchStoreData = async () => {
        try {
            const [storeRes, productsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/stores/${storeId}`),
                fetch(`http://localhost:3000/api/products?storeId=${storeId}`)
            ]);

            const storeData = await storeRes.json();
            const productsData = await productsRes.json();

            if (storeData.success) setStore(storeData.data);
            if (productsData.success) setProducts(productsData.data.products);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isRtl = i18n.language === 'ar';
    const nameKey = isRtl ? 'nameAr' : 'name';

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;
    if (!store) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Store not found</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4">
            <div className="max-w-6xl mx-auto">
                <Link href="/customer" className="text-gray-400 hover:text-white mb-4 block">← {t('customer.back') || 'Back'}</Link>

                {/* Store Header */}
                <div className="glass-card p-8 mb-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-4xl mb-4">
                            🏪
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{store[nameKey as keyof Store] || store.name}</h1>
                        <p className="text-gray-400">{store.description}</p>
                        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
                            <span>📍 {store.city}</span>
                            <span>⭐ 4.5</span>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <h2 className="text-2xl font-bold mb-6">{t('common.products') || 'Products'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => {
                        let imageUrl = '';
                        try {
                            const parsed = JSON.parse(product.images);
                            imageUrl = parsed[0] || '';
                        } catch (e) { }

                        return (
                            <Link
                                href={`/customer/store/${storeId}/product/${product.id}`}
                                key={product.id}
                                className="glass-card p-4 hover:scale-[1.02] transition block"
                            >
                                <div className="aspect-square bg-gray-800 rounded-lg mb-3 overflow-hidden">
                                    {imageUrl ? (
                                        <img src={`http://localhost:3000${imageUrl}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                    )}
                                </div>
                                <h3 className="font-bold truncate">{product[nameKey as keyof Product] || product.name}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-amber-400 font-bold">{product.salePrice || product.price} DA</span>
                                    {product.salePrice && <span className="text-xs text-gray-500 line-through">{product.price} DA</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
