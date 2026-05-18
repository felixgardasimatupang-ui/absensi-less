import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';

export const app = express();

// Secure CORS Config for Cookie-Based Authentication
const allowedOrigins = [
  'http://localhost:5173', // Web frontend dev
  'http://localhost:3000', // Backend local root
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Anti-Brute-Force Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: 'Terlalu banyak permintaan otentikasi dari IP ini, silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const attendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: 'Terlalu banyak permintaan presensi dari IP ini, silakan coba lagi beberapa saat lagi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', attendanceLimiter, attendanceRoutes);

// Welcome / API Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Welcome to the Absensi Les API Server!',
    healthCheck: '/api/health',
    frontend: 'http://localhost:5173',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      attendance: [
        'POST /api/attendance/session',
        'POST /api/attendance',
        'POST /api/attendance/manual',
        'GET /api/attendance/history',
        'GET /api/attendance/students'
      ]
    }
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend Absensi Les is running perfectly!' });
});

// Import and Register Centralized Error Handler Middleware (MUST be registered after all routes)
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server is successfully running on http://localhost:${PORT}`);
  });
}
