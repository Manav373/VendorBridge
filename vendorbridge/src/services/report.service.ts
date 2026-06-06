import api from './api';

export const reportService = {
  async getDashboardStats() {
    const [dashRes, spendRes, poRes] = await Promise.all([
      api.get('/reports/dashboard').catch(() => ({ data: { data: null } })),
      api.get('/reports/spending?months=6').catch(() => ({ data: { data: null } })),
      api.get('/purchase-orders?limit=5').catch(() => ({ data: { data: null } }))
    ]);

    const d = (dashRes as any).data;
    const spend = (spendRes as any).data;
    const pos = (poRes as any).data?.purchaseOrders || (poRes as any).data?.pos || [];

    if (!d) return null;

    return {
      activeRFQs: parseInt(d.rfqs?.active || 0),
      pendingApprovals: parseInt(d.approvals?.pending || 0),
      procurementValue: parseFloat(d.purchaseOrders?.total_value || 0),
      vendorCount: parseInt(d.vendors?.total || 0),
      monthlySpend: spend?.monthlyTrend?.map((t: any) => ({
        month: t.month.split(' ')[0],
        value: parseFloat(t.spend)
      })) || [],
      categorySpend: spend?.byCategory?.map((c: any) => ({
        name: c.category,
        value: parseFloat(c.spend)
      })) || [],
      recentPOs: pos.map((p: any) => ({
        id: p.id,
        poNumber: p.po_number,
        vendorName: p.vendor_name,
        grandTotal: p.grand_total,
        status: p.status
      })) || [],
    };
  },

  async getSpendingReport(params: any = {}) {
    const res: any = await api.get('/reports/spending', { params });
    return res.data;
  },

  async getVendorPerformanceReport(params: any = {}) {
    const res: any = await api.get('/reports/vendor-performance', { params });
    return res.data;
  },

  async getMonthlyTrends(params: any = {}) {
    const res: any = await api.get('/reports/monthly-trends', { params });
    return res.data;
  },

  async getProcurementStats(params: any = {}) {
    const res: any = await api.get('/reports/procurement-stats', { params });
    return res.data;
  }
};
