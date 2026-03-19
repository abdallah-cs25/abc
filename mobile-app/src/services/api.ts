import * as SecureStore from 'expo-secure-store';

// Use IO 10.0.2.2 for Android Emulator, or your local IP for physical device
// Replace with your machine's local IP if testing on real phone (e.g., http://192.168.1.15:3000)
export const API_URL = 'http://192.168.1.2:3000/api';

export const getHeaders = async () => {
    const token = await SecureStore.getItemAsync('token');
    return {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
    };
};
