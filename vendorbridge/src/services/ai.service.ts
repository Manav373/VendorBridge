import api from './api';

export const aiService = {
  async getVendorRecommendation(rfqId: string) {
    const res: any = await api.post('/ai/vendor-recommendation', { rfqId });
    return res.data;
  },

  async analyzeQuotations(rfqId: string) {
    const res: any = await api.post('/ai/quotation-analysis', { rfqId });
    return res.data;
  },

  async getProcurementInsights() {
    const res: any = await api.post('/ai/procurement-insights');
    return res.data;
  },

  async chatWithAssistant(message: string, history: any[] = []) {
    const res: any = await api.post('/ai/chat', { message, history });
    return res.data;
  },

  async getSmartNotifications() {
    const res: any = await api.get('/ai/smart-notifications');
    return res.data;
  }
};
