import api from './api';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  company?: string;
  department?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export const authService = {
  async login(credentials: any) {
    const res: any = await api.post('/auth/login', credentials);
    return res; // contains data: { user, accessToken, refreshToken }
  },

  async signup(data: any) {
    const res: any = await api.post('/auth/signup', data);
    return res; // contains data: { user, accessToken, refreshToken }
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getProfile(): Promise<UserProfile> {
    const res: any = await api.get('/auth/profile');
    return res.data;
  },

  async updateProfile(data: any): Promise<UserProfile> {
    const res: any = await api.put('/auth/profile', data);
    return res.data;
  },

  async changePassword(data: any) {
    return api.post('/auth/change-password', data);
  },

  async forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: any) {
    return api.post('/auth/reset-password', data);
  }
};
