import api from './api';

export interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  category: string;
  status: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  gst_number?: string;
  pan_number?: string;
  rating: number;
  total_orders: number;
  total_value: number | string;
  contact_person?: string;
  notes?: string;
  created_at: string;
}

export const vendorService = {
  async getVendors(params: any = {}) {
    const res: any = await api.get('/vendors', { params });
    return res; // returns { data: { vendors, pagination } }
  },

  async getVendorById(id: string): Promise<Vendor> {
    const res: any = await api.get(`/vendors/${id}`);
    return res.data;
  },

  async createVendor(data: any): Promise<Vendor> {
    const res: any = await api.post('/vendors', data);
    return res.data;
  },

  async updateVendor(id: string, data: any): Promise<Vendor> {
    const res: any = await api.put(`/vendors/${id}`, data);
    return res.data;
  },

  async deleteVendor(id: string) {
    return api.delete(`/vendors/${id}`);
  },

  async updateVendorStatus(id: string, status: string): Promise<Vendor> {
    const res: any = await api.patch(`/vendors/${id}/status`, { status });
    return res.data;
  },

  async getVendorCategories() {
    const res: any = await api.get('/vendors/categories');
    return res.data; // returns array of { category, count }
  },

  async getVendorStats() {
    const res: any = await api.get('/vendors/stats');
    return res.data; // returns { active, pending, inactive, suspended, total, total_value, avg_rating }
  }
};
