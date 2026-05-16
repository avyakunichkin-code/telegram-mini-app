// src/api.js
const API_BASE = import.meta.env.DEV ? '' : 'https://telegram-mini-app-zwfs.onrender.com';

let authToken = localStorage.getItem('tg_miniapp_token');

export function setAuthToken(token) {
    authToken = token;
    if (token) localStorage.setItem('tg_miniapp_token', token);
    else localStorage.removeItem('tg_miniapp_token');
}

/**
 * Одна строка для UI/тостов: FastAPI часто возвращает `detail` строкой или массивом `{ msg, loc… }`.
 */
export function formatApiErrorDetail(detail, fallback = 'Ошибка запроса') {
  if (detail == null || detail === '') return fallback;
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'number' || typeof detail === 'boolean') return String(detail);
  if (Array.isArray(detail)) {
    const lines = [];
    for (const item of detail) {
      if (item == null) continue;
      if (typeof item === 'string') lines.push(item);
      else if (typeof item === 'object' && typeof item.msg === 'string') lines.push(item.msg);
      else if (typeof item === 'object' && typeof item.message === 'string') lines.push(item.message);
    }
    if (lines.length) return lines.join(' ');
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  if (typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    if (typeof detail.message === 'string') return detail.message;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export class ApiError extends Error {
  constructor({ status, detail, raw, endpoint, method }) {
    super(typeof detail === 'string' ? detail : formatApiErrorDetail(detail, 'Ошибка запроса'));
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.raw = raw;
    this.endpoint = endpoint;
    this.method = method;
  }
}

async function apiCall(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  // Пытаемся распарсить тело ответа (может быть JSON или текст)
  let responseBody;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      detail: responseBody?.detail || responseBody?.message || responseBody,
      raw: responseBody,
      endpoint,
      method,
    });
  }

  return responseBody;
}

export const API = {
    register(data) { return apiCall('/api/register', 'POST', data); },
    login(data) { return apiCall('/api/login', 'POST', data); },
    getMe() { return apiCall('/api/user/me'); },
    // остальные методы добавим позже
    // Игровые профили
    getGameProfiles() {
        return apiCall('/api/game/profiles');
    },
    createGameProfile(payload) {
        return apiCall('/api/game/profiles', 'POST', payload);
    },
    activateGameProfile(id) {
        return apiCall(`/api/game/profiles/${id}/activate`, 'POST');
    },
    listGameTemplates() {
        return apiCall('/api/game/templates');
    },
    startNewGame(payload) {
        return apiCall('/api/game/start', 'POST', payload);
    },
    // Время
    getTimeStatus() {
        return apiCall('/api/game/time');
    },
    setTimePlay() {
        return apiCall('/api/game/time/play', 'POST');
    },
    setTimePause() {
        return apiCall('/api/game/time/pause', 'POST');
    },
    setTimeNext() {
        return apiCall('/api/game/time/next', 'POST');
    },
    // Период
    getPeriodStatus() {
        return apiCall('/api/game/period/status');
    },
    // События
    getPendingEvent() {
        return apiCall('/api/game/events/pending');
    },
    chooseEvent(eventId, choiceId) {
        return apiCall(`/api/game/events/${eventId}/choose`, 'POST', { choice_id: choiceId });
    },
    // Финансы
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
    // Инвестиции
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
    // Страховки
    listPolicies() {
        return apiCall('/api/insurance/policies');
    },
    buyPolicy(payload) {
        return apiCall('/api/insurance/buy', 'POST', payload);
    },
    cancelPolicy(id) {
        return apiCall(`/api/insurance/${id}/cancel`, 'POST');
    },
    claimSalary() {
        return apiCall('/api/game/period/claim-salary', 'POST');
    },
    contributeToSafetyFund(payload) {
        return apiCall('/api/game/period/contribute-to-safety-fund', 'POST', payload);
    },
    withdrawFromSafetyFund(payload) {
        return apiCall('/api/game/period/withdraw-from-safety-fund', 'POST', payload);
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