import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// Zod Schemas for Input Validation
const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal terdiri dari 2 karakter.' }).max(50),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal terdiri dari 6 karakter.' }),
  role: z.enum(['admin', 'tutor', 'student'], { message: 'Role harus berupa admin, tutor, atau student.' })
});

const LoginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' })
});

// REGISTRASI USER BARU
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      return res.status(400).json({ error: errorMsg });
    }

    const { name, email, password, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar.' });
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
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      return res.status(400).json({ error: errorMsg });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Kredensial tidak valid.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Kredensial tidak valid.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

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
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Logout berhasil!' });
});

export default router;
