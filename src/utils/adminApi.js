const ADMIN_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

export const buildAdminUrl = (endpoint = '') => `${ADMIN_API_BASE}${endpoint}`;

export const buildAdminWebSocketUrl = (endpoint = '') => {
  const baseUrl = ADMIN_API_BASE.replace(/^https?:/, '').replace(/\/$/, '');
  return `${buildAdminUrl(endpoint).replace(/^https?:/, 'wss:').replace(/^http?:/, 'ws:')}`;
};

export const withAuthHeaders = (token, headers = {}) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...headers
});

export const getStoredAdminToken = () => localStorage.getItem('adminToken') || '';

export const getStoredAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem('adminUser') || '{}');
  } catch {
    return {};
  }
};

export const saveAdminAuth = (payload = {}) => {
  if (payload?.token) {
    localStorage.setItem('adminToken', payload.token);
  }

  if (payload?.user) {
    localStorage.setItem('adminUser', JSON.stringify(payload.user));
  }
};

export const clearAdminAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export const toWebSocketUrl = (input = '') => {
  if (!input) return '';

  if (input.startsWith('ws://') || input.startsWith('wss://')) {
    return input;
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
  }

  const base = ADMIN_API_BASE.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');

  if (input.startsWith('/')) {
    return `${base}${input}`;
  }

  return `${base}/${input}`;
};
