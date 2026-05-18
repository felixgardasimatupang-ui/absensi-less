import * as Location from 'expo-location';

/**
 * Menghitung jarak antara 2 titik koordinat (dalam meter) menggunakan Haversine Formula.
 * Sangat berguna untuk memastikan siswa berada di lokasi bimbingan saat absen.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Hasil dalam satuan meter
}

/**
 * Mengambil lokasi terkini dengan verifikasi anti "Mock Location" (Aplikasi GPS Palsu/Tuyul)
 */
export async function getCurrentVerifiedLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Akses lokasi ditolak. Aktifkan di pengaturan.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High
  });
  
  // Deteksi Fake GPS (Mock Location) pada Android/iOS untuk mencegah kecurangan
  if (location.mocked) {
    throw new Error('Terdeteksi penggunaan lokasi palsu (Fake GPS). Harap matikan aplikasi GPS buatan.');
  }

  return location.coords;
}
