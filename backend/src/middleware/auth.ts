import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return next(new AppError('Akses ditolak. Token autentikasi tidak ditemukan.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // Menyematkan data user (id, role) ke request
    next();
  } catch (error) {
    next(new AppError('Token tidak valid atau sesi telah berakhir.', 401));
  }
};

export const requireRole = (...roles: string[]) => 
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('Akses tidak diizinkan.', 403);
    }
    next();
  };
