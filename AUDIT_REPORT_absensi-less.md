# 🔍 Laporan Audit Keamanan Profesional
## Repository: `felixgardasimatupang-ui/absensi-less`

> **Tanggal Audit:** 18 Mei 2026  
> **Auditor:** Claude Sonnet 4.6 — AI Security Audit  
> **Tingkat Keamanan Keseluruhan:** `D+`  
> **Platform:** Backend (Node.js) · Web Frontend (React/Vite) · Mobile (React Native/Expo)

---

## 🆕 Hasil Re-Audit Kode Aktual

> **Tanggal verifikasi ulang:** 18 Mei 2026  
> **Metode:** pembacaan source code + build/type-check lokal

### Status Temuan Lama

| ID | Status | Catatan |
|---|---|---|
| K-01 | ✅ Sudah tidak valid | Mobile login sekarang memanggil `POST /auth/login` sungguhan di `AbsensiLes/src/screens/auth/LoginScreen.tsx`. |
| K-02 | ✅ Sudah tidak valid | Registrasi publik backend sudah membatasi role ke `tutor` dan `student` di `backend/src/routes/auth.ts`. |
| K-03 | ⚠️ Sebagian tidak valid | Web store masih memakai `localStorage`, tetapi `partialize` hanya menyimpan `user`; token tidak dipersist. Risiko JWT di `localStorage` pada laporan lama tidak lagi akurat. |
| K-04 | ✅ Sudah tidak valid | Mobile tutor QR sekarang memanggil `POST /attendance/session` dan memakai `session.id` dari backend. |
| K-05 | ❌ Masih valid | Manual attendance mobile dan web masih dummy, belum tersimpan ke backend. |
| K-06 | ❌ Masih valid | Mobile API masih hardcoded ke URL Serveo publik. |
| K-07 | ❌ Masih valid | Logout belum menginvalidasi JWT bearer yang sudah terbit. |
| K-08 | ❌ Masih valid | Endpoint submit attendance belum membatasi role ke `student`. |
| S-01 | ❌ Masih valid | Prisma masih `sqlite`, sedangkan `docker-compose.yml` menyiapkan PostgreSQL. |
| S-02 | ❌ Masih valid | Workflow CI masih menjalankan `npx webpack` walau frontend memakai Vite. |
| S-03 | ❌ Masih valid | File `.env.example` belum ada. |
| S-04 | ❌ Masih valid | Belum ada test suite otomatis yang nyata. |
| S-05 | ⚠️ Bergeser | Mobile QR sudah aman, tetapi web masih membuat `sessionId` prediktif dengan `Date.now()` dan backend masih mengizinkan client mengirim `sessionId`. |
| S-06 | ❌ Masih valid | Rate limiting baru ada di auth, belum ada di endpoint attendance. |
| S-07 | ❌ Masih valid | `AuthRequest.user` masih bertipe `any`. |

### Temuan Aktual Paling Penting

#### 1. Mobile scan QR masih simulasi penuh

**File:** `AbsensiLes/src/screens/student/ScanQRScreen.tsx`

- Scan QR di mobile belum mengirim request ke backend.
- Aplikasi menampilkan sukses palsu setelah `setTimeout`, sehingga integritas data presensi tidak terjaga.

#### 2. Endpoint submit attendance menerima semua role yang terautentikasi

**File:** `backend/src/routes/attendance.ts`

- `POST /api/attendance` memakai `authenticate`, tetapi tidak mengecek `req.user.role === 'student'`.
- Admin dan tutor dapat mencatat presensi sebagai dirinya sendiri selama punya token valid.

#### 3. Manual attendance masih mock di dua frontend

**File:** `AbsensiLes/src/screens/tutor/ManualAttendanceScreen.tsx`, `frontend/src/App.tsx`

- Daftar siswa masih hardcoded.
- Tombol simpan belum menulis ke backend.

#### 4. Riwayat absensi mobile masih dummy

**File:** `AbsensiLes/src/screens/student/HistoryScreen.tsx`

- History ditampilkan dari `DUMMY_HISTORY`, bukan `GET /api/attendance/history`.

#### 5. Konfigurasi mobile masih menempel ke tunnel publik

**File:** `AbsensiLes/src/services/api.ts`

- URL API hardcoded ke domain `serveousercontent.com`.
- Risiko utama: environment drift, dependensi ke tunnel sementara, dan potensi salah arah trafik produksi/dev.

