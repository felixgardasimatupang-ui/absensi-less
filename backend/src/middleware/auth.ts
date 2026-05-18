import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';

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

export const extractTokenFromRequest = (req: Request) => {
  const authHeader = req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  return req.cookies?.token || bearerToken;
};

export const signAuthToken = (payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) =>
  jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '30d' });

const verifyAuthToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthTokenPayload;
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { tokenVersion: true },
  });

  if (!user || user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError('Token tidak valid atau sesi telah berakhir.', 401);
  }

  return decoded;
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Akses ditolak. Token autentikasi tidak ditemukan.', 401));
  }

  try {
    req.user = await verifyAuthToken(token);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Token tidak valid atau sesi telah berakhir.', 401));
  }
};

export const requireRole = (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Akses tidak diizinkan.', 403);
    }
    next();
  };
