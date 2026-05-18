import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, List, Checkbox, Button, Searchbar, Snackbar } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';

const DUMMY_STUDENTS = [
  { id: 'S1', name: 'Budi Santoso' },
  { id: 'S2', name: 'Siti Aminah' },
  { id: 'S3', name: 'Agus Wijaya' },
  { id: 'S4', name: 'Rina Melati' },
  { id: 'S5', name: 'Rangga Pratama' },
];

export default function ManualAttendanceScreen() {
  const { logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);

  const filteredStudents = DUMMY_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setPresentIds(newSet);
  };

  const handleSave = () => {
    setToastVisible(true);
    // Simpan ke API ditaruh di sini
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.header} elevation={2}>
        <Searchbar
          placeholder="Cari nama siswa..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchbar}
          inputStyle={{ minHeight: 40 }}
        />
      </Surface>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <List.Item
              title={item.name}
              titleStyle={{ fontWeight: 'bold' }}
              left={props => <List.Icon {...props} icon="account-circle-outline" />}
              right={() => (
                <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                  <Checkbox
                    status={presentIds.has(item.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleAttendance(item.id)}
                    color="#1976D2"
                  />
                </View>
              )}
              onPress={() => toggleAttendance(item.id)}
            />
          </Surface>
        )}
      />

      <Surface style={styles.footer} elevation={5}>
        <Text variant="titleMedium" style={{ flex: 1, fontWeight: 'bold' }}>
          Hadir: {presentIds.size} / {DUMMY_STUDENTS.length}
        </Text>
        <Button mode="contained" onPress={handleSave}>
          Simpan Data
        </Button>
      </Surface>

      <Button mode="text" textColor="#d32f2f" onPress={logout} style={styles.logoutBtn}>
        Keluar Akun (Tutor)
      </Button>

      <Snackbar
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        duration={2000}
      >
        Data presensi manual berhasil disimpan!
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, backgroundColor: 'white', marginBottom: 8 },
  searchbar: { backgroundColor: '#f0f0f0', height: 48 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, backgroundColor: 'white', overflow: 'hidden' },
  footer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  logoutBtn: {
    marginVertical: 8,
  }
});
