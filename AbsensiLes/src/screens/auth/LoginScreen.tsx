import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types/navigation';
import { z } from 'zod';

// Schema for runtime validation of login response
const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['tutor', 'student', 'admin'])
  }),
  token: z.string()
});

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  
  const login = useAuthStore(state => state.login);
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password tidak boleh kosong.');
      return;
    }
    
    setLoading(true);
     try {
       const response = await api.post('/auth/login', { email, password });
       const { user, token } = LoginResponseSchema.parse(response.data);
       
       login(user, token);
     } catch (error: any) {
       if (error instanceof z.ZodError) {
         // Handle validation error
         console.error('Login response validation error:', error.errors);
         Alert.alert('Masuk Gagal', 'Format respons dari server tidak valid.');
       } else {
         const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat masuk.';
         Alert.alert('Masuk Gagal', errorMsg);
       }
     } finally {
       setLoading(false);
     }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Surface style={styles.surface} elevation={2}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Absensi Les
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Silakan masuk ke akun Anda
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />

        <Button 
          mode="contained" 
          onPress={handleLogin} 
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Masuk
        </Button>
        
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Register')}
        >
          Belum punya akun? Daftar di sini
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    marginBottom: 16,
    borderRadius: 8,
  },
});
