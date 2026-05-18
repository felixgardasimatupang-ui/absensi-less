export type Role = 'admin' | 'tutor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Session {
  id: string;
  tutorId: string;
  classInfo: string;
  timestamp: string;
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'hadir' | 'izin' | 'alpa';
  lat?: number;
  lng?: number;
  timestamp: string;
  session?: {
    classInfo: string;
    timestamp: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}
