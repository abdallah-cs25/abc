import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

const resources = {
    en: {
        translation: {
            welcome: 'Welcome',
            login: 'Login',
            logout: 'Logout',
            stores: 'Stores',
            myOrders: 'My Orders',
            profile: 'Profile',
            nearby: 'Nearby',
            search: 'Search...',
            viewStore: 'View Store',
            settings: 'Settings',
            language: 'Language',
            selectLanguage: 'Select Language',
            // Cart & Orders
            cart: 'Cart',
            addToCart: 'Add to Cart',
            total: 'Total',
            deliveryFee: 'Delivery Fee',
            confirmOrder: 'Confirm Order',
            orderPlaced: 'Order Placed!',
            trackOrder: 'Track Order',
            orderHistory: 'Order History',
            // Status
            pending: 'Pending',
            confirmed: 'Confirmed',
            preparing: 'Preparing',
            ready: 'Ready',
            inTransit: 'In Transit',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            // Products
            products: 'Products',
            price: 'Price',
            quantity: 'Quantity',
            outOfStock: 'Out of Stock',
            // Loyalty
            loyaltyPoints: 'Loyalty Points',
            yourPoints: 'Your Points',
            redeemPoints: 'Redeem Points',
        },
    },
    ar: {
        translation: {
            welcome: 'مرحباً',
            login: 'تسجيل الدخول',
            logout: 'خروج',
            stores: 'المتاجر',
            myOrders: 'طلباتي',
            profile: 'حسابي',
            nearby: 'قريب منك',
            search: 'بحث...',
            viewStore: 'زيارة المتجر',
            settings: 'الإعدادات',
            language: 'اللغة',
            selectLanguage: 'اختر اللغة',
            // Cart & Orders
            cart: 'السلة',
            addToCart: 'أضف للسلة',
            total: 'المجموع',
            deliveryFee: 'رسوم التوصيل',
            confirmOrder: 'تأكيد الطلب',
            orderPlaced: 'تم الطلب!',
            trackOrder: 'تتبع الطلب',
            orderHistory: 'سجل الطلبات',
            // Status
            pending: 'قيد الانتظار',
            confirmed: 'تم التأكيد',
            preparing: 'قيد التحضير',
            ready: 'جاهز',
            inTransit: 'في الطريق',
            delivered: 'تم التسليم',
            cancelled: 'ملغي',
            // Products
            products: 'المنتجات',
            price: 'السعر',
            quantity: 'الكمية',
            outOfStock: 'نفذت الكمية',
            // Loyalty
            loyaltyPoints: 'نقاط الولاء',
            yourPoints: 'نقاطك',
            redeemPoints: 'استبدال النقاط',
        },
    },
    fr: {
        translation: {
            welcome: 'Bienvenue',
            login: 'Connexion',
            logout: 'Déconnexion',
            stores: 'Magasins',
            myOrders: 'Mes Commandes',
            profile: 'Profil',
            nearby: 'À proximité',
            search: 'Rechercher...',
            viewStore: 'Voir le magasin',
            settings: 'Paramètres',
            language: 'Langue',
            selectLanguage: 'Changer la langue',
            // Cart & Orders
            cart: 'Panier',
            addToCart: 'Ajouter au panier',
            total: 'Total',
            deliveryFee: 'Frais de livraison',
            confirmOrder: 'Confirmer la commande',
            orderPlaced: 'Commande passée!',
            trackOrder: 'Suivre la commande',
            orderHistory: 'Historique des commandes',
            // Status
            pending: 'En attente',
            confirmed: 'Confirmé',
            preparing: 'En préparation',
            ready: 'Prêt',
            inTransit: 'En route',
            delivered: 'Livré',
            cancelled: 'Annulé',
            // Products
            products: 'Produits',
            price: 'Prix',
            quantity: 'Quantité',
            outOfStock: 'Rupture de stock',
            // Loyalty
            loyaltyPoints: 'Points de fidélité',
            yourPoints: 'Vos points',
            redeemPoints: 'Échanger les points',
        },
    },
};

const LANGUAGE_KEY = 'user-language';

const getLanguage = async () => {
    try {
        const language = await AsyncStorage.getItem(LANGUAGE_KEY);
        return language || 'ar'; // Default to Arabic
    } catch (error) {
        return 'ar';
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'ar', // Default initial language, will be updated async
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false,
        },
    });

// Async language loader
getLanguage().then(lang => {
    i18n.changeLanguage(lang);
    // Handle RTL layout if needed
    const isRtl = lang === 'ar';
    if (I18nManager.isRTL !== isRtl) {
        I18nManager.allowRTL(isRtl);
        I18nManager.forceRTL(isRtl);
    }
});

export default i18n;
