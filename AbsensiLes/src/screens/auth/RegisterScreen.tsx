import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types/navigation';
import api from '../../services/api';

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Semua kolom wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, role });
      Alert.alert('Registrasi Berhasil', 'Akun Anda berhasil didaftarkan. Silakan masuk.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat mendaftar.';
      Alert.alert('Registrasi Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.surface} elevation={2}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
            Daftar Akun Baru
          </Text>
          
          <TextInput
            label="Nama Lengkap"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

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

          <Text variant="bodySmall" style={styles.label}>Pilih Peran:</Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={[
              { value: 'student', label: 'Siswa' },
              { value: 'tutor', label: 'Tutor' },
            ]}
            style={styles.segmented}
          />

          <Button 
            mode="contained" 
            onPress={handleRegister} 
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Daftar
          </Button>
          
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Login')}
          >
            Sudah punya akun? Masuk
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  segmented: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 6,
    marginBottom: 16,
    borderRadius: 8,
  },
});
