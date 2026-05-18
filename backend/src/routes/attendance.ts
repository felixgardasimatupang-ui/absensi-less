import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Zod Validation Schemas
const CreateSessionSchema = z.object({
  classInfo: z.string().min(2, { message: 'Informasi kelas minimal terdiri dari 2 karakter.' })
});

const SubmitAttendanceSchema = z.object({
  sessionId: z.string().min(1, { message: 'Session ID wajib diisi.' }),
  status: z.enum(['hadir', 'izin', 'alpa']).optional().default('hadir'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable()
});

const ManualAttendanceSchema = z.object({
  classInfo: z.string().min(2, { message: 'Informasi kelas minimal terdiri dari 2 karakter.' }),
  studentIds: z.array(z.string().min(1)).min(1, { message: 'Pilih minimal satu siswa.' }),
  status: z.enum(['hadir', 'izin', 'alpa']).optional().default('hadir'),
});

// BUAT SESI KELAS BARU (Hanya Tutor)
router.post('/session', authenticate, requireRole('tutor'), async (req: AuthRequest, res, next) => {
  try {
    const validation = CreateSessionSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { classInfo } = validation.data;
    const session = await prisma.session.create({
      data: {
        tutor: { connect: { id: req.user!.id } },
        classInfo,
      }
    });

    res.status(201).json({ message: 'Sesi kelas berhasil dibuat', session });
  } catch (error) {
    next(error);
  }
});

// SUBMIT ABSEN (Siswa Scan QR)
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      throw new AppError('Hanya siswa yang dapat melakukan presensi melalui QR.', 403);
    }

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

    let attendance;
    try {
      attendance = await prisma.attendance.create({
        data: {
          sessionId,
          studentId,
          status,
          lat,
          lng
        }
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new AppError('Anda sudah melakukan presensi untuk sesi ini.', 400);
      }
      throw error;
    }

    res.status(201).json({ message: 'Presensi berhasil dicatat!', attendance });
  } catch (error) {
    next(error);
  }
});

// PRESENSI MANUAL OLEH TUTOR / ADMIN
router.post('/manual', authenticate, requireRole('admin', 'tutor'), async (req: AuthRequest, res, next) => {
  try {
    const validation = ManualAttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      throw new AppError(errorMsg, 400);
    }

    const { classInfo, studentIds, status } = validation.data;
    const uniqueStudentIds = [...new Set(studentIds)];

    const students = await prisma.user.findMany({
      where: {
        id: { in: uniqueStudentIds },
        role: Role.student,
      },
      select: { id: true },
    });

    if (students.length !== uniqueStudentIds.length) {
      throw new AppError('Sebagian siswa tidak ditemukan atau bukan berperan sebagai student.', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: {
          tutor: { connect: { id: req.user!.id } },
          classInfo,
        },
      });

      await tx.attendance.createMany({
        data: uniqueStudentIds.map((studentId) => ({
          sessionId: session.id,
          studentId,
          status,
        })),
      });

      const attendances = await tx.attendance.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
      });

      return { session, attendances };
    });

    res.status(201).json({
      message: 'Presensi manual berhasil disimpan.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// AMBIL RIWAYAT ABSEN (Berdasarkan Siswa)
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.role !== 'student') {
      throw new AppError('Riwayat presensi hanya tersedia untuk siswa.', 403);
    }

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

// AMBIL DAFTAR SISWA UNTUK PRESENSI MANUAL
router.get('/students', authenticate, requireRole('admin', 'tutor'), async (req: AuthRequest, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: Role.student },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ students });
  } catch (error) {
    next(error);
  }
});

export default router;
