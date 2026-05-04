// src/api.js
const API_BASE = import.meta.env.DEV ? '' : 'https://telegram-mini-app-zwfs.onrender.com';

let authToken = localStorage.getItem('tg_miniapp_token');

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('tg_miniapp_token', token);
  else localStorage.removeItem('tg_miniapp_token');
}

async function apiCall(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (response.status === 401) {
    setAuthToken(null);
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export const API = {
  register(data) { return apiCall('/api/register', 'POST', data); },
  login(data) { return apiCall('/api/login', 'POST', data); },
  getMe() { return apiCall('/api/user/me'); },
  // остальные методы добавим позже
};