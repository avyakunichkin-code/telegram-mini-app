import { apiCall } from './client.js';

export const authApi = {
  register(data) {
    return apiCall('/api/register', 'POST', data);
  },
  login(data) {
    return apiCall('/api/login', 'POST', data);
  },
  getMe() {
    return apiCall('/api/user/me');
  },
};
