import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Dashboard: undefined;
  GenerateQR: undefined;
  Manual: undefined;
  ScanQR: undefined;
  History: undefined;
};

// Root parameter list jika menggunakan multiple stacks
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabsParamList>;
};
