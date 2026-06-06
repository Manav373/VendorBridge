import api from './api';

export interface RFQItem {
  id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  deadline: string;
  estimated_value?: number | string;
  created_by: string;
  created_at: string;
  items?: RFQItem[];
  vendorCount?: number;
  itemCount?: number;
}

export const rfqService = {
  async getRFQs(params: any = {}) {
    const res: any = await api.get('/rfqs', { params });
    return res; // returns { data: { rfqs, pagination } }
  },

  async getRFQById(id: string): Promise<RFQ> {
    const res: any = await api.get(`/rfqs/${id}`);
    return res.data;
  },

  async createRFQ(data: any): Promise<RFQ> {
    const res: any = await api.post('/rfqs', data);
    return res.data;
  },

  async updateRFQ(id: string, data: any): Promise<RFQ> {
    const res: any = await api.put(`/rfqs/${id}`, data);
    return res.data;
  },

  async deleteRFQ(id: string) {
    return api.delete(`/rfqs/${id}`);
  },

  async assignVendors(id: string, vendorIds: string[]) {
    const res: any = await api.post(`/rfqs/${id}/assign-vendors`, { vendorIds });
    return res.data;
  },

  async updateRFQStatus(id: string, status: string): Promise<RFQ> {
    const res: any = await api.patch(`/rfqs/${id}/status`, { status });
    return res.data;
  },

  async uploadAttachment(id: string, formData: FormData) {
    const res: any = await api.post(`/rfqs/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }
};
