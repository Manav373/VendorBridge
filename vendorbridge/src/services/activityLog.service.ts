import api from './api';

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  module: string;
  action: string;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  metadata?: any;
  created_at: string;
}

export const activityLogService = {
  async getLogs(params: any = {}) {
    const res: any = await api.get('/activity-logs', { params });
    return res;
  },

  async getModuleLogs(module: string, params: any = {}) {
    const res: any = await api.get(`/activity-logs/module/${module}`, { params });
    return res;
  },

  async getUserLogs(userId: string, params: any = {}) {
    const res: any = await api.get(`/activity-logs/user/${userId}`, { params });
    return res;
  }
};
