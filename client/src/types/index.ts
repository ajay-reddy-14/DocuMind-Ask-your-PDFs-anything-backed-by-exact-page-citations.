// Shared TypeScript types shared across the frontend

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  fileSize: number;
  pageCount: number | null;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  _count?: { chunks: number; conversations: number };
}

export interface Conversation {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  document?: { id: string; title: string };
  _count?: { messages: number };
}

export interface MessageSource {
  documentTitle: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: MessageSource[] | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DocumentSummary {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
}

