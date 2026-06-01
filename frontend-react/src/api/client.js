/** @type {string} fallback prod API (Render), пока нет VITE_API_BASE_URL в CI */
const DEFAULT_PROD_API = 'https://telegram-mini-app-zwfs.onrender.com';

function resolveApiBase() {
  if (import.meta.env.DEV) return '';
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  return fromEnv || DEFAULT_PROD_API;
}

const API_BASE = resolveApiBase();

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

export async function apiCall(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (response.status === 204) {
    return null;
  }

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
