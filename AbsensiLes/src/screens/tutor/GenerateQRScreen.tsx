import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function GenerateQRScreen() {
  const theme = useTheme();
  const [qrValue, setQrValue] = useState('');
  
  const generateNewSession = () => {
    const sessionData = {
      sessionId: `SESS_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      classInfo: 'Kelas Reguler'
    };
    setQrValue(JSON.stringify(sessionData));
  };

  useEffect(() => {
    generateNewSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.header}>
        Kode Presensi Sesi Ini
      </Text>
      <Text variant="bodyMedium" style={styles.date}>
        {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
      </Text>

      <Surface style={styles.qrContainer} elevation={4}>
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={240}
            color={theme.colors.onSurface}
            backgroundColor="white"
          />
        ) : (
          <Text>Memuat QR Code...</Text>
        )}
      </Surface>

      <Text variant="bodySmall" style={styles.instruction}>
        Arahkan siswa untuk membuka fitur "Scan QR" pada aplikasi mereka dan memindai kode di atas.
      </Text>

      <Button 
        mode="contained" 
        icon="refresh" 
        onPress={generateNewSession}
        style={styles.button}
      >
        Perbarui QR Code
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
