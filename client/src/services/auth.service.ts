import api from './api';
import type { ApiResponse, User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/auth/register', {
      name,
      email,
      password,
    });
    return data.data;
  },

  async login(email: string, password: string): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/auth/login', { email, password });
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },
};

