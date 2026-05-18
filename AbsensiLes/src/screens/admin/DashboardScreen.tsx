import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Card, Avatar, Button } from 'react-native-paper';
import { useAuthStore } from '../../store/useAuthStore';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Avatar.Icon size={64} icon="shield-account" style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.title}>Selamat Datang, {user?.name}</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Administrator Dashboard</Text>
      </Surface>

      <View style={styles.grid}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={{ color: '#1976D2' }}>124</Text>
            <Text variant="labelLarge" style={styles.cardLabel}>Total Siswa</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={{ color: '#1976D2' }}>18</Text>
            <Text variant="labelLarge" style={styles.cardLabel}>Total Tutor</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { width: '100%' }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={{ color: '#4CAF50' }}>85%</Text>
            <Text variant="labelLarge" style={styles.cardLabel}>Rata-rata Kehadiran Minggu Ini</Text>
          </Card.Content>
        </Card>
      </View>
      
      <Button mode="outlined" icon="logout" onPress={logout} textColor="#d32f2f" style={styles.logoutBtn}>
        Keluar Akun
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#1976D2',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: 'white',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardLabel: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  logoutBtn: {
    margin: 24,
    borderColor: '#d32f2f',
  }
});
