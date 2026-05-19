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
  // [K-03 FIX] Token dihapus dari state — autentikasi kini sepenuhnya mengandalkan HttpOnly cookie.
  // Token tidak pernah dapat diakses oleh JavaScript, sehingga aman dari serangan XSS.
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void> | void;
  setLoading: (loading: boolean) => void;
}
