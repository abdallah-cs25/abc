import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { View, ActivityIndicator } from 'react-native';
import './src/i18n'; // Initialize i18n

// Screens
import LoginScreen from './src/screens/LoginScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import StoreScreen from './src/screens/StoreScreen';
import CartScreen from './src/screens/CartScreen';
import ExploreMapScreen from './src/screens/ExploreMapScreen';
import LoyaltyScreen from './src/screens/LoyaltyScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'DRIVER' ? (
          <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
        ) : (
          <>
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
            <Stack.Screen name="ExploreMap" component={ExploreMapScreen} />
            <Stack.Screen name="Store" component={StoreScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigation />
      </CartProvider>
    </AuthProvider>
  );
}
