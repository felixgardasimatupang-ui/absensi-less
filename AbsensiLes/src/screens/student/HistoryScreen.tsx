import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Surface, Button, Chip } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const DUMMY_HISTORY = [
  { id: '1', date: new Date().toISOString(), class: 'Matematika - Kelas 10', status: 'hadir' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), class: 'Fisika - Kelas 10', status: 'hadir' },
  { id: '3', date: new Date(Date.now() - 86400000 * 2).toISOString(), class: 'Kimia - Kelas 10', status: 'izin' },
  { id: '4', date: new Date(Date.now() - 86400000 * 3).toISOString(), class: 'Biologi - Kelas 10', status: 'alpa' },
];

export default function HistoryScreen() {
  const { user, logout } = useAuthStore();
  const [data] = useState(DUMMY_HISTORY);

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

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <List.Item
              title={item.class}
              titleStyle={{ fontWeight: 'bold' }}
              description={format(new Date(item.date), 'EEEE, dd MMMM yyyy HH:mm', { locale: id })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
});
