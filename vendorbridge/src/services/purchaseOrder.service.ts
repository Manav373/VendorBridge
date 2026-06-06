import api from './api';

export interface POItem {
  id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  rfq_id?: string;
  quotation_id?: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_address?: string;
  vendor_gst?: string;
  bill_to?: string;
  ship_to?: string;
  status: string;
  order_date: string;
  delivery_date?: string;
  due_date?: string;
  subtotal: number | string;
  tax_amount: number | string;
  tax_percent: number;
  shipping: number | string;
  grand_total: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  notes?: string;
  terms?: string;
  items?: POItem[];
}

export const purchaseOrderService = {
  async getPOs(params: any = {}) {
    const res: any = await api.get('/purchase-orders', { params });
    return res; // returns { data: { purchaseOrders, pagination } }
  },

  async getPOById(id: string): Promise<PurchaseOrder> {
    const res: any = await api.get(`/purchase-orders/${id}`);
    return res.data;
  },

  async createPO(data: any): Promise<PurchaseOrder> {
    const res: any = await api.post('/purchase-orders', data);
    return res.data;
  },

  async updatePO(id: string, data: any): Promise<PurchaseOrder> {
    const res: any = await api.put(`/purchase-orders/${id}`, data);
    return res.data;
  },

  async updatePOStatus(id: string, status: string): Promise<PurchaseOrder> {
    const res: any = await api.patch(`/purchase-orders/${id}/status`, { status });
    return res.data;
  },

  async sendEmail(id: string): Promise<void> {
    await api.post(`/purchase-orders/${id}/send-email`);
  }
};
