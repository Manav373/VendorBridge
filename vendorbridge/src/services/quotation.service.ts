import api from './api';

export interface QuotationItem {
  id?: string;
  rfq_item_id: string;
  item_name: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  rfq_id: string;
  rfq_number?: string;
  rfq_title?: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_email?: string;
  status: string;
  total_amount: number | string;
  delivery_days: number;
  valid_until: string;
  notes?: string;
  vendor_remarks?: string;
  submitted_at?: string;
  items?: QuotationItem[];
  rating?: number;
}

export const quotationService = {
  async getQuotations(params: any = {}) {
    const res: any = await api.get('/quotations', { params });
    return res; // returns { data: { quotations, pagination } }
  },

  async getQuotationById(id: string): Promise<Quotation> {
    const res: any = await api.get(`/quotations/${id}`);
    return res.data;
  },

  async submitQuotation(data: any): Promise<Quotation> {
    const res: any = await api.post('/quotations', data);
    return res.data;
  },

  async updateQuotationStatus(id: string, status: string): Promise<Quotation> {
    const res: any = await api.patch(`/quotations/${id}/status`, { status });
    return res.data;
  },

  async getRFQQuotations(rfqId: string): Promise<Quotation[]> {
    const res: any = await api.get(`/quotations/rfq/${rfqId}`);
    return res.data;
  },

  async compareQuotations(rfqId: string) {
    const res: any = await api.get(`/quotations/rfq/${rfqId}/compare`);
    return res.data; // returns comparison insights
  }
};
