import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ShoppingBag, Star, Plus } from 'lucide-react-native';
import { API_URL } from '../services/api';
import { useCart } from '../context/CartContext';

export default function StoreScreen() {
    const [products, setProducts] = useState([]);
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const route = useRoute();
    const navigation = useNavigation();
    const { addToCart, items } = useCart();
    const { storeId }: any = route.params;

    useEffect(() => {
        fetchStoreDetails();
    }, []);

    const fetchStoreDetails = async () => {
        try {
            // Fetch store info
            const storeRes = await fetch(`${API_URL}/stores/${storeId}`); // You might need to implement single store endpoint or filter
            // For now let's assume we fetch products directly which usually contains store info or we fetch generic

            const productsRes = await fetch(`${API_URL}/products?storeId=${storeId}`);
            const productsData = await productsRes.json();

            if (productsData.success) {
                setProducts(productsData.data.products);
                // Assuming first product has store details or separate endpoint
                if (productsData.data.products.length > 0) {
                    setStore(productsData.data.products[0].store);
                }
            }
        } catch (error) {
            Alert.alert('خطأ', 'تعذر تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: any) => {
        addToCart(product, store);
        Alert.alert('تم', 'أضيف المنتج إلى السلة');
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{store?.nameAr || 'المتجر'}</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Cart')} style={styles.cartBtn}>
                    <ShoppingBag color="#fff" size={24} />
                    {items.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{items.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => (navigation as any).navigate('ProductDetails', { product: item, store })}
                    >
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.emoji}>📦</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.name}>{item.nameAr || item.name}</Text>
                            <Text style={styles.price}>{item.price} دج</Text>
                            {/* Short stock warning or quick add if no variants */}
                            {item.stock === 0 && <Text style={styles.outOfStock}>نفذت الكمية</Text>}
                        </View>
                        <View style={styles.addBtn}>
                            <Plus size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#1e293b',
    },
    backBtn: { padding: 8 },
    backText: { color: '#fff', fontSize: 24 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cartBtn: { position: 'relative', padding: 8 },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    list: { padding: 16 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#334155',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emoji: { fontSize: 32 },
    cardContent: { flex: 1 },
    name: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    price: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    addBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    outOfStock: { color: '#ef4444', fontSize: 12 },
});
