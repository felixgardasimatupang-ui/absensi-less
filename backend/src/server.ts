import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';

export const app = express();

// ===================================================================
// [S-05 FIX] Security Headers dengan Helmet.js
// Helmet menetapkan berbagai HTTP header untuk proteksi dari serangan
// umum: Clickjacking, XSS via content-type sniffing, dll.
// ===================================================================
app.use(helmet({
  // Izinkan QR code external image di Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https://api.qrserver.com'],
    },
  },
}));

// ===================================================================
// [S-05 FIX] HTTPS Enforcement di Production
// Redirect semua HTTP request ke HTTPS dan set HSTS header
// ===================================================================
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Cek header dari reverse proxy/load balancer (Nginx, Railway, Render, Vercel)
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      // Redirect permanen ke HTTPS
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  // HTTP Strict Transport Security: browser wajib HTTPS selama 1 tahun
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });
}

// Secure CORS Config for Cookie-Based Authentication
const allowedOriginsEnv = process.env.CORS_ORIGINS;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(origin => origin.trim())
  : [
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
    version: '2.0.0',
    healthCheck: '/api/health',
    frontend: 'http://localhost:5173',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',          // Web (cookie-only)
        'POST /api/auth/login-mobile',   // Mobile (token in body)
        'POST /api/auth/logout',
        'GET  /api/auth/me',
        'POST /api/auth/admin/users',
        'GET  /api/auth/admin/stats',
      ],
      attendance: [
        'POST /api/attendance/session',
        'POST /api/attendance',
        'POST /api/attendance/manual',
        'GET  /api/attendance/history',
        'GET  /api/attendance/students',
      ],
    },
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
