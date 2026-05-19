import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';

// ===================================================================
// JWT Token Payload Interface
// ===================================================================
interface AuthTokenPayload {
  id: string;
  role: Role;
  name: string;
  email: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

// ===================================================================
// Token Extraction — mendukung HttpOnly cookie (web) dan Bearer token (mobile)
// Prioritas: cookie 'token' → Authorization header Bearer token
// ===================================================================
export const extractTokenFromRequest = (req: Request) => {
  const authHeader = req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  // Cookie HttpOnly untuk web browser, Bearer token untuk mobile
  return req.cookies?.token || bearerToken;
};

// ===================================================================
// [S-03 INTERIM FIX] JWT Sign — Access Token 1 Jam
// Turun dari 30 hari → 1 jam sebagai langkah menengah.
// Full implementation (access 15m + refresh 7d) dilakukan di Sprint 2.
//
// Kenapa penting: Jika token dicuri, window pencurian hanya 1 jam,
// bukan 30 hari. Token version system memastikan logout tetap efektif.
// ===================================================================
export const signAuthToken = (payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) =>
  jwt.sign(payload, process.env.JWT_SECRET as string, {
    // Cast ke tipe standard SignOptions['expiresIn'] dari jsonwebtoken agar type-safe
    expiresIn: (process.env.JWT_EXPIRY || '1h') as jwt.SignOptions['expiresIn'],
  });

// ===================================================================
// Token Verification dengan tokenVersion check
// Memastikan token yang sudah di-logout tidak bisa digunakan lagi
// ===================================================================
const verifyAuthToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthTokenPayload;

  // [K-07] Verifikasi tokenVersion — cegah penggunaan token pasca-logout
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { tokenVersion: true },
  });

  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError('Token tidak valid atau sesi telah berakhir.', 401);
  }

  return decoded;
};

// ===================================================================
// Authenticate Middleware — wajib dipasang di semua protected routes
// ===================================================================
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Akses ditolak. Token autentikasi tidak ditemukan.', 401));
  }

  try {
    req.user = await verifyAuthToken(token);
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Token tidak valid atau sesi telah berakhir.', 401)
    );
  }
};

// ===================================================================
// Role Guard Middleware — batasi akses berdasarkan role
// ===================================================================
export const requireRole = (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Akses tidak diizinkan. Role Anda tidak memiliki izin untuk operasi ini.', 403);
    }
    next();
  };