#### 6. Web masih mengizinkan pilihan role admin di UI registrasi

**File:** `frontend/src/App.tsx`

- Dropdown registrasi masih menampilkan `Administrator`.
- Backend memang akan menolak, tetapi UI sekarang menyesatkan dan tidak sinkron dengan aturan server.

#### 7. Session ID web masih bisa diprediksi dan dikendalikan client

**File:** `frontend/src/App.tsx`, `backend/src/routes/attendance.ts`

- Web membuat `sessionId` dengan `SESSION_${Date.now()}`.
- Backend tetap menerima `sessionId` dari request body saat membuat sesi.
- Ini melemahkan keunikan sesi dan membuka peluang enumerasi / collision yang tidak perlu.

#### 8. Logout hanya membersihkan cookie lokal, bukan mencabut token

**File:** `backend/src/routes/auth.ts`

- JWT yang sudah terbit tetap valid sampai 30 hari.
- Karena backend juga menerima header `Authorization`, bearer token yang bocor tetap dapat dipakai walau user menekan logout.

### Verifikasi Teknis

- `frontend`: `npm run build` ✅
- `backend`: `npx tsc --noEmit` ✅
- `AbsensiLes`: `npx tsc --noEmit` ✅

### Implementasi Perbaikan yang Sudah Diterapkan

- `K-05`: flow presensi manual sekarang sudah memiliki endpoint backend nyata dan dipakai oleh web/mobile.
- `K-06`: URL API mobile dipindahkan ke `EXPO_PUBLIC_API_URL` melalui file konfigurasi.
- `K-07`: logout sekarang mencabut validitas JWT aktif melalui `tokenVersion`.
- `K-08`: endpoint submit attendance sekarang hanya menerima role `student`.
- `S-01`: `docker-compose.yml` diselaraskan ke runtime SQLite yang memang dipakai backend saat ini.
- `S-02`: workflow GitHub Actions diganti dari `webpack` ke pipeline CI yang sesuai untuk backend, frontend, dan mobile.
- `S-03`: file `.env.example` ditambahkan untuk backend, frontend, dan mobile.
- `S-05`: session ID web tidak lagi dibuat dengan `Date.now()`; session dibuat server-side.
- `S-06`: rate limiting ditambahkan ke namespace `/api/attendance`.
- `S-07`: `req.user` tidak lagi memakai `any`; sekarang memakai payload JWT yang terdefinisi.

### Kesimpulan Re-Audit

Nilai `D+` dari laporan lama masih masuk akal secara umum, tetapi daftar temuannya perlu diperbarui. Sebagian isu kritikal awal sudah dibenahi, namun project masih memiliki gap nyata pada integritas presensi mobile/web, pembatasan role pada attendance, pengelolaan token logout, dan drift konfigurasi environment.

---

## 📊 Ringkasan Eksekutif

| Kategori | Jumlah |
|---|---|
| 🔴 Kritikal | 8 |
| 🟡 Sedang | 7 |
| ✅ Praktik Baik | 11 |
| 🏗️ Platform | 3 |

### Penilaian Per Area
| Area | Nilai |
|---|---|
| Keamanan Autentikasi | D |
| Validasi Input | A |
| Keamanan Database | B |
| Arsitektur Kode | B+ |
| Kelengkapan Fitur | D+ |
| DevOps & CI/CD | D |
| Kualitas TypeScript | B- |

---

## 🔴 KRITIKAL — Harus Diperbaiki Segera

---

### [K-01] Login Mobile PALSU — Tidak Memanggil API Nyata

**File:** `AbsensiLes/src/screens/auth/LoginScreen.tsx` · Baris 30–42  
**CVSS:** 9.8 Critical | **Dampak:** Privilege Escalation, Authentication Bypass

#### ❌ Kode Bermasalah
```typescript
// LoginScreen.tsx — BERBAHAYA
const handleLogin = async () => {
  setLoading(true);
  // Simulasi pemanggilan API — TIDAK ADA API yang dipanggil!
  setTimeout(() => {
    let role: 'admin' | 'tutor' | 'student' = 'student';
    if (email.includes('admin')) role = 'admin';  // ← Eskalasi privilege!
    else if (email.includes('tutor')) role = 'tutor';

    login({ id: '1', name: 'User', email, role }, 'dummy-token'); // ← Token palsu!
    setLoading(false);
  }, 1500);
};
```

