import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { attendanceService } from '../../services/attendanceService';
import { getCurrentVerifiedLocation } from '../../utils/locationHelper';

export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Aplikasi ini membutuhkan izin untuk menggunakan kamera agar bisa memindai QR Code.</Text>
        <Button mode="contained" onPress={requestPermission} style={styles.btn}>
          Berikan Akses Kamera
        </Button>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setLoading(true);

    try {
      const coords = await getCurrentVerifiedLocation().catch(() => null);
      await attendanceService.markPresent({
        sessionId: data,
        status: 'hadir',
        lat: coords?.latitude,
        lng: coords?.longitude,
      });

      Alert.alert(
        'Presensi Berhasil',
        'Data presensi Anda berhasil dicatat ke server.',
        [{ text: 'Scan Lagi', onPress: () => setScanned(false) }]
      );
    } catch (error: any) {
      Alert.alert(
        'Presensi Gagal',
        error.response?.data?.error || error.message || 'Gagal mengirim presensi ke server.',
        [{ text: 'Coba Lagi', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      {/* Overlay Gelap Untuk Efek Jendela Scanner */}
      <View style={styles.overlay}>
        <Surface style={styles.headerBox} elevation={3}>
          <Text variant="titleMedium" style={styles.headerText}>
            Arahkan kamera ke QR Code
          </Text>
        </Surface>
        
        {/* Kotak Transparan (Viewfinder) */}
        <View style={styles.scanArea} />

        {loading && (
          <Surface style={styles.loadingBox} elevation={4}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Memproses Presensi...</Text>
          </Surface>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  text: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  btn: {
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBox: {
    position: 'absolute',
    top: 80,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  headerText: {
    fontWeight: 'bold',
  },
  scanArea: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  loadingBox: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  loadingText: {
    marginLeft: 12,
    fontWeight: 'bold',
  }
});
