import api from './api';

export interface ApprovalTimelineStep {
  id: string;
  step_name: string;
  step_status: string;
  actioned_by?: string;
  actioned_by_name?: string;
  remarks?: string;
  actioned_at?: string;
}

export interface Approval {
  id: string;
  approval_number: string;
  rfq_id?: string;
  quotation_id?: string;
  po_number?: string;
  title: string;
  description?: string;
  amount?: number | string;
  status: string;
  priority: string;
  requested_by: string;
  requested_by_name?: string;
  current_approver?: string;
  remarks?: string;
  created_at: string;
  timeline?: ApprovalTimelineStep[];
}

export const approvalService = {
  async getApprovals(params: any = {}) {
    const res: any = await api.get('/approvals', { params });
    return res; // returns { data: { approvals, pagination } }
  },

  async getApprovalById(id: string): Promise<Approval> {
    const res: any = await api.get(`/approvals/${id}`);
    return res.data;
  },

  async createApproval(data: any): Promise<Approval> {
    const res: any = await api.post('/approvals', data);
    return res.data;
  },

  async approveRequest(id: string, remarks?: string): Promise<Approval> {
    const res: any = await api.post(`/approvals/${id}/approve`, { remarks });
    return res.data;
  },

  async rejectRequest(id: string, remarks?: string): Promise<Approval> {
    const res: any = await api.post(`/approvals/${id}/reject`, { remarks });
    return res.data;
  }
};
