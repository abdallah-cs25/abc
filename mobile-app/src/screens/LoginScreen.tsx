import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (data.success) {
                await login(data.data.token, data.data.user);
            } else {
                Alert.alert('خطأ', data.messageAr || 'فشل تسجيل الدخول');
            }
        } catch (error) {
            Alert.alert('خطأ', 'تعذر الاتصال بالخادم. تأكد من أن السيرفر يعمل.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role: string) => {
        if (role === 'ADMIN') { setEmail('admin@myworld.dz'); setPassword('admin123'); }
        if (role === 'SELLER') { setEmail('seller@myworld.dz'); setPassword('seller123'); }
        if (role === 'DRIVER') { setEmail('driver@myworld.dz'); setPassword('driver123'); }
        if (role === 'CUSTOMER') { setEmail('customer@myworld.dz'); setPassword('customer123'); }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>MW</Text>
                <Text style={styles.title}>My World</Text>
                <Text style={styles.subtitle}>مرحباً بك في عالمك</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <TextInput
                    style={styles.input}
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>كلمة المرور</Text>
                <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>تسجيل الدخول</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>حسابات تجريبية:</Text>
                <View style={styles.demoButtons}>
                    <TouchableOpacity onPress={() => fillDemo('CUSTOMER')} style={[styles.demoBtn, { backgroundColor: '#64748b' }]}>
                        <Text style={styles.demoBtnText}>زبون</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fillDemo('DRIVER')} style={[styles.demoBtn, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.demoBtnText}>سائق</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fillDemo('SELLER')} style={[styles.demoBtn, { backgroundColor: '#f59e0b' }]}>
                        <Text style={styles.demoBtnText}>بائع</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    form: {
        marginBottom: 24,
    },
    label: {
        color: '#cbd5e1',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    demoSection: {
        marginTop: 24,
    },
    demoTitle: {
        color: '#64748b',
        marginBottom: 12,
        textAlign: 'center',
    },
    demoButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    demoBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    demoBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
