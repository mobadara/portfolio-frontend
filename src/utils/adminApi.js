const ADMIN_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

export const ADMIN_ROUTES = {
  login: import.meta?.env?.VITE_ADMIN_LOGIN_ENDPOINT || '/admin/login',
  changePassword: import.meta?.env?.VITE_ADMIN_CHANGE_PASSWORD_ENDPOINT || '/admin/change-password',
  users: import.meta?.env?.VITE_ADMIN_USERS_ENDPOINT || '/admin/users',
  messages: import.meta?.env?.VITE_ADMIN_MESSAGES_ENDPOINT || '/admin/contact-messages',
  contactCreate: import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact',
  projects: import.meta?.env?.VITE_ADMIN_PROJECTS_ENDPOINT || '/admin/projects',
  sessions: import.meta?.env?.VITE_ADMIN_SESSIONS_ENDPOINT || '/admin/sessions',
  chatSessions: import.meta?.env?.VITE_ADMIN_CHAT_SESSIONS_ENDPOINT || '/admin/chat_sessions'
};

export const buildAdminUrl = (endpoint = '') => `${ADMIN_API_BASE}${endpoint}`;

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

  const base = ADMIN_API_BASE.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');

  if (input.startsWith('/')) {
    return `${base}${input}`;
  }

  return `${base}/${input}`;
};
