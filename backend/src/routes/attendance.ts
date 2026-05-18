import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

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
router.post('/session', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({ error: 'Hanya tutor yang dapat membuat sesi kelas.' });
    }

    // Validate request body
    const validation = CreateSessionSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      return res.status(400).json({ error: errorMsg });
    }

    const { sessionId, classInfo } = validation.data;
    
    const session = await prisma.session.create({
      data: {
        id: sessionId || undefined, // undefined lets Prisma fall back to @default(uuid())
        tutorId: req.user.id,
        classInfo,
      }
    });

    res.status(201).json({ message: 'Sesi kelas berhasil dibuat', session });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat sesi.' });
  }
});

// SUBMIT ABSEN (Siswa Scan QR)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    // Validate request body
    const validation = SubmitAttendanceSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e: any) => e.message).join(' ');
      return res.status(400).json({ error: errorMsg });
    }

    const { sessionId, status, lat, lng } = validation.data;
    const studentId = req.user.id;

    // 1. Cek apakah sesi valid (sudah di-generate oleh Tutor)
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return res.status(404).json({ error: 'QR Code tidak valid atau sesi telah berakhir.' });
    }

    // 2. Cek agar siswa tidak absen ganda (Double-tap prevention)
    const existing = await prisma.attendance.findFirst({
      where: { sessionId, studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Anda sudah melakukan presensi untuk sesi ini.' });
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
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat menyimpan absen.' });
  }
});

// AMBIL RIWAYAT ABSEN (Berdasarkan Siswa)
router.get('/history', authenticate, async (req: AuthRequest, res) => {
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
    res.status(500).json({ error: 'Gagal memuat histori presensi.' });
  }
});

export default router;
