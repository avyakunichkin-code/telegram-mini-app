import { apiCall } from './client.js';

export const investApi = {
  listInvestPositions() {
    return apiCall('/api/invest/positions');
  },
  openDeposit(payload) {
    return apiCall('/api/invest/deposit/open', 'POST', payload);
  },
  buyBond(payload) {
    return apiCall('/api/invest/bond/buy', 'POST', payload);
  },
  closeInvestPosition(id) {
    return apiCall(`/api/invest/positions/${id}/close`, 'POST');
  },
};
