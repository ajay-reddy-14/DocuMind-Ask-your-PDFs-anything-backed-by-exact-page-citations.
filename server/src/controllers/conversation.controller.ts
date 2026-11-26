import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import type { CreateConversationInput, CreateMessageInput } from '../validators/conversation.validators';

// POST /api/conversations
export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { documentId, title } = req.body as CreateConversationInput;

  // Verify document belongs to the user
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
    select: { id: true, title: true },
  });

  if (!document) {
    throw new AppError('Document not found.', 404);
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      documentId,
      title: title ?? `Chat about "${document.title}"`,
    },
    include: { document: { select: { id: true, title: true } } },
  });

  successResponse(res, conversation, 201);
});

// GET /api/conversations
export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      document: { select: { id: true, title: true } },
      _count: { select: { messages: true } },
    },
  });

  successResponse(res, conversations);
});

// GET /api/conversations/:id
export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      document: { select: { id: true, title: true } },
    },
  });

  if (!conversation) {
    throw new AppError('Conversation not found.', 404);
  }

  successResponse(res, conversation);
});

// DELETE /api/conversations/:id
export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conversation) {
    throw new AppError('Conversation not found.', 404);
  }

  await prisma.conversation.delete({ where: { id } });

  successResponse(res, { message: 'Conversation deleted successfully.' });
});

// GET /api/conversations/:id/messages
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params as { id: string };

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conversation) {
    throw new AppError('Conversation not found.', 404);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });

  successResponse(res, messages);
});

// POST /api/conversations/:id/messages
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id: conversationId } = req.params as { id: string };
  const { content } = req.body as CreateMessageInput;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { document: { select: { id: true, title: true, status: true } } },
  });

  if (!conversation) {
    throw new AppError('Conversation not found.', 404);
  }

  if (conversation.document.status !== 'PROCESSED') {
    throw new AppError(
      'Document is still being processed. Please wait a moment before asking questions.',
      422
    );
  }

  // Save the user's message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'USER',
      content,
    },
  });

  // Lazy-load the RAG service so AI libraries are only loaded when needed
  const { ragService } = await import('../services/rag/rag.service');
  const { answer, sources } = await ragService.answerQuestion(
    conversation.document.id,
    conversationId,
    content
  );

  // Save the assistant's response
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: answer,
      sources: sources as unknown as import('@prisma/client').Prisma.InputJsonValue,
    },
  });

  // Bump updatedAt on the conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  successResponse(res, assistantMessage, 201);
});

