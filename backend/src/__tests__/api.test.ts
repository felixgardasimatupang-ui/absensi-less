import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../server';
import { prisma } from '../lib/prisma';

const api = request(app);

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

  it('berhasil login untuk akun tutor valid', async () => {
    const response = await api.post('/api/auth/login').send({
      email: 'tutor-test@absensiles.local',
      password: 'Tutor1234!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('tutor');
    expect(typeof response.body.token).toBe('string');
  });

  it('logout mencabut token aktif', async () => {
    const loginResponse = await api.post('/api/auth/login').send({
      email: 'student-test@absensiles.local',
      password: 'Student1234!',
    });

    const token = loginResponse.body.token as string;

    const logoutResponse = await api
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutResponse.status).toBe(200);

    const historyResponse = await api
      .get('/api/attendance/history')
      .set('Authorization', `Bearer ${token}`);

    expect(historyResponse.status).toBe(401);
  });
});

describe('Attendance Routes', () => {
  it('menolak tutor submit attendance mandiri', async () => {
    const tutorLogin = await api.post('/api/auth/login').send({
      email: 'tutor-test@absensiles.local',
      password: 'Tutor1234!',
    });

    const response = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${tutorLogin.body.token}`)
      .send({ sessionId: 'random-session-id', status: 'hadir' });

    expect(response.status).toBe(403);
  });

  it('mengizinkan tutor membuat session dan student mengisi attendance lalu muncul di history', async () => {
    const tutorLogin = await api.post('/api/auth/login').send({
      email: 'tutor-test@absensiles.local',
      password: 'Tutor1234!',
    });
    const studentLogin = await api.post('/api/auth/login').send({
      email: 'student-test@absensiles.local',
      password: 'Student1234!',
    });

    const createSessionResponse = await api
      .post('/api/attendance/session')
      .set('Authorization', `Bearer ${tutorLogin.body.token}`)
      .send({ classInfo: `Kelas Test ${Date.now()}` });

    expect(createSessionResponse.status).toBe(201);

    const sessionId = createSessionResponse.body.session.id as string;

    const submitAttendanceResponse = await api
      .post('/api/attendance')
      .set('Authorization', `Bearer ${studentLogin.body.token}`)
      .send({
        sessionId,
        status: 'hadir',
        lat: -6.2,
        lng: 106.8,
      });

    expect(submitAttendanceResponse.status).toBe(201);

    const historyResponse = await api
      .get('/api/attendance/history')
      .set('Authorization', `Bearer ${studentLogin.body.token}`);

    expect(historyResponse.status).toBe(200);
    expect(
      historyResponse.body.history.some((item: { sessionId: string }) => item.sessionId === sessionId),
    ).toBe(true);
  });
});

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
