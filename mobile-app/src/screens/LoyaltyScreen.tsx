import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, getHeaders } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function LoyaltyScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchLoyaltyData();
    }, []);

    const fetchLoyaltyData = async () => {
        try {
            const headers = await getHeaders();
            const response = await fetch(`${API_URL}/loyalty/my`, { headers });
            const data = await response.json();
            if (data.success) {
                setData(data.data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch loyalty data');
        } finally {
            setLoading(false);
        }
    };

    const getTierColors = (tier: string) => {
        switch (tier) {
            case 'Platinum': return ['#e2e8f0', '#94a3b8'];
            case 'Gold': return ['#fbbf24', '#d97706'];
            case 'Silver': return ['#cbd5e1', '#64748b'];
            default: return ['#fdba74', '#c2410c']; // Bronze
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('loyalty.title') || 'Loyalty Program'}</Text>
            </View>

            {/* Card */}
            <LinearGradient
                colors={getTierColors(data?.tier) as any}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardLabel}>{t('loyalty.membership') || 'MEMBERSHIP'}</Text>
                    <Ionicons name="ribbon" size={32} color="rgba(0,0,0,0.5)" />
                </View>

                <Text style={styles.tierText}>{data?.tier} Member</Text>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>{t('loyalty.balance') || 'Balance'}</Text>
                    <Text style={styles.balanceText}>{data?.balance} <Text style={styles.ptsText}>pts</Text></Text>
                </View>
            </LinearGradient>

            {/* Rewards Info */}
            <View style={styles.rewardsContainer}>
                <View style={styles.rewardItem}>
                    <View style={styles.iconBox}>
                        <Text style={{ fontSize: 24 }}>🎁</Text>
                    </View>
                    <Text style={styles.rewardTitle}>Rewards</Text>
                    <Text style={styles.rewardSub}>Get discounts</Text>
                </View>
                <View style={styles.rewardItem}>
                    <View style={styles.iconBox}>
                        <Text style={{ fontSize: 24 }}>⭐</Text>
                    </View>
                    <Text style={styles.rewardTitle}>Status</Text>
                    <Text style={styles.rewardSub}>Unlock Perks</Text>
                </View>
                <View style={styles.rewardItem}>
                    <View style={styles.iconBox}>
                        <Text style={{ fontSize: 24 }}>🛍️</Text>
                    </View>
                    <Text style={styles.rewardTitle}>Earn</Text>
                    <Text style={styles.rewardSub}>1pt / 100DA</Text>
                </View>
            </View>

            {/* History */}
            <Text style={styles.sectionTitle}>{t('loyalty.history') || 'Points History'}</Text>

            <View style={styles.historyList}>
                {data?.history.map((item: any) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View>
                            <Text style={styles.historyType}>
                                {item.source === 'order' ? 'Purchase Reward' : 'Bonus'}
                            </Text>
                            <Text style={styles.historyDate}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <Text style={styles.pointsText}>+{item.points}</Text>
                    </View>
                ))}
                {data?.history.length === 0 && (
                    <Text style={styles.emptyText}>No history yet</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    card: {
        margin: 20,
        borderRadius: 24,
        padding: 24,
        height: 200,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardLabel: {
        color: 'rgba(0,0,0,0.6)',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    tierText: {
        fontSize: 32,
        fontWeight: '900',
        color: 'rgba(0,0,0,0.8)',
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
    },
    balanceText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    ptsText: {
        fontSize: 16,
    },
    rewardsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    rewardItem: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    iconBox: {
        marginBottom: 8,
    },
    rewardTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    rewardSub: {
        color: '#94a3b8',
        fontSize: 10,
        textAlign: 'center',
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
        marginBottom: 12,
    },
    historyList: {
        padding: 20,
        paddingTop: 0,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    historyType: {
        color: 'white',
        fontWeight: '500',
        marginBottom: 4,
    },
    historyDate: {
        color: '#94a3b8',
        fontSize: 12,
    },
    pointsText: {
        color: '#4ade80',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 20,
    }
});
