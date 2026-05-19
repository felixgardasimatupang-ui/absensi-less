import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, requireRole, AuthRequest, extractTokenFromRequest, signAuthToken } from '../middleware/auth';

const router = Router();

// Zod Schemas for Input Validation
const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal terdiri dari 2 karakter.' }).max(50),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal terdiri dari 8 karakter.' }),
  role: z.enum(['tutor', 'student'], { message: 'Role harus berupa tutor atau student.' })
});

const LoginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' })
});

// REGISTRASI USER BARU
router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { name, email, password, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email sudah terdaftar.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });

    res.status(201).json({ 
      message: 'Registrasi berhasil!', 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Kredensial tidak valid.', 400);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new AppError('Kredensial tidak valid.', 400);
    }

    const token = signAuthToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // [K-03 FIX] Set HttpOnly cookie — satu-satunya cara token dikirim ke klien.
    // Token TIDAK dikembalikan di response body untuk mencegah akses via JavaScript (XSS).
    // React Native (mobile) menggunakan Authorization header via token yang disimpan di Secure Storage.
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 hari (akan dipersingkat di Sprint 2 dengan refresh token)
    });

    // [K-03 FIX] Hanya kembalikan data user — TIDAK ada token di body response.
    // Mobile client perlu menggunakan endpoint /api/auth/login-mobile yang mengembalikan token.
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

// LOGOUT — Invalidasi token via tokenVersion increment + hapus semua auth cookies
router.post('/logout', async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true },
        });

        if (user) {
          // [K-07] Increment tokenVersion — semua token lama langsung tidak valid
          await prisma.user.update({
            where: { id: user.id },
            data: { tokenVersion: { increment: 1 } },
          });
        }
      } catch (_jwtErr) {
        // Token sudah expired/invalid — lanjutkan logout, bersihkan cookie
      }
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    // [K-03 FIX] Hapus cookie auth utama
    res.clearCookie('token', cookieOptions);
    // Siap untuk refresh token cookie di Sprint 2 (S-03)
    res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth/refresh' });

    res.json({ message: 'Logout berhasil!' });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT USER (Session validation)
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // The authenticate middleware already validated the token and attached user to req
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true
      }
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// CREATE USER (Khusus Admin)
const AdminCreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal terdiri dari 2 karakter.' }).max(50),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal terdiri dari 8 karakter.' }),
  role: z.enum(['admin', 'tutor', 'student'], { message: 'Role tidak valid.' })
});

router.post('/admin/users', authenticate, requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const validation = AdminCreateUserSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { name, email, password, role } = validation.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email sudah terdaftar.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });

    res.status(201).json({ 
      message: 'Pembuatan akun berhasil!', 
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (error) {
    next(error);
  }
});

// ===================================================================
// LOGIN MOBILE — Endpoint khusus React Native (mengembalikan token di body)
// ===================================================================
// Mobile app tidak dapat membaca HttpOnly cookie seperti browser,
// sehingga endpoint ini mengembalikan token di body untuk disimpan
// secara aman di Secure Storage perangkat (Expo SecureStore).
const MobileLoginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

router.post('/login-mobile', async (req, res, next) => {
  try {
    const validation = MobileLoginSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Kredensial tidak valid.', 401);
    }

    const token = signAuthToken({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    // Mobile: kembalikan token di body untuk disimpan di Expo SecureStore
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// ===================================================================
// [S-04 FIX] ADMIN STATS — Real-time data untuk dashboard admin
// ===================================================================
router.get('/admin/stats', authenticate, requireRole('admin'), async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalStudents, totalTutors, totalAdmins, attendanceStats] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'tutor' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.attendance.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          timestamp: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    const totalAttendance = attendanceStats.reduce((sum, s) => sum + s._count.status, 0);
    const hadirCount = attendanceStats.find(s => s.status === 'hadir')?._count.status ?? 0;
    const attendanceRate = totalAttendance > 0
      ? Math.round((hadirCount / totalAttendance) * 100)
      : 0;

    res.json({
      totalStudents,
      totalTutors,
      totalAdmins,
      totalUsers: totalStudents + totalTutors + totalAdmins,
      attendanceRate,
      hadirCount,
      totalAttendance,
      month: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