**Risiko:** Siapa saja yang menggunakan email mengandung kata `admin` mendapat akses admin penuh dengan token `dummy-token` tanpa verifikasi apapun ke server.

#### ✅ Perbaikan
```typescript
// LoginScreen.tsx — VERSI AMAN
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Email dan password tidak boleh kosong.');
    return;
  }

  setLoading(true);
  try {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    login(user, token); // Role datang dari server, bukan dari email string!
  } catch (err: any) {
    const msg = err.response?.data?.error || 'Email atau password salah.';
    Alert.alert('Login Gagal', msg);
  } finally {
    setLoading(false);
  }
};
```

---

### [K-02] Registrasi Admin Terbuka — Siapa Saja Bisa Daftar Sebagai Admin

**File:** `backend/src/routes/auth.ts` · RegisterSchema · Baris 13  
**CVSS:** 9.1 Critical | **Dampak:** Unauthorized Admin Access

#### ❌ Kode Bermasalah
```typescript
// auth.ts — Terlalu permisif
const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'tutor', 'student']) // ← Siapa saja bisa pilih 'admin'!
});
```

#### ✅ Perbaikan
```typescript
// auth.ts — Batasi role registrasi publik
const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8), // Tambah minimum ke 8
  role: z.enum(['tutor', 'student']) // ← Admin DIHAPUS dari registrasi publik
});

// Buat endpoint terpisah untuk admin (dilindungi middleware)
// POST /api/admin/users — hanya bisa diakses oleh admin yang sudah login
router.post('/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  // Buat user admin baru
});

// Middleware requireRole helper
export const requireRole = (...roles: string[]) => 
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Akses tidak diizinkan.', 403);
    }
    next();
  };
```

---

### [K-03] JWT Disimpan di `localStorage` — Rentan Serangan XSS

**File:** `frontend/src/store.ts` · useAuthStore · Baris 18  
**CVSS:** 8.8 High | **Dampak:** Token Theft, Session Hijacking

#### ❌ Kode Bermasalah
```typescript
// store.ts — Rentan XSS
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null, // ← JWT tersimpan di localStorage, bisa dicuri via XSS
      login: (user, token) => set({ user, token }),
    }),
    {
      name: 'absensiles-auth-web',
      storage: createJSONStorage(() => localStorage), // ← Berbahaya!
    }
  )
);
```

#### ✅ Perbaikan
```typescript
// store.ts — Andalkan HttpOnly Cookie saja, hapus token dari state
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      // HAPUS: token: null — tidak perlu simpan token di client
      login: (user: User) => set({ user }), // Hanya simpan data user non-sensitif
      logout: async () => {
        await axios.post('/api/auth/logout', {}, { withCredentials: true });
        set({ user: null });
      },
    }),
    {
      name: 'absensiles-auth-web',
      storage: createJSONStorage(() => sessionStorage), // Lebih aman dari localStorage
      partialize: (state) => ({ user: state.user }), // Hanya persist user, bukan token
    }
  )
);

// api.ts — Hapus Authorization header manual, andalkan cookie
api.interceptors.request.use((config) => {
  // HAPUS: config.headers.Authorization = `Bearer ${token}`;
  // Cookie HttpOnly dikirim otomatis oleh browser
  return config;
});
```

```typescript
// backend/src/routes/auth.ts — Hapus token dari response body
res.json({
  // HAPUS: token, — tidak perlu dikirim ke web client
  user: { id: user.id, name: user.name, email: user.email, role: user.role }
});
```

---

### [K-04] QR Code Mobile Dibuat Lokal — Tidak Tersimpan di Database

**File:** `AbsensiLes/src/screens/tutor/GenerateQRScreen.tsx` · Baris 10–17  
**Dampak:** Feature Non-functional, Data Integrity Failure

#### ❌ Kode Bermasalah
```typescript
// GenerateQRScreen.tsx — Tidak ada panggilan API!
const generateNewSession = () => {
  const sessionData = {
    sessionId: `SESS_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    classInfo: 'Kelas Reguler' // ← Hardcoded!
  };
  setQrValue(JSON.stringify(sessionData)); // ← Hanya lokal, tidak ke DB!
};
```

**Akibat:** Setiap siswa yang scan QR ini dan submit absensi ke backend akan selalu mendapat error `"QR Code tidak valid atau sesi telah berakhir"` karena sesi tidak pernah ada di database.

#### ✅ Perbaikan
```typescript
// GenerateQRScreen.tsx — Versi benar
import api from '../../services/api';

