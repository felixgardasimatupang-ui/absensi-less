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

    // Set secure HttpOnly cookie for Web clients
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Return token in body as well for React Native mobile compatibility
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

// LOGOUT
router.post('/logout', async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tokenVersion: { increment: 1 } },
        });
      }
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ message: 'Logout berhasil!' });
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

export default router;
