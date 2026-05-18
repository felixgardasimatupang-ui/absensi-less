import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);

  return (
    <NavigationContainer>
      {/* 
        Jika user sudah login, tampilkan MainTabs (Tab utama).
        Jika belum, arahkan ke AuthStack (Login / Register).
      */}
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
