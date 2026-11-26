import api from './api';
import type { ApiResponse, Conversation, Message } from '../types';

export const conversationService = {
  async create(documentId: string, title?: string): Promise<Conversation> {
    const { data } = await api.post<ApiResponse<Conversation>>('/conversations', {
      documentId,
      title,
    });
    return data.data;
  },

  async list(): Promise<Conversation[]> {
    const { data } = await api.get<ApiResponse<Conversation[]>>('/conversations');
    return data.data;
  },

  async get(id: string): Promise<Conversation> {
    const { data } = await api.get<ApiResponse<Conversation>>(`/conversations/${id}`);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  async getMessages(id: string): Promise<Message[]> {
    const { data } = await api.get<ApiResponse<Message[]>>(`/conversations/${id}/messages`);
    return data.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const { data } = await api.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return data.data;
  },
};

