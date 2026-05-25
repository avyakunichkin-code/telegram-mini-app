import { apiCall } from './client.js';

export const adminApi = {
  watchtower(params = {}) {
    const qs = new URLSearchParams();
    if (params.user_limit) qs.set('user_limit', String(params.user_limit));
    if (params.profile_limit) qs.set('profile_limit', String(params.profile_limit));
    if (params.notification_limit) qs.set('notification_limit', String(params.notification_limit));
    const query = qs.toString();
    return apiCall(`/api/admin/watchtower${query ? `?${query}` : ''}`);
  },
};
