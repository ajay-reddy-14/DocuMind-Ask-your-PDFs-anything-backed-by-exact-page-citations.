import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Shared error shape used throughout the application
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Please upload a smaller PDF.'
        : err.message;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
    return;
  }

  // Prisma unique constraint violation
  if ((err as { code?: string }).code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'A record with this value already exists.',
    });
    return;
  }

  // Prisma record not found
  if ((err as { code?: string }).code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Record not found.',
    });
    return;
  }

  // Unexpected errors – do not leak stack traces to clients
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected server error occurred.',
  });
}

