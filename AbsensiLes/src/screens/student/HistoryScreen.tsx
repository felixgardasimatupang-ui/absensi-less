import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Surface, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { attendanceService } from '../../services/attendanceService';
import type { AttendanceHistoryItem } from '../../types';

export default function HistoryScreen() {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<AttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await attendanceService.getStudentHistory();
        setData(history);
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return '#4CAF50'; // Hijau
      case 'izin': return '#FF9800';  // Orange
      case 'alpa': return '#F44336';  // Merah
      default: return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{user?.name}</Text>
          <Text variant="bodySmall" style={{ color: '#666' }}>Siswa - {user?.email}</Text>
        </View>
        <Button mode="text" onPress={logout} textColor="#d32f2f" compact>
          Keluar
        </Button>
      </Surface>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Memuat riwayat presensi...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={{ textAlign: 'center', color: '#666' }}>
                Belum ada riwayat presensi yang tercatat.
              </Text>
            </Surface>
          }
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <List.Item
                title={item.session?.classInfo || 'Sesi Kelas'}
                titleStyle={{ fontWeight: 'bold' }}
                description={format(new Date(item.timestamp), 'EEEE, dd MMMM yyyy HH:mm', { locale: id })}
                left={props => <List.Icon {...props} icon="book-education" />}
                right={() => (
                  <View style={{ justifyContent: 'center' }}>
                    <Chip 
                      textStyle={{ color: 'white', fontSize: 12 }} 
                      style={{ backgroundColor: getStatusColor(item.status), height: 28 }}
                    >
                      {item.status.toUpperCase()}
                    </Chip>
                  </View>
                )}
              />
            </Surface>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, backgroundColor: 'white', overflow: 'hidden' },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
});
