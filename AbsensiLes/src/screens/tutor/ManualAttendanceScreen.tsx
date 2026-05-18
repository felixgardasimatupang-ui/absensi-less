import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, List, Checkbox, Button, Searchbar, Snackbar, TextInput, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';
import { attendanceService } from '../../services/attendanceService';
import type { StudentSummary } from '../../types';

export default function ManualAttendanceScreen() {
  const { logout } = useAuthStore();
  const [classInfo, setClassInfo] = useState('');
  const [search, setSearch] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await attendanceService.getStudents();
        setStudents(data);
      } catch (error) {
        console.error('Failed to fetch students', error);
        setToastMessage('Gagal memuat daftar siswa.');
        setToastVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setPresentIds(newSet);
  };

  const handleSave = async () => {
    if (!classInfo.trim()) {
      setToastMessage('Nama kelas wajib diisi.');
      setToastVisible(true);
      return;
    }

    if (presentIds.size === 0) {
      setToastMessage('Pilih minimal satu siswa.');
      setToastVisible(true);
      return;
    }

    setIsSaving(true);
    try {
      await attendanceService.submitManualAttendance({
        classInfo,
        studentIds: Array.from(presentIds),
        status: 'hadir',
      });
      setClassInfo('');
      setPresentIds(new Set());
      setToastMessage('Data presensi manual berhasil disimpan ke server.');
      setToastVisible(true);
    } catch (error: any) {
      setToastMessage(error.response?.data?.error || error.message || 'Gagal menyimpan presensi manual.');
      setToastVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.header} elevation={2}>
        <TextInput
          label="Nama Kelas"
          value={classInfo}
          onChangeText={setClassInfo}
          mode="outlined"
          style={styles.classInput}
          placeholder="Contoh: Matematika SMA XII"
        />
        <Searchbar
          placeholder="Cari nama siswa..."
          onChangeText={setSearch}
          value={search}
          style={styles.searchbar}
          inputStyle={{ minHeight: 40 }}
        />
      </Surface>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Memuat daftar siswa...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={{ textAlign: 'center', color: '#666' }}>Tidak ada siswa ditemukan.</Text>
            </Surface>
          }
          renderItem={({ item }) => (
            <Surface style={styles.card} elevation={1}>
              <List.Item
                title={item.name}
                description={item.email}
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
      )}

      <Surface style={styles.footer} elevation={5}>
        <Text variant="titleMedium" style={{ flex: 1, fontWeight: 'bold' }}>
          Hadir: {presentIds.size} / {students.length}
        </Text>
        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving || isLoading}>
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
        {toastMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, backgroundColor: 'white', marginBottom: 8 },
  classInput: { marginBottom: 12 },
  searchbar: { backgroundColor: '#f0f0f0', height: 48 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, backgroundColor: 'white', overflow: 'hidden' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
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
