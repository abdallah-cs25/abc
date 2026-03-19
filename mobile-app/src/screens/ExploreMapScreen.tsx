import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../services/api';

const { width } = Dimensions.get('window');

interface Store {
    id: string;
    name: string;
    nameAr?: string;
    latitude?: number;
    longitude?: number;
    category: {
        nameAr: string;
        icon?: string;
    };
}

export default function ExploreMapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            fetchStores();
        })();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await fetch(`${API_URL}/stores`);
            const data = await response.json();
            if (data.success) {
                // Mocking coordinates for demo since real stores might not have them yet
                const storesWithCoords = data.data.stores.map((store: any, index: number) => ({
                    ...store,
                    latitude: store.latitude || 36.75 + (Math.random() * 0.05 - 0.025),
                    longitude: store.longitude || 3.05 + (Math.random() * 0.05 - 0.025),
                }));
                setStores(storesWithCoords);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            {location ? (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_DEFAULT}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation={true}
                >
                    {stores.map((store) => (
                        <Marker
                            key={store.id}
                            coordinate={{
                                latitude: store.latitude || 0,
                                longitude: store.longitude || 0,
                            }}
                        >
                            <View style={styles.markerContainer}>
                                <Text style={styles.markerEmoji}>{store.category?.icon || '🏪'}</Text>
                            </View>
                            <Callout onPress={() => (navigation as any).navigate('Store', { storeId: store.id })}>
                                <View style={styles.callout}>
                                    <Text style={styles.storeName}>{store.nameAr || store.name}</Text>
                                    <Text style={styles.storeCategory}>{store.category?.nameAr}</Text>
                                    <TouchableOpacity style={styles.btn}>
                                        <Text style={styles.btnText}>زيارة المتجر</Text>
                                    </TouchableOpacity>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>
            ) : (
                <View style={styles.loading}>
                    <Text style={{ color: '#fff' }}>جاري تحميل الخريطة...</Text>
                </View>
            )}

            {!location && (
                <View style={styles.overlay}>
                    <Text style={styles.overlayText}>يرجى تفعيل الموقع لرؤية المتاجر القريبة</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    map: { width: '100%', height: '100%' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    markerContainer: {
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#3b82f6',
    },
    markerEmoji: { fontSize: 20 },
    callout: {
        width: 150,
        padding: 5,
        alignItems: 'center',
    },
    storeName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
    storeCategory: { fontSize: 10, color: '#64748b', marginBottom: 5 },
    btn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    btnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    overlay: {
        position: 'absolute', bottom: 50, left: 20, right: 20,
        backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 10
    },
    overlayText: { color: '#fff', textAlign: 'center' }
});
