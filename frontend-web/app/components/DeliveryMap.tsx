'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
    lat: number;
    lng: number;
    label?: string;
    type: 'driver' | 'pickup' | 'delivery';
}

interface DeliveryMapProps {
    driverLocation?: { lat: number; lng: number };
    pickupLocation?: { lat: number; lng: number; label?: string };
    deliveryLocation?: { lat: number; lng: number; label?: string };
    onLocationUpdate?: (lat: number, lng: number) => void;
}

// Custom marker icons
const createIcon = (emoji: string, color: string) => {
    return L.divIcon({
        html: `<div style="
            background: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
        ">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
};

const driverIcon = createIcon('🚗', '#22c55e');
const pickupIcon = createIcon('🏪', '#3b82f6');
const deliveryIcon = createIcon('🏠', '#ef4444');

export default function DeliveryMap({
    driverLocation,
    pickupLocation,
    deliveryLocation,
    onLocationUpdate,
}: DeliveryMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routeRef = useRef<L.Polyline | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default center on Algeria (Algiers)
        const defaultCenter: [number, number] = [36.7538, 3.0588];

        mapRef.current = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 13,
            zoomControl: true,
        });

        // Add OpenStreetMap tiles (free, no API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapRef.current);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers when locations change
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        const bounds: L.LatLngExpression[] = [];

        // Add driver marker
        if (driverLocation || currentLocation) {
            const loc = currentLocation || driverLocation!;
            const marker = L.marker([loc.lat, loc.lng], { icon: driverIcon })
                .addTo(mapRef.current)
                .bindPopup('<b>📍 موقعك الحالي</b>');
            markersRef.current.push(marker);
            bounds.push([loc.lat, loc.lng]);
        }

        // Add pickup marker
        if (pickupLocation) {
            const marker = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
                .addTo(mapRef.current)
                .bindPopup(`<b>🏪 نقطة الاستلام</b><br>${pickupLocation.label || ''}`);
            markersRef.current.push(marker);
            bounds.push([pickupLocation.lat, pickupLocation.lng]);
        }

        // Add delivery marker
        if (deliveryLocation) {
            const marker = L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
                .addTo(mapRef.current)
                .bindPopup(`<b>🏠 عنوان التوصيل</b><br>${deliveryLocation.label || ''}`);
            markersRef.current.push(marker);
            bounds.push([deliveryLocation.lat, deliveryLocation.lng]);
        }

        // Draw route line
        if (routeRef.current) {
            routeRef.current.remove();
        }

        if (bounds.length >= 2) {
            const routePoints: L.LatLngExpression[] = [];

            if (currentLocation || driverLocation) {
                const loc = currentLocation || driverLocation!;
                routePoints.push([loc.lat, loc.lng]);
            }
            if (pickupLocation) {
                routePoints.push([pickupLocation.lat, pickupLocation.lng]);
            }
            if (deliveryLocation) {
                routePoints.push([deliveryLocation.lat, deliveryLocation.lng]);
            }

            if (routePoints.length >= 2) {
                routeRef.current = L.polyline(routePoints, {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.7,
                    dashArray: '10, 10',
                }).addTo(mapRef.current);
            }
        }

        // Fit map to show all markers
        if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
        }
    }, [driverLocation, pickupLocation, deliveryLocation, currentLocation]);

    // GPS tracking functions
    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('المتصفح لا يدعم خدمة GPS');
            return;
        }

        setIsTracking(true);

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCurrentLocation(newLoc);
                onLocationUpdate?.(newLoc.lat, newLoc.lng);
            },
            (error) => {
                console.error('GPS Error:', error);
                alert('تعذر الوصول للموقع. تأكد من تفعيل GPS.');
                setIsTracking(false);
            },
            { enableHighAccuracy: true }
        );

        // Watch position for live updates
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCurrentLocation(newLoc);
                onLocationUpdate?.(newLoc.lat, newLoc.lng);
            },
            (error) => console.error('GPS Watch Error:', error),
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    };

    // Calculate distance between two points
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const distanceToPickup = currentLocation && pickupLocation
        ? calculateDistance(currentLocation.lat, currentLocation.lng, pickupLocation.lat, pickupLocation.lng)
        : null;

    const distanceToDelivery = currentLocation && deliveryLocation
        ? calculateDistance(currentLocation.lat, currentLocation.lng, deliveryLocation.lat, deliveryLocation.lng)
        : null;

    return (
        <div className="rounded-2xl overflow-hidden border border-white/10">
            {/* Map Container */}
            <div ref={mapContainerRef} className="h-64 md:h-80 w-full" />

            {/* Controls & Info */}
            <div className="bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={isTracking ? stopTracking : startTracking}
                        className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${isTracking
                                ? 'bg-red-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}
                    >
                        {isTracking ? (
                            <>
                                <span className="animate-pulse">🔴</span>
                                إيقاف التتبع
                            </>
                        ) : (
                            <>
                                <span>📍</span>
                                تفعيل GPS
                            </>
                        )}
                    </button>

                    {currentLocation && (
                        <div className="text-xs text-gray-400">
                            آخر تحديث: {new Date().toLocaleTimeString('ar-DZ')}
                        </div>
                    )}
                </div>

                {/* Distance Info */}
                {(distanceToPickup || distanceToDelivery) && (
                    <div className="grid grid-cols-2 gap-3">
                        {distanceToPickup && (
                            <div className="bg-blue-500/10 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span>🏪</span>
                                    <span className="text-sm text-gray-400">للمتجر</span>
                                </div>
                                <p className="text-lg font-bold text-blue-400">{distanceToPickup} كم</p>
                            </div>
                        )}
                        {distanceToDelivery && (
                            <div className="bg-red-500/10 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span>🏠</span>
                                    <span className="text-sm text-gray-400">للعميل</span>
                                </div>
                                <p className="text-lg font-bold text-red-400">{distanceToDelivery} كم</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        موقعك
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        المتجر
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        العميل
                    </div>
                </div>
            </div>
        </div>
    );
}
