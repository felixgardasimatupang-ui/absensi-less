export type Role = 'admin' | 'tutor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void> | void;
  setLoading: (loading: boolean) => void;
}

export interface AttendanceHistoryItem {
  id: string;
  timestamp: string;
  status: 'hadir' | 'izin' | 'alpa';
  session?: {
    classInfo: string;
    timestamp: string;
  };
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export * from './navigation';
