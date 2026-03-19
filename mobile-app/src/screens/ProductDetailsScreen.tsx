import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { product, store }: any = route.params;
    const { addToCart } = useCart();

    const [images, setImages] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<any>({});

    // Selection state
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');

    useEffect(() => {
        try {
            const parsedImages = JSON.parse(product.images || '[]');
            setImages(parsedImages.length > 0 ? parsedImages : []);
        } catch (e) {
            setImages([]);
        }

        try {
            const parsedAttrs = JSON.parse(product.attributes || '{}');
            setAttributes(parsedAttrs);
            // Auto-select first options if available
            if (parsedAttrs.availableSizes?.length > 0) setSelectedSize(parsedAttrs.availableSizes[0]);
            if (parsedAttrs.availableColors?.length > 0) setSelectedColor(parsedAttrs.availableColors[0]);
        } catch (e) {
            setAttributes({});
        }
    }, [product]);

    const handleAddToCart = () => {
        // Validation for Clothing
        if (attributes.type === 'clothing') {
            if (!selectedSize) {
                Alert.alert('Attention', 'Please select a size');
                return;
            }
            if (!selectedColor) {
                Alert.alert('Attention', 'Please select a color');
                return;
            }
        }

        addToCart({
            ...product,
            selectedVariant: {
                size: selectedSize,
                color: selectedColor,
                subscriptionType: attributes.type === 'gym' ? 'Standard' : undefined // Basic handling for now
            }
        }, store);

        const successMessage = attributes.type === 'gym' ? 'Subscription added to cart!' : 'Added to cart!';
        Alert.alert('Success', successMessage);
    };

    const isGym = attributes.type === 'gym';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    {images.length > 0 ? (
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                            {images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: `http://10.0.2.2:3000${img}` }}
                                    style={{ width, height: 300, resizeMode: 'cover' }}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={[styles.image, styles.placeholder]}>
                            <Text style={{ fontSize: 60 }}>
                                {isGym ? '🏋️' : '📦'}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Image Indicators */}
                    {images.length > 1 && (
                        <View style={styles.indicators}>
                            {images.map((_, i) => (
                                <View key={i} style={[styles.dot, i === 0 && styles.activeDot]} />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name}>{product.nameAr || product.name}</Text>
                        <Text style={styles.price}>{product.salePrice || product.price} DA</Text>
                    </View>

                    {product.salePrice && (
                        <Text style={styles.originalPrice}>{product.price} DA</Text>
                    )}

                    <Text style={styles.description}>{product.description}</Text>

                    {/* GYM SUBSCRIPTION ATTRIBUTES */}
                    {isGym && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="fitness" size={20} color="#fbbf24" />
                                <Text style={styles.sectionTitle}>Subscription Details</Text>
                            </View>

                            <View style={styles.gymCard}>
                                <View style={styles.gymRow}>
                                    <View style={styles.gymIcon}><Ionicons name="time-outline" size={20} color="#4ade80" /></View>
                                    <View>
                                        <Text style={styles.gymLabel}>Duration</Text>
                                        <Text style={styles.gymValue}>{attributes.duration} Days</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.gymRow}>
                                    <View style={styles.gymIcon}><Ionicons name="star-outline" size={20} color="#fbbf24" /></View>
                                    <View>
                                        <Text style={styles.gymLabel}>Access Level</Text>
                                        <Text style={styles.gymValue}>{attributes.accessLevel || 'Standard'}</Text>
                                    </View>
                                </View>
                            </View>

                            {attributes.features && attributes.features.length > 0 && (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.sectionTitle}>Included Features</Text>
                                    <View style={styles.featuresList}>
                                        {attributes.features.map((feature: string, idx: number) => (
                                            <View key={idx} style={styles.featureItem}>
                                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* CLOTHING ATTRIBUTES */}
                    {attributes.type === 'clothing' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Size</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                                {attributes.availableSizes?.map((size: string) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[styles.sizeBtn, selectedSize === size && styles.selectedSizeBtn]}
                                        onPress={() => setSelectedSize(size)}
                                    >
                                        <Text style={[styles.sizeText, selectedSize === size && styles.selectedSizeText]}>{size}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Select Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsRow}>
                                {attributes.availableColors?.map((color: string) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorBtn,
                                            selectedColor === color && styles.selectedColorBtn
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        <View style={[styles.colorCircle, { backgroundColor: color.toLowerCase() }]} />
                                        <Text style={[styles.colorText, selectedColor === color && { color: '#fbbf24', fontWeight: 'bold' }]}>
                                            {color}
                                        </Text>
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark-circle" size={16} color="#fbbf24" style={{ marginLeft: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* PERFUME ATTRIBUTES */}
                    {attributes.type === 'perfume' && (
                        <View style={styles.section}>
                            <View style={styles.grid2}>
                                <View style={styles.infoBox}>
                                    <Text style={styles.label}>Family</Text>
                                    <Text style={styles.value}>{attributes.family}</Text>
                                </View>
                                <View style={styles.infoBox}>
                                    <Text style={styles.label}>Concentration</Text>
                                    <Text style={styles.value}>{attributes.concentration}</Text>
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Olfactory Pyramid</Text>
                            <View style={styles.pyramidContainer}>
                                <View style={styles.pyramidRow}>
                                    <Text style={styles.noteLabel}>🍊 Top</Text>
                                    <Text style={styles.noteValue}>{attributes.topNotes?.join(', ')}</Text>
                                </View>
                                <View style={styles.pyramidRow}>
                                    <Text style={styles.noteLabel}>🌸 Heart</Text>
                                    <Text style={styles.noteValue}>{attributes.heartNotes?.join(', ')}</Text>
                                </View>
                                <View style={styles.pyramidRow}>
                                    <Text style={styles.noteLabel}>🪵 Base</Text>
                                    <Text style={styles.noteValue}>{attributes.baseNotes?.join(', ')}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* EQUIPMENT ATTRIBUTES */}
                    {attributes.type === 'equipment' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Specifications</Text>
                            <View style={styles.specsTable}>
                                <View style={styles.specRow}><Text style={styles.specLabel}>Brand</Text><Text style={styles.specValue}>{attributes.brand}</Text></View>
                                <View style={styles.specRow}><Text style={styles.specLabel}>Material</Text><Text style={styles.specValue}>{attributes.material}</Text></View>
                                <View style={styles.specRow}><Text style={styles.specLabel}>Weight</Text><Text style={styles.specValue}>{attributes.weight} kg</Text></View>
                                <View style={styles.specRow}><Text style={styles.specLabel}>Dimensions</Text><Text style={styles.specValue}>{attributes.dimensions?.length}x{attributes.dimensions?.width}x{attributes.dimensions?.height} cm</Text></View>
                                <View style={[styles.specRow, { borderBottomWidth: 0 }]}><Text style={styles.specLabel}>Warranty</Text><Text style={[styles.specValue, { color: '#4ade80' }]}>{attributes.warranty}</Text></View>
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.addToCartBtn, isGym && styles.subscribeBtn]}
                    onPress={handleAddToCart}
                >
                    <Ionicons name={isGym ? "card-outline" : "cart-outline"} size={22} color="white" style={{ marginRight: 8 }} />
                    <Text style={[styles.addToCartText, isGym && { color: '#000' }]}>
                        {isGym ? 'Subscribe Now' : 'Add to Cart'} • {product.salePrice || product.price} DA
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    imageContainer: { width: '100%', height: 350, position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
    backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 12 },
    indicators: { flexDirection: 'row', position: 'absolute', bottom: 20, left: 0, right: 0, justifyContent: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { backgroundColor: 'white', width: 20 },

    content: { padding: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    name: { fontSize: 24, fontWeight: 'bold', color: 'white', flex: 1, marginRight: 10 },
    price: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24' },
    originalPrice: { fontSize: 16, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 16 },
    description: { color: '#cbd5e1', lineHeight: 22, marginBottom: 24, fontSize: 16 },

    section: { backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // Gym Styles
    gymCard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 16 },
    gymRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    gymIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    gymLabel: { color: '#94a3b8', fontSize: 12 },
    gymValue: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    divider: { width: 1, backgroundColor: '#334155', marginHorizontal: 8 },
    featuresList: { marginTop: 8, gap: 8 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: 8, borderRadius: 8 },
    featureText: { color: '#cbd5e1', fontSize: 14 },

    // Clothing Styles
    optionsRow: { marginTop: 8, marginBottom: 8 },
    sizeBtn: { borderWidth: 1, borderColor: '#334155', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginRight: 10, minWidth: 60, alignItems: 'center' },
    selectedSizeBtn: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
    sizeText: { color: '#94a3b8', fontWeight: '600' },
    selectedSizeText: { color: '#000' },
    colorBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 10 },
    selectedColorBtn: { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
    colorCircle: { width: 24, height: 24, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    colorText: { color: 'white' },

    // Perfume Styles
    grid2: { flexDirection: 'row', gap: 12 },
    infoBox: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 12 },
    label: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
    value: { color: 'white', fontWeight: 'bold' },
    pyramidContainer: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, gap: 12 },
    pyramidRow: { flexDirection: 'row', alignItems: 'flex-start' },
    noteLabel: { color: '#94a3b8', width: 70, fontWeight: '600' },
    noteValue: { color: 'white', flex: 1, lineHeight: 20 },

    // Equipment Styles
    specsTable: { backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    specLabel: { color: '#94a3b8' },
    specValue: { color: 'white', fontWeight: '600' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
    addToCartBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    subscribeBtn: { backgroundColor: '#fbbf24' },
    addToCartText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});
