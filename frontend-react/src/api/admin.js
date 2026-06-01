import { apiCall } from './client.js';

export const adminApi = {
  profileDetail(profileId, params = {}) {
    const qs = new URLSearchParams();
    if (params.log_limit) qs.set('log_limit', String(params.log_limit));
    if (params.closing_limit) qs.set('closing_limit', String(params.closing_limit));
    const query = qs.toString();
    return apiCall(
      `/api/admin/profiles/${encodeURIComponent(String(profileId))}${query ? `?${query}` : ''}`,
    );
  },

  metricsSummary(params = {}) {
    const qs = new URLSearchParams();
    if (params.days) qs.set('days', String(params.days));
    const query = qs.toString();
    return apiCall(`/api/admin/metrics/summary${query ? `?${query}` : ''}`);
  },

  watchtower(params = {}) {
    const qs = new URLSearchParams();
    if (params.user_limit) qs.set('user_limit', String(params.user_limit));
    if (params.profile_limit) qs.set('profile_limit', String(params.profile_limit));
    if (params.notification_limit) qs.set('notification_limit', String(params.notification_limit));
    const query = qs.toString();
    return apiCall(`/api/admin/watchtower${query ? `?${query}` : ''}`);
  },

  catalogs() {
    return apiCall('/api/admin/catalogs');
  },

  catalogRows(catalogKey, params = {}) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.active_only) qs.set('active_only', 'true');
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiCall(
      `/api/admin/catalogs/${encodeURIComponent(catalogKey)}/rows${query ? `?${query}` : ''}`,
    );
  },
};
