import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, getHeaders } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function SubscriptionScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const headers = await getHeaders();
            // Fetching active subscriptions
            const response = await fetch(`${API_URL}/subscriptions/my`, { headers });
            const data = await response.json();
            if (data.success) {
                setSubscriptions(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('gym.mySubscriptions') || 'My Subscriptions'}</Text>
            </View>

            <FlatList
                data={subscriptions}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#22c55e' : '#ef4444' }]}>
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View>

                        <View style={styles.cardContent}>
                            <Text style={styles.gymName}>{item.name}</Text>
                            <Text style={styles.planType}>{item.type} Plan</Text>

                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                                <Text style={styles.dateText}>
                                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                </Text>
                            </View>

                            {item.qrCode && (
                                <View style={styles.qrContainer}>
                                    <View style={styles.qrPlaceholder}>
                                        <Ionicons name="qr-code-outline" size={64} color="white" />
                                    </View>
                                    <Text style={styles.qrText}>Show at entrance</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="barbell-outline" size={64} color="#334155" />
                        <Text style={styles.emptyText}>No active subscriptions</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    list: { padding: 20 },
    card: { backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
    statusBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 1 },
    statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    cardContent: { padding: 20 },
    gymName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    planType: { color: '#fbbf24', fontSize: 14, marginBottom: 16 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    dateText: { color: '#94a3b8', fontSize: 12 },
    qrContainer: { alignItems: 'center', backgroundColor: '#0f172a', padding: 20, borderRadius: 12 },
    qrPlaceholder: { marginBottom: 8 },
    qrText: { color: '#94a3b8', fontSize: 12 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', marginTop: 16 }
});
