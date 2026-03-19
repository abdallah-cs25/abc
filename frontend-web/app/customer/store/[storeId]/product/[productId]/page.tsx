'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function ProductDetailsPage() {
    const { storeId, productId } = useParams();
    const { t, i18n } = useTranslation();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/products/${productId}`);
            const data = await res.json();
            if (data.success) setProduct(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isRtl = i18n.language === 'ar';
    const nameKey = isRtl ? 'nameAr' : 'name';

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;
    if (!product) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Product not found</div>;

    let attributes: any = {};
    try {
        attributes = JSON.parse(product.attributes || '{}');
    } catch (e) { }

    let images: string[] = [];
    try {
        images = JSON.parse(product.images || '[]');
    } catch (e) { }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4">
            <div className="max-w-4xl mx-auto">
                <Link href={`/customer/store/${storeId}`} className="text-gray-400 hover:text-white mb-6 block">← {t('common.back') || 'Back'}</Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden border border-white/10">
                            {images.length > 0 ? (
                                <img src={`http://localhost:3000${images[0]}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <div className="mb-6">
                            <span className="text-amber-500 text-sm font-bold tracking-wider uppercase mb-2 block">{product.category.nameAr}</span>
                            <h1 className="text-3xl font-bold mb-2">{product[nameKey] || product.name}</h1>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-3xl font-bold text-amber-400">{product.salePrice || product.price} دج</span>
                                {product.salePrice && <span className="text-lg text-gray-500 line-through mb-1">{product.price} دج</span>}
                            </div>
                            <p className="text-gray-300 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Specific Attributes Display */}
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="font-bold text-lg border-b border-white/10 pb-2">المواصفات</h3>

                            {/* Clothing */}
                            {attributes.type === 'clothing' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">المقاسات المتاحة</span>
                                        <div className="flex gap-2">
                                            {attributes.availableSizes?.map((s: string) => (
                                                <span key={s} className="bg-white/10 px-2 py-1 rounded text-sm">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">الألوان</span>
                                        <div className="flex gap-2">
                                            {attributes.availableColors?.map((c: string) => (
                                                <span key={c} className="w-6 h-6 rounded-full border border-white/30" style={{ backgroundColor: c === 'White' ? '#fff' : c === 'Black' ? '#000' : 'gray' }} title={c}></span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Perfume */}
                            {attributes.type === 'perfume' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">العائلة</span>
                                        <span>{attributes.family}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">التركيز</span>
                                        <span>{attributes.concentration}</span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-gray-400 block mb-2">الهرم العطري</span>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-2"><span className="text-amber-500">القمة:</span> {attributes.topNotes?.join(', ')}</div>
                                            <div className="flex gap-2"><span className="text-amber-500">القلب:</span> {attributes.heartNotes?.join(', ')}</div>
                                            <div className="flex gap-2"><span className="text-amber-500">القاعدة:</span> {attributes.baseNotes?.join(', ')}</div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Equipment */}
                            {attributes.type === 'equipment' && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">العلامة التجارية</span>
                                        <span>{attributes.brand}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">المادة</span>
                                        <span>{attributes.material}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">الوزن</span>
                                        <span>{attributes.weight} kg</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">الأبعاد</span>
                                        <span>{attributes.dimensions?.length}x{attributes.dimensions?.width}x{attributes.dimensions?.height} cm</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">الضمان</span>
                                        <span className="text-green-400">{attributes.warranty}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Add to Cart */}
                        <button className="w-full btn-gold py-4 mt-6 text-xl font-bold">
                            إضافة للسلة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
