import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { documentProcessingService } from '../services/documents/documentProcessing.service';

// POST /api/documents/upload
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded. Please attach a PDF file.', 400);
  }

  const userId = req.userId!;
  const { originalname, filename, size, path: filePath } = req.file;

  // Create the document record (status: PENDING initially)
  const document = await prisma.document.create({
    data: {
      userId,
      title: path.basename(originalname, '.pdf'),
      originalFileName: originalname,
      fileSize: size,
      storagePath: filePath,
      status: 'PENDING',
    },
  });

  // Start async processing – don't await here so the upload returns immediately
  documentProcessingService.processDocument(document.id).catch((err: unknown) => {
    console.error(`Failed to process document ${document.id}:`, err);
  });

  successResponse(res, document, 201);
});

// GET /api/documents
export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      originalFileName: true,
      fileSize: true,
      pageCount: true,
      status: true,
      createdAt: true,
    },
  });

  successResponse(res, documents);
});

// GET /api/documents/:id
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const document = await prisma.document.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { chunks: true, conversations: true } },
    },
  });

  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  successResponse(res, document);
});

// DELETE /api/documents/:id
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  // Remove from database (cascades to chunks, conversations, messages)
  await prisma.document.delete({ where: { id } });

  // Remove the file from disk
  if (fs.existsSync(document.storagePath)) {
    fs.unlinkSync(document.storagePath);
  }

  successResponse(res, { message: 'Document deleted successfully.' });
});

// POST /api/documents/:id/summary
export const summarizeDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const document = await prisma.document.findFirst({ where: { id, userId } });
  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  if (document.status !== 'PROCESSED') {
    throw new AppError(
      'Document is not fully processed yet. Please wait until processing is complete.',
      422
    );
  }

  // Lazy import to avoid loading AI libraries until needed
  const { summaryService } = await import('../services/ai/summary.service');
  const summary = await summaryService.generateSummary(id);

  successResponse(res, summary);
});

