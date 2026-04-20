const ADMIN_NOTIFICATION_STORAGE_KEY = 'adminNotifications';

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    return fallback;
  }
};

export const getStoredAdminNotifications = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(ADMIN_NOTIFICATION_STORAGE_KEY) || '[]', []);
};

export const saveAdminNotifications = (notifications = []) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
};

export const clearAdminNotifications = () => saveAdminNotifications([]);

export const buildAdminNotifications = ({ messages = [], sessions = [] } = {}) => {
  const notifications = [];

  messages
    .filter((message) => String(message?.status || '').toLowerCase() === 'new')
    .slice(0, 5)
    .forEach((message) => {
      const id = `message-${message.id || message._id}`;
      notifications.push({
        id,
        type: 'message',
        title: 'New contact message',
        body: `${message.name || 'Visitor'}: ${String(message.subject || message.message || '').slice(0, 72)}`,
        created_at: message.created_at || new Date().toISOString(),
        href: '/admin/messages',
      });
    });

  sessions
    .filter((session) => Boolean(session?.human_mode) || Number(session?.message_count || 0) > 0)
    .slice(0, 5)
    .forEach((session) => {
      const id = `session-${session.session_id}`;
      notifications.push({
        id,
        type: session.human_mode ? 'human-handoff' : 'session',
        title: session.human_mode ? 'Human handoff active' : 'Active chat session',
        body: `${session.user_name || 'Anonymous'} · ${Number(session.message_count || 0)} messages`,
        created_at: session.last_activity || session.created_at || new Date().toISOString(),
        href: `/admin/chat/${session.session_id}`,
      });
    });

  return notifications;
};

export const mergeAdminNotifications = (existing = [], next = []) => {
  const lookup = new Map();

  [...existing, ...next].forEach((item) => {
    if (!item?.id) return;
    lookup.set(item.id, item);
  });

  return Array.from(lookup.values()).sort((left, right) => {
    const leftTime = new Date(left.created_at || 0).getTime();
    const rightTime = new Date(right.created_at || 0).getTime();
    return rightTime - leftTime;
  });
};

export const notifyAdminBridge = (notification) => {
  if (typeof window === 'undefined' || !notification) return;
  window.dispatchEvent(new CustomEvent('admin-notification', { detail: notification }));
};