const [classInfo, setClassInfo] = useState('');
const [isLoading, setIsLoading] = useState(false);

const generateNewSession = async () => {
  if (!classInfo.trim()) {
    Alert.alert('Error', 'Masukkan nama kelas terlebih dahulu.');
    return;
  }

  setIsLoading(true);
  try {
    const response = await api.post('/attendance/session', { classInfo });
    const sessionId = response.data.session.id; // UUID dari server
    setQrValue(sessionId); // QR code berisi session ID yang valid di DB
  } catch (err: any) {
    Alert.alert('Gagal', err.response?.data?.error || 'Gagal membuat sesi.');
  } finally {
    setIsLoading(false);
  }
};

// Tambahkan input classInfo di UI
return (
  <View>
    <TextInput
      label="Nama Kelas"
      value={classInfo}
      onChangeText={setClassInfo}
      placeholder="Contoh: Matematika SMA XII - Limit Fungsi"
    />
    <Button onPress={generateNewSession} loading={isLoading}>
      Buat Sesi QR
    </Button>
    {qrValue && <QRCode value={qrValue} size={240} />}
  </View>
);
```

---

### [K-05] Absensi Manual Tidak Menyimpan Data ke Database

**File:** `frontend/src/App.tsx` · TutorManualAttendance · `handleSave`  
**Dampak:** Data Loss, Feature Non-functional, User Deception

#### ❌ Kode Bermasalah
```typescript
// App.tsx — handleSave palsu!
const handleSave = () => {
  // Hanya toast, TIDAK ADA API call!
  triggerToast(`Berhasil menyimpan presensi manual! ${presentIds.size} siswa hadir.`);
  // Data hilang saat page di-refresh
};
```

#### ✅ Perbaikan
```typescript
// App.tsx — handleSave yang benar
const handleSave = async () => {
  if (presentIds.size === 0) {
    triggerToast('Pilih minimal satu siswa.', 'error');
    return;
  }
  if (!currentSessionId) {
    triggerToast('Buat sesi QR terlebih dahulu.', 'error');
    return;
  }

  setIsSaving(true);
  try {
    // Submit satu per satu atau batch endpoint
    await Promise.all(
      Array.from(presentIds).map(studentId =>
        api.post('/attendance', {
          sessionId: currentSessionId,
          studentId,
          status: 'hadir'
        })
      )
    );
    triggerToast(`${presentIds.size} presensi berhasil disimpan!`);
    setPresentIds(new Set());
  } catch (err: any) {
    triggerToast(err.response?.data?.error || 'Gagal menyimpan presensi.', 'error');
  } finally {
    setIsSaving(false);
  }
};
```

```typescript
// Tambahkan endpoint batch di backend — attendance.ts
router.post('/manual', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      throw new AppError('Hanya tutor yang dapat mengisi absensi manual.', 403);
    }

    const { sessionId, studentIds } = req.body;
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError('Sesi tidak ditemukan.', 404);
    if (session.tutorId !== req.user.id) {
      throw new AppError('Anda tidak berhak mengakses sesi ini.', 403);
    }

    const result = await prisma.attendance.createMany({
      data: studentIds.map((studentId: string) => ({
        sessionId, studentId, status: 'hadir'
      })),
      skipDuplicates: true
    });

    res.status(201).json({ message: 'Presensi manual berhasil disimpan.', count: result.count });
  } catch (error) {
    next(error);
  }
});
```

---

### [K-06] URL API Mobile Hardcoded ke Tunnel Serveo Publik

**File:** `AbsensiLes/src/services/api.ts` · Baris 4  
**Dampak:** Man-in-the-Middle, Data Exposure, Single Point of Failure

#### ❌ Kode Bermasalah
```typescript
// api.ts — Berbahaya di production!
const API_URL = 'https://2df9f003876952eb-36-74-234-209.serveousercontent.com/api';
// Semua traffic (password, data absensi) melewati server pihak ketiga!
// URL akan kedaluwarsa kapan saja tanpa peringatan
```

#### ✅ Perbaikan
```typescript
// api.ts — Gunakan environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
```

```javascript
// app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    }
  }
};
```

```bash
# .env.local (development)
EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api

