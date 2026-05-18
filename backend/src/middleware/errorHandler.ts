import { Request, Response, NextFunction } from 'express';

// Custom Operational Error class for known API errors
export class AppError extends Error {
  public readonly status: number;
  
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Centralized Error Handling Middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // 1. Audit / Log the complete error stack trace securely on the server console
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] ❌ ERROR TRACE:`);
  console.error(`Request: ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message || err}`);
  if (err.stack) {
    console.error(err.stack);
  }
  console.error('--------------------------------------------\n');

  // 2. Handle Prisma Database specific errors securely
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      error: 'Terjadi kegagalan operasi basis data. Mohon periksa integritas data Anda.'
    });
  }

  // 3. Determine if it's a known AppError (Operational) or an Unhandled System Error (500)
  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const message = status === 500 
    ? 'Terjadi kesalahan internal pada server. Tim pengembang telah diberitahu.' 
    : err.message;

  res.status(status).json({
    error: message,
    // Provide stack trace ONLY in development for secure debugging
    stack: !isProduction ? err.stack : undefined
  });
};
