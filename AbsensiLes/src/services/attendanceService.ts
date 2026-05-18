import api from './api';
import type { AttendanceHistoryItem, StudentSummary } from '../types';

export interface AttendanceRecord {
  sessionId: string;
  status?: 'hadir' | 'izin' | 'alpa';
  lat?: number;
  lng?: number;
}

export interface ManualAttendancePayload {
  classInfo: string;
  studentIds: string[];
  status?: 'hadir' | 'izin' | 'alpa';
}

export const attendanceService = {
  markPresent: async (data: AttendanceRecord) => {
    const response = await api.post('/attendance', {
      sessionId: data.sessionId,
      status: data.status || 'hadir',
      lat: data.lat,
      lng: data.lng,
    });
    return response.data;
  },
  
  getStudentHistory: async () => {
    const response = await api.get<{ history: AttendanceHistoryItem[] }>('/attendance/history');
    return response.data.history || [];
  },

  getStudents: async () => {
    const response = await api.get<{ students: StudentSummary[] }>('/attendance/students');
    return response.data.students || [];
  },

  submitManualAttendance: async (payload: ManualAttendancePayload) => {
    const response = await api.post('/attendance/manual', {
      classInfo: payload.classInfo,
      studentIds: payload.studentIds,
      status: payload.status || 'hadir',
    });
    return response.data;
  },
};
