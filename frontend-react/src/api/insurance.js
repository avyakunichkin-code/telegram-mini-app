import { apiCall } from './client.js';

export const insuranceApi = {
  getInsuranceCatalog() {
    return apiCall('/api/insurance/catalog');
  },
  listPolicies() {
    return apiCall('/api/insurance/policies');
  },
  buyPolicy(payload) {
    return apiCall('/api/insurance/buy', 'POST', payload);
  },
  cancelPolicy(id) {
    return apiCall(`/api/insurance/${id}/cancel`, 'POST');
  },
};
