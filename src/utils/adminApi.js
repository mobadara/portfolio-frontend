const ADMIN_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

export const ADMIN_ROUTES = {
  login: import.meta?.env?.VITE_ADMIN_LOGIN_ENDPOINT || '/admin/login',
  overview: import.meta?.env?.VITE_ADMIN_OVERVIEW_ENDPOINT || '/admin/overview',
  changePassword: import.meta?.env?.VITE_ADMIN_CHANGE_PASSWORD_ENDPOINT || '/admin/change-password',
  users: import.meta?.env?.VITE_ADMIN_USERS_ENDPOINT || '/admin/users',
  messages: import.meta?.env?.VITE_ADMIN_MESSAGES_ENDPOINT || '/admin/contact-messages',
  contactCreate: import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact',
  projects: import.meta?.env?.VITE_ADMIN_PROJECTS_ENDPOINT || '/admin/projects',
  skills: import.meta?.env?.VITE_ADMIN_SKILLS_ENDPOINT || '/admin/skills',
  publicSkills: import.meta?.env?.VITE_PUBLIC_SKILLS_ENDPOINT || '/api/skills',
  uploadResume: import.meta?.env?.VITE_ADMIN_UPLOAD_RESUME_ENDPOINT || '/admin/upload/resume',
  uploadPortrait: import.meta?.env?.VITE_ADMIN_UPLOAD_PORTRAIT_ENDPOINT || '/admin/upload/portrait',
  resumeAsset: import.meta?.env?.VITE_RESUME_ASSET_ENDPOINT || '/api/assets/resume',
  portraitAsset: import.meta?.env?.VITE_PORTRAIT_ASSET_ENDPOINT || '/api/assets/portrait',
  sessions: import.meta?.env?.VITE_ADMIN_SESSIONS_ENDPOINT || '/admin/sessions',
  chatSessions: import.meta?.env?.VITE_ADMIN_CHAT_SESSIONS_ENDPOINT || '/admin/chat_sessions',
  pingUser: import.meta?.env?.VITE_ADMIN_PING_USER_ENDPOINT || '/admin/chat_sessions',
  deleteAllChatSessions: import.meta?.env?.VITE_ADMIN_DELETE_ALL_CHAT_SESSIONS_ENDPOINT || '/admin/chat_sessions/delete-all',
  deleteAllMessages: import.meta?.env?.VITE_ADMIN_DELETE_ALL_MESSAGES_ENDPOINT || '/admin/contact-messages/delete-all',
  deleteAllProjects: import.meta?.env?.VITE_ADMIN_DELETE_ALL_PROJECTS_ENDPOINT || '/admin/projects/delete-all'
};

export const buildAdminUrl = (endpoint = '') => `${ADMIN_API_BASE}${endpoint}`;

export const buildAdminWebSocketUrl = (endpoint = '') => {
  return toWebSocketUrl(buildAdminUrl(endpoint));
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