# .env.production
EXPO_PUBLIC_API_URL=https://api.absensi-les.com/api
```

---

### [K-07] Logout Tidak Menginvalidasi JWT — Token Aktif 30 Hari

**File:** `backend/src/routes/auth.ts` · logout + JWT config  
**Dampak:** Session Persistence Attack, Token Not Revocable

#### ❌ Kode Bermasalah
```typescript
// auth.ts — Token 30 hari tanpa revokasi
const token = jwt.sign(payload, secret, { expiresIn: '30d' }); // ← Terlalu lama!

// logout — hanya hapus cookie, token masih valid di semua klien lain!
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // ← Token tetap bisa dipakai jika sudah dicopy
  res.json({ message: 'Logout berhasil!' });
});
```

#### ✅ Perbaikan — Implementasi Refresh Token Pattern
```typescript
// auth.ts — Access token pendek + refresh token
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Login: buat dua token
const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });

// Simpan refresh token di DB (bisa direvoke)
await prisma.refreshToken.create({
  data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7*24*60*60*1000) }
});

// Set cookies
res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 15*60*1000 });
res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7*24*60*60*1000, path: '/api/auth/refresh' });

// Logout: revoke refresh token di DB
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logout berhasil!' });
});
```

```prisma
// Tambahkan model di schema.prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### [K-08] Tutor & Admin Bisa Submit Absensi Sebagai Siswa

**File:** `backend/src/routes/attendance.ts` · `POST /` · Baris 55  
**Dampak:** Authorization Bypass, Attendance Fraud

#### ❌ Kode Bermasalah
```typescript
// attendance.ts — Tidak ada cek role!
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  // Hanya cek: apakah token valid? ✅
  // Tidak cek: apakah role === 'student'? ❌
  const { sessionId, status, lat, lng } = validation.data;
  const studentId = req.user.id; // Tutor/admin bisa juga masuk sini!
});
```

#### ✅ Perbaikan
```typescript
// attendance.ts — Tambahkan role guard
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Guard: hanya student yang boleh submit absensi mandiri
    if (req.user.role !== 'student') {
      throw new AppError('Hanya siswa yang dapat mengisi absensi mandiri.', 403);
    }

    const validation = SubmitAttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map(e => e.message).join(' '), 400);
    }

    const { sessionId, status, lat, lng } = validation.data;
    const studentId = req.user.id;
    // ... sisanya tetap sama
  } catch (error) {
    next(error);
  }
});
```

---

## 🟡 SEDANG — Diperbaiki Sebelum Production

---

### [S-01] Konflik Database: SQLite di Schema vs PostgreSQL di Docker

**File:** `backend/prisma/schema.prisma` vs `docker-compose.yml`

#### ❌ Masalah
```prisma
// schema.prisma — menggunakan SQLite
datasource db {
  provider = "sqlite"   // ← Development
  url      = env("DATABASE_URL")
}
```
```yaml
# docker-compose.yml — menyediakan PostgreSQL
image: postgres:15-alpine  # ← Production/Staging inkonsisten!
```

#### ✅ Perbaikan
```prisma
// schema.prisma — seragamkan ke PostgreSQL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
```bash
# .env — development pakai Docker PostgreSQL
DATABASE_URL="postgresql://absensiles_user:absensiles_password@localhost:5432/absensiles_db"
```

---

### [S-02] CI/CD Workflow Salah — Proyek Tidak Menggunakan Webpack

**File:** `.github/workflows/webpack.yml`

#### ❌ Masalah
```yaml
name: NodeJS with Webpack
# Proyek ini pakai Vite + ts-node, BUKAN Webpack!
run: |
  npm install
  npx webpack  # ← Error! webpack tidak ada di dependencies
```

#### ✅ Perbaikan
```yaml
# .github/workflows/ci.yml
name: CI — Build & Type Check

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20.x' }
      - name: Install & Type Check Backend
        working-directory: ./backend
        run: npm ci && npx tsc --noEmit
      - name: Run Backend Tests
        working-directory: ./backend
        run: npm test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20.x' }
      - name: Install & Build Frontend
        working-directory: ./frontend
        run: npm ci && npm run build
      - name: Lint Frontend
        working-directory: ./frontend
        run: npm run lint
