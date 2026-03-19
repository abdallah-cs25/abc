'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
    lat: number;
    lng: number;
    label?: string;
}

interface TrackingMapProps {
    storeLocation?: Location;
    customerLocation?: Location;
    driverLocation?: Location;
    orderStatus?: string;
}

// Custom marker icons
const createIcon = (emoji: string, color: string, size: number = 40) => {
    return L.divIcon({
        html: `<div style="
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${size * 0.5}px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 3px solid white;
            animation: ${color === '#22c55e' ? 'pulse 2s infinite' : 'none'};
        ">${emoji}</div>`,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
    });
};

const storeIcon = createIcon('🏪', '#3b82f6');
const customerIcon = createIcon('🏠', '#ef4444');
const driverIcon = createIcon('🚗', '#22c55e', 50);

export default function TrackingMap({
    storeLocation,
    customerLocation,
    driverLocation,
    orderStatus,
}: TrackingMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const routeRef = useRef<L.Polyline | null>(null);
    const driverMarkerRef = useRef<L.Marker | null>(null);
    const [estimatedTime, setEstimatedTime] = useState<string>('');

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default center on Algeria (Algiers)
        const defaultCenter: [number, number] = [36.7538, 3.0588];

        mapRef.current = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 14,
            zoomControl: false, // We'll add custom controls
        });

        // Add OpenStreetMap tiles (free, no API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
        }).addTo(mapRef.current);

        // Add zoom control to top-left
        L.control.zoom({ position: 'topleft' }).addTo(mapRef.current);

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

        // Clear existing markers (except driver)
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        const bounds: L.LatLngExpression[] = [];

        // Add store marker
        if (storeLocation) {
            const marker = L.marker([storeLocation.lat, storeLocation.lng], { icon: storeIcon })
                .addTo(mapRef.current)
                .bindPopup(`<b>🏪 ${storeLocation.label || 'المتجر'}</b><br>نقطة الاستلام`);
            markersRef.current.push(marker);
            bounds.push([storeLocation.lat, storeLocation.lng]);
        }

        // Add customer marker
        if (customerLocation) {
            const marker = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
                .addTo(mapRef.current)
                .bindPopup(`<b>🏠 عنوان التوصيل</b><br>${customerLocation.label || ''}`);
            markersRef.current.push(marker);
            bounds.push([customerLocation.lat, customerLocation.lng]);
        }

        // Add driver marker (animated)
        if (driverLocation) {
            if (driverMarkerRef.current) {
                // Smoothly animate driver position
                driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
            } else {
                driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`<b>🚗 ${driverLocation.label || 'السائق'}</b><br>في طريقه إليك`);
            }
            bounds.push([driverLocation.lat, driverLocation.lng]);

            // Calculate estimated time
            if (customerLocation) {
                const distance = calculateDistance(
                    driverLocation.lat, driverLocation.lng,
                    customerLocation.lat, customerLocation.lng
                );
                const timeMinutes = Math.ceil(distance * 3); // Rough estimate: 3 min per km
                setEstimatedTime(`${timeMinutes} دقيقة`);
            }
        } else {
            // Remove driver marker if not tracking
            if (driverMarkerRef.current) {
                driverMarkerRef.current.remove();
                driverMarkerRef.current = null;
            }
            setEstimatedTime('');
        }

        // Draw route line
        if (routeRef.current) {
            routeRef.current.remove();
        }

        const routePoints: L.LatLngExpression[] = [];

        // Build route based on order status
        if (storeLocation) {
            routePoints.push([storeLocation.lat, storeLocation.lng]);
        }
        if (driverLocation && ['PICKED_UP', 'IN_TRANSIT'].includes(orderStatus || '')) {
            routePoints.push([driverLocation.lat, driverLocation.lng]);
        }
        if (customerLocation) {
            routePoints.push([customerLocation.lat, customerLocation.lng]);
        }

        if (routePoints.length >= 2) {
            routeRef.current = L.polyline(routePoints, {
                color: '#f59e0b',
                weight: 4,
                opacity: 0.8,
                dashArray: driverLocation ? undefined : '10, 10',
            }).addTo(mapRef.current);
        }

        // Fit map to show all markers
        if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, {
                padding: [80, 80],
                maxZoom: 15,
            });
        }
    }, [storeLocation, customerLocation, driverLocation, orderStatus]);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    return (
        <div className="relative h-full rounded-2xl overflow-hidden border border-white/10">
            {/* Map Container */}
            <div ref={mapContainerRef} className="h-full w-full" style={{ minHeight: '300px' }} />

            {/* Estimated Time Overlay */}
            {estimatedTime && (
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-lg rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center animate-pulse">
                        ⏱️
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">الوقت المتوقع</p>
                        <p className="text-lg font-bold text-amber-400">{estimatedTime}</p>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-lg rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                    <span className="text-white">المتجر</span>
                </div>
                {driverLocation && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-white">السائق</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 rounded-full bg-red-500"></span>
                    <span className="text-white">موقعك</span>
                </div>
            </div>

            {/* Status Message */}
            {orderStatus && (
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-lg rounded-xl p-3">
                    {orderStatus === 'PREPARING' && (
                        <p className="text-amber-400 text-sm flex items-center gap-2">
                            <span className="animate-bounce">👨‍🍳</span>
                            جاري تحضير طلبك...
                        </p>
                    )}
                    {orderStatus === 'READY' && (
                        <p className="text-cyan-400 text-sm flex items-center gap-2">
                            <span>📦</span>
                            طلبك جاهز في انتظار السائق
                        </p>
                    )}
                    {['PICKED_UP', 'IN_TRANSIT'].includes(orderStatus) && (
                        <p className="text-green-400 text-sm flex items-center gap-2">
                            <span className="animate-pulse">🛵</span>
                            السائق في طريقه إليك!
                        </p>
                    )}
                </div>
            )}

            {/* CSS for pulse animation */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
                    }
                }
            `}</style>
        </div>
    );
}
