import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import * as Location from 'expo-location';

export default function LocationPermissionScreen({ onRequestPermission, onPermissionGranted }: { onRequestPermission: () => Promise<void>, onPermissionGranted: () => void }) {
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        onPermissionGranted();
      } else {
        Alert.alert('Izin lokasi ditolak', 'Aplikasi ini membutuhkan akses lokasi untuk memvalidasi kehadiran Anda. Silakan izinkan akses lokasi di pengaturan.');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal meminta izin lokasi');
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.box} elevation={3}>
        <Text variant="titleMedium" style={styles.title}>
          Izin Lokasi Diperlukan
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          Untuk memastikan kehadiran Anda valid, aplikasi perlu mengakses lokasi perangkat Anda untuk memverifikasi bahwa Anda berada di area bimbingan.
        </Text>
        <Button mode="contained" onPress={requestLocationPermission} style={styles.button}>
          Izinkan Akses Lokasi
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  box: {
    width: '80%',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 8,
  },
});