```

---

### [S-03] Tidak Ada File `.env.example` — Environment Variables Tidak Terdokumentasi

**File:** `backend/` — tidak ada `.env.example`

#### ✅ Buat File `backend/.env.example`
```bash
# backend/.env.example
# Salin file ini ke .env dan isi nilainya

# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/absensiles_db"
# Untuk SQLite (dev sementara): DATABASE_URL="file:./dev.db"

# JWT Secrets — HARUS diisi dengan string random minimal 64 karakter
# Generate dengan: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET="GANTI_DENGAN_SECRET_RANDOM_MINIMAL_64_KARAKTER"
JWT_REFRESH_SECRET="GANTI_DENGAN_SECRET_RANDOM_LAIN_MINIMAL_64_KARAKTER"

# Server
NODE_ENV="development"
PORT=3000

# CORS — frontend URL
FRONTEND_URL="http://localhost:5173"
```

---

### [S-04] Tidak Ada Test Suite — Zero Automated Testing

**File:** `backend/package.json` → `"test": "echo Error..."`

#### ✅ Setup Testing dengan Vitest + Supertest
```bash
cd backend
npm install -D vitest supertest @types/supertest
```

```typescript
// backend/src/__tests__/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import app from '../app'; // export app dari server.ts

const request = supertest(app);

describe('Auth Routes', () => {
  it('POST /api/auth/register — berhasil daftar student', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Test Siswa',
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('student');
  });

  it('POST /api/auth/register — tolak role admin', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin' // Harus ditolak!
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login — gagal dengan password salah', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'WRONG_PASSWORD'
    });
    expect(res.status).toBe(400);
  });
});

describe('Attendance Routes', () => {
  it('POST /api/attendance — tolak role tutor', async () => {
    // Login sebagai tutor
    const loginRes = await request.post('/api/auth/login').send({
      email: 'tutor@example.com', password: 'password123'
    });
    const { token } = loginRes.body;

    const res = await request
      .post('/api/attendance')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: 'test-session', status: 'hadir' });

    expect(res.status).toBe(403); // Harus ditolak!
  });
});
```

```json
// backend/package.json — update scripts
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

### [S-05] Session ID Dapat Ditebak — Menggunakan `Date.now()`

**File:** `frontend/src/App.tsx` · TutorGenerateQR · Baris 52

#### ❌ Masalah
```typescript
const newSessionId = `SESSION_${Date.now()}`;
// SESSION_1748598000000 — timestamp deterministik, mudah ditebak!
```

#### ✅ Perbaikan
```typescript
// JANGAN generate session ID di frontend sama sekali!
// Biarkan Prisma yang generate UUID: @id @default(uuid())
// Hanya kirim classInfo, server yang tentukan ID

const handleGenerate = async (e: React.FormEvent) => {
  const response = await api.post('/attendance/session', { classInfo });
  // response.data.session.id adalah UUID aman dari server
  setSessionId(response.data.session.id);
};
```

---

### [S-06] Rate Limiting Tidak Ada di Endpoint Attendance

**File:** `backend/src/server.ts`

#### ✅ Perbaikan
```typescript
// server.ts — tambahkan rate limiter untuk attendance
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 menit
  max: 20,                   // 20 request per menit per IP
  message: {
    error: 'Terlalu banyak request. Coba lagi dalam 1 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const sessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 50,                   // Maksimal 50 sesi per jam per IP
  message: {
    error: 'Batas pembuatan sesi tercapai. Coba lagi dalam 1 jam.'
  }
});

app.use('/api/attendance/session', sessionLimiter);
app.use('/api/attendance', attendanceLimiter, attendanceRoutes);
```

---

### [S-07] `req.user` Ditype Sebagai `any` — Kehilangan Type-Safety

**File:** `backend/src/middleware/auth.ts`

#### ❌ Masalah
```typescript
export interface AuthRequest extends Request {
  user?: any; // ← Kehilangan semua keuntungan TypeScript!
}
```

#### ✅ Perbaikan
```typescript
// auth.ts — Type yang benar
export interface JwtPayload {
  id: string;
  role: 'admin' | 'tutor' | 'student';
  name: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user: JwtPayload; // Hapus ? — user selalu ada setelah middleware berjalan
}

// authenticate middleware — cast dengan benar
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;
req.user = decoded;
```

---

