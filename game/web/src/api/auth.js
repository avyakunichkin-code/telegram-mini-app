import { apiCall } from './client.js';

export const authApi = {
  register(data) {
    return apiCall('/api/register', 'POST', data);
  },
  login(data) {
    return apiCall('/api/login', 'POST', data);
  },
  guestSession(resumeOnly = false) {
    return apiCall(`/api/auth/guest${resumeOnly ? '?resume_only=true' : ''}`, 'POST', null, {
      credentials: 'include', token: null,
    });
  },
  claimGuest(data) {
    return apiCall('/api/auth/guest/claim', 'POST', data, { credentials: 'include' });
  },
  getMe() {
    return apiCall('/api/user/me');
  },
};
