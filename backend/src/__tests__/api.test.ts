/**
 * Absensi Les — Backend API Test Suite
 *
 * Update: Disesuaikan dengan perubahan K-03 (cookie-only auth):
 * - /api/auth/login (web) → TIDAK mengembalikan token di body
 * - /api/auth/login-mobile → mengembalikan token di body untuk mobile/test
 * - Semua test yang butuh Bearer token sekarang menggunakan /login-mobile
 *
 * Update: Tambah test S-04 (admin/stats endpoint)
 */

import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../server';
import { prisma } from '../lib/prisma';

const api = request(app);

// ===================================================================
// SETUP — Buat semua user test sebelum test berjalan
// ===================================================================
beforeAll(async () => {
  await upsertUser({
    name: 'Admin Test',
    email: 'admin-test@absensiles.local',
    password: 'Admin1234!',
    role: 'admin',
  });

  await upsertUser({
    name: 'Tutor Test',
    email: 'tutor-test@absensiles.local',
    password: 'Tutor1234!',
    role: 'tutor',
  });

  await upsertUser({
    name: 'Student Test',
    email: 'student-test@absensiles.local',
    password: 'Student1234!',
    role: 'student',
  });
});

// ===================================================================
// AUTH ROUTES
// ===================================================================
describe('Auth Routes', () => {
  it('menolak registrasi role admin dari endpoint publik', async () => {
    const response = await api.post('/api/auth/register').send({
      name: 'Hacker',
      email: `hacker-${Date.now()}@absensiles.local`,
      password: 'Password123!',
      role: 'admin',
    });

    expect(response.status).toBe(400);
  });

  // [K-03] Web login: TIDAK mengembalikan token di body (cookie-only)
  it('[K-03] web login tidak mengembalikan token di body response', async () => {
    const response = await api.post('/api/auth/login').send({
      email: 'tutor-test@absensiles.local',
      password: 'Tutor1234!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('tutor');
    // Token TIDAK boleh ada di body — keamanan XSS
    expect(response.body.token).toBeUndefined();
    // Cookie harus di-set oleh backend (set-cookie bisa string atau array)
    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    expect(cookieStr).toContain('token=');
  });

  // [K-03] Mobile login: MENGEMBALIKAN token di body untuk Expo SecureStore
  it('[K-03] mobile login mengembalikan token di body untuk Expo SecureStore', async () => {
    const response = await api.post('/api/auth/login-mobile').send({
      email: 'tutor-test@absensiles.local',
      password: 'Tutor1234!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('tutor');
    expect(typeof response.body.token).toBe('string'); // Token ada di body
  });

  it('menolak login dengan password salah', async () => {
    const response = await api.post('/api/auth/login').send({
      email: 'tutor-test@absensiles.local',
      password: 'SalahPassword!',
    });

    expect(response.status).toBe(400);
  });

  // [K-07] Logout invalidasi tokenVersion → token lama ditolak
  it('[K-07] logout mencabut token aktif via tokenVersion increment', async () => {
    // Gunakan login-mobile untuk dapat token Bearer
    const loginResponse = await api.post('/api/auth/login-mobile').send({
      email: 'student-test@absensiles.local',
      password: 'Student1234!',
    });

    const token = loginResponse.body.token as string;
    expect(token).toBeTruthy();

    // Logout menggunakan Bearer token
    const logoutResponse = await api
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutResponse.status).toBe(200);

    // Token lama sekarang harus DITOLAK (tokenVersion mismatch)
    const historyResponse = await api
      .get('/api/attendance/history')
      .set('Authorization', `Bearer ${token}`);

    expect(historyResponse.status).toBe(401);
  });
});

// ===================================================================
// ATTENDANCE ROUTES
// ===================================================================
describe('Attendance Routes', () => {
  // Helper: dapatkan Bearer token via login-mobile
  const getMobileToken = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login-mobile').send({ email, password });
    return res.body.token as string;
  };

  it('[K-08] menolak tutor submit attendance mandiri via QR', async () => {
    const token = await getMobileToken('tutor-test@absensiles.local', 'Tutor1234!');

    const response = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: 'random-session-id', status: 'hadir' });

    expect(response.status).toBe(403);
  });

  it('flow lengkap: tutor buat session → student submit → muncul di history', async () => {
    const tutorToken   = await getMobileToken('tutor-test@absensiles.local', 'Tutor1234!');
    const studentToken = await getMobileToken('student-test@absensiles.local', 'Student1234!');

    // Step 1: Tutor buat sesi QR
    const createSessionResponse = await api
      .post('/api/attendance/session')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ classInfo: `Kelas Test ${Date.now()}` });

    expect(createSessionResponse.status).toBe(201);
    const sessionId = createSessionResponse.body.session.id as string;

    // Step 2: Student submit absensi
    const submitAttendanceResponse = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sessionId, status: 'hadir', lat: -6.2, lng: 106.8 });

    expect(submitAttendanceResponse.status).toBe(201);

    // Step 3: Cek muncul di riwayat history student
    const historyResponse = await api
      .get('/api/attendance/history')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(historyResponse.status).toBe(200);
    expect(
      historyResponse.body.history.some(
        (item: { sessionId: string }) => item.sessionId === sessionId,
      ),
    ).toBe(true);
  });

  it('mencegah double submit pada sesi yang sama', async () => {
    const tutorToken   = await getMobileToken('tutor-test@absensiles.local', 'Tutor1234!');
    const studentToken = await getMobileToken('student-test@absensiles.local', 'Student1234!');

    // Buat sesi baru
    const sessionRes = await api
      .post('/api/attendance/session')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ classInfo: `Kelas Double Test ${Date.now()}` });
    const sessionId = sessionRes.body.session.id;

    // Submit pertama — harus berhasil
    const first = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sessionId, status: 'hadir' });
    expect(first.status).toBe(201);

    // Submit kedua — harus ditolak (duplicate)
    const second = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sessionId, status: 'hadir' });
    expect(second.status).toBe(400);
  });
});

// ===================================================================
// [S-04] ADMIN STATS ENDPOINT
// ===================================================================
describe('Admin Stats Route', () => {
  const getMobileToken = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login-mobile').send({ email, password });
    return res.body.token as string;
  };

  it('[S-04] admin bisa mengambil statistik dashboard', async () => {
    const adminToken = await getMobileToken('admin-test@absensiles.local', 'Admin1234!');

    const response = await api
      .get('/api/auth/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body.totalStudents).toBe('number');
    expect(typeof response.body.totalTutors).toBe('number');
    expect(typeof response.body.attendanceRate).toBe('number');
    expect(response.body.attendanceRate).toBeGreaterThanOrEqual(0);
    expect(response.body.attendanceRate).toBeLessThanOrEqual(100);
  });

  it('[S-04] non-admin tidak bisa mengakses statistik', async () => {
    const tutorToken = await getMobileToken('tutor-test@absensiles.local', 'Tutor1234!');

    const response = await api
      .get('/api/auth/admin/stats')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(response.status).toBe(403);
  });

  it('[S-04] request tanpa token ditolak ke endpoint stats', async () => {
    const response = await api.get('/api/auth/admin/stats');
    expect(response.status).toBe(401);
  });
});

// ===================================================================
// HELPER: Upsert user untuk keperluan test
// ===================================================================
async function upsertUser(user: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'tutor' | 'student';
}) {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      password: hashedPassword,
      role: user.role,
      tokenVersion: 0,
    },
    create: {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    },
  });
}
