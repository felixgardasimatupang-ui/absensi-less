import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Zod Validation Schemas
const CreateSessionSchema = z.object({
  sessionId: z.string().min(1).optional(),
  classInfo: z.string().min(2, { message: 'Informasi kelas minimal terdiri dari 2 karakter.' })
});

const SubmitAttendanceSchema = z.object({
  sessionId: z.string().min(1, { message: 'Session ID wajib diisi.' }),
  status: z.enum(['hadir', 'izin', 'alpa']).optional().default('hadir'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable()
});

// BUAT SESI KELAS BARU (Hanya Tutor)
router.post('/session', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user.role !== 'tutor') {
      throw new AppError('Hanya tutor yang dapat membuat sesi kelas.', 403);
    }

    // Validate request body
    const validation = CreateSessionSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { sessionId, classInfo } = validation.data;
    
    let session;
    if (sessionId) {
      session = await prisma.session.create({
        data: {
          id: sessionId,
          tutor: { connect: { id: req.user.id } },
          classInfo,
        }
      });
    } else {
      session = await prisma.session.create({
        data: {
          tutor: { connect: { id: req.user.id } },
          classInfo,
        }
      });
    }

    res.status(201).json({ message: 'Sesi kelas berhasil dibuat', session });
  } catch (error) {
    next(error);
  }
});

// SUBMIT ABSEN (Siswa Scan QR)
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Validate request body
    const validation = SubmitAttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { sessionId, status, lat, lng } = validation.data;
    const studentId = req.user.id;

    // 1. Cek apakah sesi valid (sudah di-generate oleh Tutor)
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new AppError('QR Code tidak valid atau sesi telah berakhir.', 404);
    }

    // 2. Cek agar siswa tidak absen ganda (Double-tap prevention)
    const existing = await prisma.attendance.findFirst({
      where: { sessionId, studentId }
    });

    if (existing) {
      throw new AppError('Anda sudah melakukan presensi untuk sesi ini.', 400);
    }

    // 3. Simpan data absen
    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        studentId,
        status, // Zod matches the AttendanceStatus enum type perfectly!
        lat,
        lng
      }
    });

    res.status(201).json({ message: 'Presensi berhasil dicatat!', attendance });
  } catch (error) {
    next(error);
  }
});

// AMBIL RIWAYAT ABSEN (Berdasarkan Siswa)
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const studentId = req.user.id;
    
    const history = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        session: {
          select: { classInfo: true, timestamp: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

export default router;
