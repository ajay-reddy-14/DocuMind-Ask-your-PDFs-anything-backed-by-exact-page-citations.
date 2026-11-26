// Multer configuration for PDF uploads
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Ensure the upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize the original filename to prevent path traversal
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitized}`;
    cb(null, unique);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (file.mimetype !== 'application/pdf') {
    cb(new AppError('Only PDF files are allowed.', 400));
    return;
  }
  cb(null, true);
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
}).single('file');

