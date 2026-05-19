import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isCheckingSession) {
    return (
      <NavigationContainer>
        {/* Show a loading screen while checking session */}
        <AuthStack /> {/* Or a dedicated loading component, but for simplicity we show AuthStack */}
      </NavigationContainer>
    );
  }

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
