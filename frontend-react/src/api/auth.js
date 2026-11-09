import { apiCall } from './client.js';

export const authApi = {
  startGuest() {
    return apiCall('/api/auth/guest', 'POST');
  },
  resumeGuest() {
    return apiCall('/api/auth/guest?resume_only=true', 'POST');
  },
  claimGuest(data) {
    return apiCall('/api/auth/guest/claim', 'POST', data);
  },
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