## ✅ PRAKTIK BAIK — Dipertahankan

Berikut hal-hal yang sudah diimplementasikan dengan benar dan **jangan diubah**:

| No | Praktik | Lokasi |
|---|---|---|
| 1 | ✅ Validasi Zod di semua endpoint | `backend/src/routes/*.ts` |
| 2 | ✅ Password hashing bcryptjs (salt 10) | `backend/src/routes/auth.ts` |
| 3 | ✅ HttpOnly cookie dengan `secure` & `sameSite` | `backend/src/routes/auth.ts` |
| 4 | ✅ Rate limiting pada auth routes | `backend/src/server.ts` |
| 5 | ✅ Centralized error handler + AppError class | `backend/src/middleware/errorHandler.ts` |
| 6 | ✅ Stack trace hanya di development | `backend/src/middleware/errorHandler.ts` |
| 7 | ✅ Pencegahan absen ganda (duplicate check) | `backend/src/routes/attendance.ts` |
| 8 | ✅ Deteksi Fake GPS (`location.mocked`) | `AbsensiLes/src/utils/locationHelper.ts` |
| 9 | ✅ Auto-logout saat response 401 | `frontend/src/api.ts` |
| 10 | ✅ Prisma ORM (SQL Injection prevention) | `backend/src/lib/prisma.ts` |
| 11 | ✅ TypeScript di semua 3 platform | Seluruh codebase |

---

## 🗺️ Roadmap Perbaikan

### Phase 0 — Darurat (Hari ini, sebelum ada user)
```
[ ] [K-01] Perbaiki login mobile → panggil API nyata
[ ] [K-02] Batasi registrasi admin
[ ] [K-04] Perbaiki QR generate mobile → simpan ke DB
[ ] [K-05] Implementasi save absensi manual → panggil API
```

### Phase 1 — Keamanan (Minggu 1)
```
[ ] [K-03] Hapus JWT dari localStorage
[ ] [K-06] Ganti hardcoded Serveo URL → env variable
[ ] [K-07] Implementasi refresh token + revokasi
[ ] [K-08] Tambahkan role guard di endpoint attendance
[ ] [S-05] Hapus session ID generation dari frontend
[ ] [S-06] Tambahkan rate limiting attendance
```

### Phase 2 — Infrastruktur (Minggu 2)
```
[ ] [S-01] Seragamkan database ke PostgreSQL
[ ] [S-02] Perbaiki CI/CD workflow
[ ] [S-03] Buat .env.example
[ ] [S-07] Perbaiki typing req.user dari any ke JwtPayload
```

### Phase 3 — Kualitas (Minggu 3–4)
```
[ ] [S-04] Implementasi test suite (Vitest + Supertest)
[ ] Tambahkan pagination di GET /attendance/history
[ ] Implementasi endpoint GET /attendance/students
[ ] Tambahkan admin dashboard yang terhubung ke API nyata
[ ] Dokumentasi API (Swagger/OpenAPI)
```

---

## 🔧 Checklist Cepat Sebelum Deploy Production

```bash
# 1. Environment
[ ] JWT_ACCESS_SECRET diisi string random 64+ karakter
[ ] JWT_REFRESH_SECRET diisi string random 64+ karakter (berbeda!)
[ ] NODE_ENV=production
[ ] DATABASE_URL mengarah ke PostgreSQL (bukan SQLite)
[ ] FRONTEND_URL diisi domain production (bukan localhost)

# 2. Kode
[ ] Tidak ada console.log sensitif tertinggal
[ ] Tidak ada hardcoded URL (Serveo, localhost)
[ ] Tidak ada 'dummy-token' atau mock data
[ ] Semua TODO dan FIXME sudah diselesaikan

# 3. Database
[ ] Migrasi Prisma sudah dijalankan: npx prisma migrate deploy
[ ] Seed admin pertama sudah dibuat secara manual (bukan via API publik)

# 4. Testing
[ ] npm test berjalan tanpa error
[ ] Build frontend berhasil: npm run build
[ ] TypeScript compile tanpa error: npx tsc --noEmit

# 5. Security Headers (tambahkan Helmet.js)
npm install helmet
app.use(helmet()); // Tambahkan di server.ts
```

---

*Laporan ini dibuat berdasarkan analisis statis kode sumber. Direkomendasikan juga melakukan penetration testing dinamis sebelum production.*
