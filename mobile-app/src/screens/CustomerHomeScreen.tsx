import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, I18nManager } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LogOut, MapPin } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../services/api';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export default function CustomerHomeScreen() {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await fetch(`${API_URL}/stores`);
            const data = await response.json();
            if (data.success) {
                setStores(data.data.stores);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = async (lang: string) => {
        try {
            await AsyncStorage.setItem('user-language', lang);
            i18n.changeLanguage(lang);
            const isRtl = lang === 'ar';
            if (I18nManager.isRTL !== isRtl) {
                I18nManager.allowRTL(isRtl);
                I18nManager.forceRTL(isRtl);
                // Reload app to apply RTL changes
                // In Expo Go, this might not full restart, but Updates.reloadAsync() works in builds
                // For now, we alert user to restart if RTL changes
            }
        } catch (error) {
            console.error('Error changing language', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{t('welcome')}،</Text>
                    <Text style={styles.username}>{user?.fullName}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => changeLanguage('ar')} style={styles.langBtn}>
                        <Text style={styles.langBtnText}>ع</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLanguage('en')} style={styles.langBtn}>
                        <Text style={styles.langBtnText}>EN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeLanguage('fr')} style={styles.langBtn}>
                        <Text style={styles.langBtnText}>FR</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut color="#ef4444" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Quick Actions */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                        onPress={() => (navigation as any).navigate('Subscriptions')}
                    >
                        <Ionicons name="barbell" size={20} color="white" />
                        <Text style={styles.actionBtnText}>{t('gym.subscriptions') || 'Gyms'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                        onPress={() => (navigation as any).navigate('Loyalty')}
                    >
                        <Ionicons name="ribbon" size={20} color="white" />
                        <Text style={styles.actionBtnText}>{t('loyalty.title') || 'Loyalty'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.banner}>
                    <Text style={styles.bannerTitle}>{t('nearby')}</Text>
                    <Text style={styles.bannerSubtitle}>{t('search')}</Text>
                    <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => (navigation as any).navigate('ExploreMap')}
                    >
                        <MapPin color="#fff" size={20} />
                        <Text style={styles.mapBtnText}>{t('nearby')}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>{t('stores')}</Text>

                {loading ? (
                    <ActivityIndicator color="#3b82f6" size="large" />
                ) : (
                    <View style={styles.grid}>
                        {stores.map((store: any) => (
                            <TouchableOpacity
                                key={store.id}
                                style={styles.card}
                                onPress={() => (navigation as any).navigate('Store', { storeId: store.id })}
                            >
                                <View style={styles.cardImagePlaceholder}>
                                    <Text style={{ fontSize: 30 }}>{store.category?.icon || '🏪'}</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.storeName}>{store.nameAr || store.name}</Text>
                                    <View style={styles.ratingRow}>
                                        <Text style={styles.rating}>⭐ {store.rating?.toFixed(1) || '0.0'}</Text>
                                        <Text style={styles.distance}>{store.category?.nameAr}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    greeting: {
        color: '#94a3b8',
        fontSize: 14,
    },
    username: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#334155',
        borderRadius: 12,
    },
    langBtn: {
        padding: 8,
        backgroundColor: '#334155',
        borderRadius: 8,
        width: 35,
        alignItems: 'center'
    },
    langBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    banner: {
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    bannerSubtitle: {
        color: '#bfdbfe',
        fontSize: 16,
        marginBottom: 16,
    },
    mapBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    mapBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
    },
    cardImagePlaceholder: {
        height: 100,
        backgroundColor: '#334155',
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {},
    storeName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    rating: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    distance: {
        color: '#94a3b8',
        fontSize: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
