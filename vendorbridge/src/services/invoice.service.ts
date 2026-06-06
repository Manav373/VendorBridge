import api from './api';

export interface Invoice {
  id: string;
  invoice_number: string;
  po_id?: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_email?: string;
  po_number?: string;
  status: string;
  invoice_date: string;
  due_date: string;
  subtotal: number | string;
  tax_percent: number;
  tax_amount: number | string;
  discount: number | string;
  grand_total: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  bill_to?: string;
  notes?: string;
  payment_terms?: string;
  paid_at?: string;
  items?: any[];
}

export const invoiceService = {
  async getInvoices(params: any = {}) {
    const res: any = await api.get('/invoices', { params });
    return res;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const res: any = await api.get(`/invoices/${id}`);
    return res.data;
  },

  async createInvoice(data: any): Promise<Invoice> {
    const res: any = await api.post('/invoices', data);
    return res.data;
  },

  async updateInvoiceStatus(id: string, status: string, paidAmount?: number): Promise<Invoice> {
    const res: any = await api.patch(`/invoices/${id}/status`, { status, paidAmount });
    return res.data;
  },

  async getInvoiceByPO(poId: string): Promise<Invoice> {
    const res: any = await api.get(`/invoices/po/${poId}`);
    return res.data;
  }
};
