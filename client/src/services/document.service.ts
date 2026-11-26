import api from './api';
import type { ApiResponse, Document, DocumentSummary } from '../types';

export const documentService = {
  async upload(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ApiResponse<Document>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });

    return data.data;
  },

  async list(): Promise<Document[]> {
    const { data } = await api.get<ApiResponse<Document[]>>('/documents');
    return data.data;
  },

  async get(id: string): Promise<Document> {
    const { data } = await api.get<ApiResponse<Document>>(`/documents/${id}`);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async summarize(id: string): Promise<DocumentSummary> {
    const { data } = await api.post<ApiResponse<DocumentSummary>>(`/documents/${id}/summary`);
    return data.data;
  },
};

