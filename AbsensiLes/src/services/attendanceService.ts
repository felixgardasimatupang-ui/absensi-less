import api from './api';
import type { AttendanceHistoryItem, StudentSummary } from '../types';
import { z } from 'zod';

// Schemas for runtime validation of API responses
const MarkPresentResponseSchema = z.object({});
const HistoryResponseSchema = z.object({
  history: z.array(z.unknown())
});
const StudentsResponseSchema = z.object({
  students: z.array(z.unknown())
});
const ManualAttendanceResponseSchema = z.object({});

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
    return MarkPresentResponseSchema.parse(response.data);
  },
  
  getStudentHistory: async () => {
    const response = await api.get<{ history: AttendanceHistoryItem[] }>('/attendance/history');
    const parsed = HistoryResponseSchema.parse(response.data);
    return parsed.history || [];
  },
  
  getStudents: async () => {
    const response = await api.get<{ students: StudentSummary[] }>('/attendance/students');
    const parsed = StudentsResponseSchema.parse(response.data);
    return parsed.students || [];
  },
  
  submitManualAttendance: async (payload: ManualAttendancePayload) => {
    const response = await api.post('/attendance/manual', {
      classInfo: payload.classInfo,
      studentIds: payload.studentIds,
      status: payload.status || 'hadir',
    });
    return ManualAttendanceResponseSchema.parse(response.data);
  },
};
