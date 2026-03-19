import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell } from 'lucide-react-native';
import { API_URL, getHeaders } from '../services/api';
import { registerForPushNotificationsAsync, sendLocalNotification } from '../services/notifications';

export default function DriverHomeScreen() {
    const { user, logout } = useAuth();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [isWorking, setIsWorking] = useState(false);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            // 1. GPS Permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('تنبيه', 'نحتاج إذن الموقع لتتبع التوصيلات');
                return;
            }
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // 2. Notification Permissions
            await registerForPushNotificationsAsync();
        })();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWorking) {
            interval = setInterval(async () => {
                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation);
                updateServerLocation(currentLocation.coords);
            }, 10000); // Update every 10 seconds
        }
        return () => clearInterval(interval);
    }, [isWorking]);

    const updateServerLocation = async (coords: any) => {
        try {
            const headers = await getHeaders();
            await fetch(`${API_URL}/delivery/location`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    latitude: coords.latitude,
                    longitude: coords.longitude
                }),
            });
        } catch (error) {
            console.error('Failed to update location');
        }
    };

    const toggleWorkStatus = () => {
        setIsWorking(!isWorking);
        if (!isWorking) {
            sendLocalNotification('بدء العمل 🟢', 'أنت الآن متاح لاستقبال الطلبات!');
        } else {
            sendLocalNotification('توقف العمل 🔴', 'تم إيقاف استقبال الطلبات.');
        }
    };

    const simulateNewOrder = () => {
        sendLocalNotification('طلب جديد! 📦', 'لديك طلب توصيل جديد من "بيتزا هت"');
        Alert.alert('طلب جديد', 'لديك طلب جديد، هل تريد قبوله؟', [
            { text: 'قبول', onPress: () => console.log('Accepted') },
            { text: 'رفض', style: 'cancel' }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>السائق</Text>
                    <Text style={styles.username}>{user?.fullName}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut color="#ef4444" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                {location ? (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={true}
                    >
                    </MapView>
                ) : (
                    <View style={styles.loadingMap}>
                        <Text style={{ color: '#fff' }}>جاري تحديد الموقع...</Text>
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                <View style={styles.statusCard}>
                    <Text style={styles.statusTitle}>الحالة الحالية</Text>
                    <TouchableOpacity onPress={toggleWorkStatus}>
                        <View style={[styles.statusBadge, isWorking ? styles.online : styles.offline]}>
                            <Text style={[styles.statusText, isWorking ? styles.onlineText : styles.offlineText]}>
                                {isWorking ? '🟢 متاح للعمل' : '⚫ غير متاح'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={simulateNewOrder} style={styles.simulateBtn}>
                    <Bell color="#fff" size={20} />
                    <Text style={styles.simulateText}>تجربة إشعار طلب جديد</Text>
                </TouchableOpacity>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>توصيلات اليوم</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>0 دج</Text>
                        <Text style={styles.statLabel}>أرباح اليوم</Text>
                    </View>
                </View>
            </View>
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
        marginBottom: 20,
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
    mapContainer: {
        height: 300,
        marginHorizontal: 0,
        marginBottom: 20,
        backgroundColor: '#334155'
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingMap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        paddingHorizontal: 20,
        flex: 1,
    },
    statusCard: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    online: { backgroundColor: '#10b98120' },
    offline: { backgroundColor: '#64748b20' },
    statusText: { fontWeight: 'bold' },
    onlineText: { color: '#10b981' },
    offlineText: { color: '#94a3b8' },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statLabel: {
        color: '#94a3b8',
        fontSize: 12,
    },
    simulateBtn: {
        backgroundColor: '#f59e0b',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    simulateText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
