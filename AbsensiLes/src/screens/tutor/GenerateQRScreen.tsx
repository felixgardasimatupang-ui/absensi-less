import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Surface, Button, useTheme, TextInput } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../../services/api';

export default function GenerateQRScreen() {
  const theme = useTheme();
  const [qrValue, setQrValue] = useState('');
  const [classInfo, setClassInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const generateNewSession = async () => {
    if (!classInfo.trim()) {
      Alert.alert('Error', 'Masukkan nama kelas terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/attendance/session', { classInfo });
      const sessionId = response.data.session.id; // UUID dari server
      setQrValue(sessionId); // QR code berisi session ID yang valid di DB
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Gagal membuat sesi.';
      Alert.alert('Gagal', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.header}>
        Buat Sesi Presensi Baru
      </Text>
      <Text variant="bodyMedium" style={styles.date}>
        {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
      </Text>

      <TextInput
        label="Nama Kelas"
        value={classInfo}
        onChangeText={setClassInfo}
        placeholder="Contoh: Matematika SMA XII"
        mode="outlined"
        style={{ width: '100%', marginBottom: 20 }}
      />

      <Surface style={styles.qrContainer} elevation={4}>
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={240}
            color={theme.colors.onSurface}
            backgroundColor="white"
          />
        ) : (
          <Text style={{ textAlign: 'center', color: '#666' }}>Masukkan nama kelas dan tekan Buat QR Code</Text>
        )}
      </Surface>

      <Text variant="bodySmall" style={styles.instruction}>
        Arahkan siswa untuk membuka fitur "Scan QR" pada aplikasi mereka dan memindai kode di atas.
      </Text>

      <Button 
        mode="contained" 
        icon="qrcode-plus" 
        onPress={generateNewSession}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading || !classInfo.trim()}
      >
        Buat QR Code
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontWeight: 'bold',
    marginTop: 16,
  },
  date: {
    color: '#666',
    marginBottom: 40,
  },
  qrContainer: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  instruction: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 6,
    width: '100%',
    borderRadius: 8,
  }
});
