import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { MainTabsParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';

// Admin Screens
import DashboardScreen from '../screens/admin/DashboardScreen';

// Tutor Screens
import GenerateQRScreen from '../screens/tutor/GenerateQRScreen';
import ManualAttendanceScreen from '../screens/tutor/ManualAttendanceScreen';

// Student Screens
import ScanQRScreen from '../screens/student/ScanQRScreen';
import HistoryScreen from '../screens/student/HistoryScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  const user = useAuthStore((state) => state.user);
  
  if (!user) return null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GenerateQR') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Manual') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ScanQR') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {user.role === 'admin' && (
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: 'Beranda' }}
        />
      )}
      
      {user.role === 'tutor' && (
        <>
          <Tab.Screen 
            name="GenerateQR" 
            component={GenerateQRScreen} 
            options={{ title: 'Buat QR' }} 
          />
          <Tab.Screen 
            name="Manual" 
            component={ManualAttendanceScreen} 
            options={{ title: 'Absen Manual' }} 
          />
        </>
      )}
      
      {user.role === 'student' && (
        <>
          <Tab.Screen 
            name="ScanQR" 
            component={ScanQRScreen} 
            options={{ title: 'Scan QR' }} 
          />
          <Tab.Screen 
            name="History" 
            component={HistoryScreen} 
            options={{ title: 'Riwayat' }} 
          />
        </>
      )}
    </Tab.Navigator>
  );
}
