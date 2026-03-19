import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { API_URL, getHeaders } from '../services/api';

export default function CartScreen() {
    const { items, removeFromCart, total, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);

        try {
            const headers = await getHeaders();
            const orderData = {
                deliveryAddress: "الجزائر العاصمة (موقع تجريبي)", // In production, use GPS
                deliveryLatitude: 36.75,
                deliveryLongitude: 3.05,
                items: items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    storeId: item.storeId
                }))
            };

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert('نجاح', 'تم إرسال طلبك بنجاح!', [
                    {
                        text: 'حسناً', onPress: () => {
                            clearCart();
                            navigation.goBack();
                        }
                    }
                ]);
            } else {
                Alert.alert('خطأ', data.message || 'فشل إرسال الطلب');
            }
        } catch (error) {
            Alert.alert('خطأ', 'حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>سلة التسوق</Text>
                <View style={{ width: 40 }} />
            </View>

            {items.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>السلة فارغة 🛒</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.row}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.price}>{item.price * item.quantity} DA</Text>
                                </View>

                                {/* Selected Variants */}
                                {item.selectedVariant && (
                                    <View style={styles.variantContainer}>
                                        {item.selectedVariant.size && (
                                            <Text style={styles.variantText}>Size: {item.selectedVariant.size}</Text>
                                        )}
                                        {item.selectedVariant.color && (
                                            <Text style={styles.variantText}>• Color: {item.selectedVariant.color}</Text>
                                        )}
                                        {item.selectedVariant.subscriptionType && (
                                            <Text style={styles.variantText}>Type: {item.selectedVariant.subscriptionType}</Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.row}>
                                    <Text style={styles.store}>{item.storeName}</Text>
                                    <View style={styles.controls}>
                                        <Text style={styles.qty}>الكمية: {item.quantity}</Text>
                                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                            <Text style={styles.removeText}>حذف</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    />

                    <View style={styles.footer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>المجموع:</Text>
                            <Text style={styles.totalValue}>{total.toLocaleString()} دج</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.checkoutText}>تأكيد الطلب</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#64748b', fontSize: 18 },
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
    list: { padding: 16 },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    price: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold' },
    store: { color: '#94a3b8', fontSize: 12 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    qty: { color: '#cbd5e1', fontSize: 14 },
    removeText: { color: '#ef4444', fontSize: 14 },
    footer: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    totalLabel: { color: '#fff', fontSize: 18 },
    totalValue: { color: '#3b82f6', fontSize: 20, fontWeight: 'bold' },
    checkoutBtn: {
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    variantContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    variantText: { color: '#94a3b8', fontSize: 13, backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
});
