import api from './api';

export interface AttendanceRecord {
  id?: string;
  sessionId: string;
  studentId: string;
  timestamp: string;
  location?: { lat: number; lng: number };
}

export const attendanceService = {
  markPresent: async (data: AttendanceRecord) => {
    try {
      // API call sesungguhnya: return await api.post('/attendance', data);
      
      console.log('[Mock API] Mengirim data presensi ke server:', data);
      
      // Simulasi delay jaringan
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, data }; 
    } catch (error) {
      throw error;
    }
  },
  
  getStudentHistory: async (studentId: string) => {
    try {
      // return await api.get(`/attendance/student/${studentId}`);
      return []; 
    } catch (error) {
      throw error;
    }
  },
};
