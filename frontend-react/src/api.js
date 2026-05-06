// src/api.js
const API_BASE = import.meta.env.DEV ? '' : 'https://telegram-mini-app-zwfs.onrender.com';

let authToken = localStorage.getItem('tg_miniapp_token');

export function setAuthToken(token) {
    authToken = token;
    if (token) localStorage.setItem('tg_miniapp_token', token);
    else localStorage.removeItem('tg_miniapp_token');
}

export class ApiError extends Error {
  constructor({ status, detail, raw, endpoint, method }) {
    super(typeof detail === 'string' ? detail : 'Ошибка запроса');
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
    // Финансы
    getOverview() {
        return apiCall('/api/finance/overview');
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