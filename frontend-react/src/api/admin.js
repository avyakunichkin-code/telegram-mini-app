import { apiCall } from './client.js';

const API_BASE =
  import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL || 'https://telegram-mini-app-zwfs.onrender.com')
        .trim()
        .replace(/\/$/, '') || 'https://telegram-mini-app-zwfs.onrender.com';

async function downloadAdminCsv(path, filename, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') qs.set(key, String(value));
  });
  const query = qs.toString();
  const token = localStorage.getItem('tg_miniapp_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}${query ? `?${query}` : ''}`, { headers });
  if (!response.ok) {
    let detail = 'Не удалось скачать CSV';
    try {
      const body = await response.json();
      detail = body?.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : 'Не удалось скачать CSV');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
    if (params.q) qs.set('q', params.q);
    if (params.profile_filter) qs.set('profile_filter', params.profile_filter);
    if (params.stuck_only) qs.set('stuck_only', 'true');
    const query = qs.toString();
    return apiCall(`/api/admin/watchtower${query ? `?${query}` : ''}`);
  },

  exportProfilesCsv(params = {}) {
    return downloadAdminCsv('/api/admin/export/profiles.csv', 'profiles.csv', params);
  },

  exportRunFeedbackCsv(params = {}) {
    return downloadAdminCsv('/api/admin/export/run-feedback.csv', 'run-feedback.csv', params);
  },

  catalogs() {
    return apiCall('/api/admin/catalogs');
  },

  users(params = {}) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiCall(`/api/admin/users${query ? `?${query}` : ''}`);
  },

  profiles(params = {}) {
    const qs = new URLSearchParams();
    if (params.user_id) qs.set('user_id', String(params.user_id));
    if (params.q) qs.set('q', params.q);
    if (params.profile_filter) qs.set('profile_filter', params.profile_filter);
    if (params.stuck_only) qs.set('stuck_only', 'true');
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiCall(`/api/admin/profiles${query ? `?${query}` : ''}`);
  },

  catalogCreate(catalogKey, body = {}) {
    return apiCall(`/api/admin/catalogs/${encodeURIComponent(catalogKey)}/rows`, 'POST', body);
  },

  eventChoices(eventId) {
    return apiCall(`/api/admin/catalogs/events/rows/${encodeURIComponent(String(eventId))}/choices`);
  },

  eventChoiceCreate(eventId, body) {
    return apiCall(
      `/api/admin/catalogs/events/rows/${encodeURIComponent(String(eventId))}/choices`,
      'POST',
      body,
    );
  },

  eventChoicePatch(eventId, choiceId, body) {
    return apiCall(
      `/api/admin/catalogs/events/rows/${encodeURIComponent(String(eventId))}/choices/${encodeURIComponent(String(choiceId))}`,
      'PATCH',
      body,
    );
  },

  eventChoiceDelete(eventId, choiceId) {
    return apiCall(
      `/api/admin/catalogs/events/rows/${encodeURIComponent(String(eventId))}/choices/${encodeURIComponent(String(choiceId))}`,
      'DELETE',
    );
  },

  catalogDetail(catalogKey, rowId) {
    return apiCall(
      `/api/admin/catalogs/${encodeURIComponent(catalogKey)}/rows/${encodeURIComponent(String(rowId))}`,
    );
  },

  catalogPatch(catalogKey, rowId, body) {
    return apiCall(
      `/api/admin/catalogs/${encodeURIComponent(catalogKey)}/rows/${encodeURIComponent(String(rowId))}`,
      'PATCH',
      body,
    );
  },

  catalogClone(catalogKey, rowId) {
    return apiCall(
      `/api/admin/catalogs/${encodeURIComponent(catalogKey)}/rows/${encodeURIComponent(String(rowId))}/clone`,
      'POST',
      {},
    );
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
