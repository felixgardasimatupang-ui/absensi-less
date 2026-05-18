import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // Menyematkan data user (id, role) ke request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid atau sesi telah berakhir.' });
  }
};
