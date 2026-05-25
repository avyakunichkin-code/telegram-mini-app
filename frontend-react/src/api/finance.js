import { apiCall } from './client.js';

export const financeApi = {
  getOverview() {
    return apiCall('/api/finance/overview');
  },
  getFinanceAnalyticsTimeseries(limit = 48) {
    const q = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    return apiCall(`/api/finance/analytics/timeseries${q}`);
  },
  getAssetTemplates() {
    return apiCall('/api/finance/asset-templates');
  },
  getLiabilityTemplates() {
    return apiCall('/api/finance/liability-templates');
  },
  createAssetFromTemplate(key) {
    return apiCall('/api/finance/assets/from-template', 'POST', { key });
  },
  createLiabilityFromTemplate(key) {
    return apiCall('/api/finance/liabilities/from-template', 'POST', { key });
  },
  addLiability(payload) {
    return apiCall('/api/finance/liabilities', 'POST', payload);
  },
  deleteLiability(id) {
    return apiCall(`/api/finance/liabilities/${id}`, 'DELETE');
  },
  addAsset(payload) {
    return apiCall('/api/finance/assets', 'POST', payload);
  },
  deleteAsset(id) {
    return apiCall(`/api/finance/assets/${id}`, 'DELETE');
  },
};
