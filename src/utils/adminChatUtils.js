/**
 * Admin Chat Utilities
 * Helper functions for managing chat sessions and WebSocket connections
 */

const API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Fetch active chat sessions for the admin
 * @returns {Promise<Array>} Array of active chat sessions
 */
export const fetchActiveSessions = async () => {
  try {
    const response = await fetch(`${API_BASE}/admin/sessions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }
};

/**
 * Fetch detailed information about a specific chat session
 * @param {string} sessionId - The session ID to fetch
 * @returns {Promise<Object>} Session data including messages and WebSocket config
 */
export const fetchSessionData = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE}/admin/chat_sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching session data:', error);
    throw error;
  }
};

/**
 * Close a chat session (end the conversation)
 * @param {string} sessionId - The session ID to close
 * @returns {Promise<Object>} Response from server
 */
export const closeSession = async (sessionId) => {
  try {
    const response = await fetch(
      `${API_BASE}/admin/chat_sessions/${sessionId}/close`,
      { method: 'POST' }
    );
    if (!response.ok) {
      throw new Error(`Failed to close session: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error closing session:', error);
    throw error;
  }
};

/**
 * Transfer session back to bot
 * @param {string} sessionId - The session ID to transfer
 * @returns {Promise<Object>} Response from server
 */
export const transferToBot = async (sessionId) => {
  try {
    const response = await fetch(
      `${API_BASE}/admin/chat_sessions/${sessionId}/transfer-to-bot`,
      { method: 'POST' }
    );
    if (!response.ok) {
      throw new Error(`Failed to transfer to bot: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error transferring to bot:', error);
    throw error;
  }
};

/**
 * Send a message to the WebSocket
 * @param {WebSocket} ws - The WebSocket connection
 * @param {string} content - Message content
 * @param {string} role - Sender role (usually 'admin')
 */
export const sendWebSocketMessage = (ws, content, role = 'admin') => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      content,
      role
    }));
    return true;
  }
  return false;
};

/**
 * Send authentication to WebSocket
 * @param {WebSocket} ws - The WebSocket connection
 * @param {string} token - Authentication token
 */
export const authenticateWebSocket = (ws, token) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'auth',
      token
    }));
    return true;
  }
  return false;
};

/**
 * Create a WebSocket connection with proper error handling
 * @param {string} url - WebSocket URL
 * @param {function} onMessage - Callback for messages
 * @param {function} onError - Callback for errors
 * @param {function} onClose - Callback for close
 * @returns {WebSocket} The WebSocket connection
 */
export const createWebSocketConnection = (url, onMessage, onError, onClose) => {
  try {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // If not JSON, treat as plain text
        onMessage({ type: 'message', content: event.data });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (onClose) onClose();
    };

    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    if (onError) onError(error);
    return null;
  }
};

/**
 * Format a timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @param {boolean} includeDate - Whether to include the date
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, includeDate = false) => {
  try {
    const date = new Date(timestamp);
    
    if (includeDate) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};

/**
 * Check if a session is still active
 * @param {Object} session - Session object
 * @returns {boolean} Whether the session is active
 */
export const isSessionActive = (session) => {
  return session.status === 'active' || session.human_mode === true;
};

/**
 * Get session status display text
 * @param {Object} session - Session object
 * @returns {string} Status display text
 */
export const getSessionStatusText = (session) => {
  if (session.human_mode) return 'In Human Mode';
  if (session.status === 'active') return 'Active';
  if (session.status === 'closed') return 'Closed';
  return 'Unknown';
};

/**
 * Calculate time elapsed since session started
 * @param {string} startTime - ISO timestamp of session start
 * @returns {string} Formatted elapsed time
 */
export const getElapsedTime = (startTime) => {
  try {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  } catch {
    return '';
  }
};

/**
 * Generate session management actions for a session
 * @param {string} sessionId - Session ID
 * @returns {Object} Object with action functions
 */
export const getSessionActions = (sessionId) => {
  return {
    close: () => closeSession(sessionId),
    transferToBot: () => transferToBot(sessionId),
    details: () => fetchSessionData(sessionId)
  };
};

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} Whether the session ID is valid
 */
export const isValidSessionId = (sessionId) => {
  // Expected format: session_{timestamp}_{random_string}
  return /^session_\d+_[a-z0-9]+$/.test(sessionId);
};

/**
 * Extract session metadata from session ID
 * @param {string} sessionId - Session ID
 * @returns {Object} Metadata object
 */
export const parseSessionId = (sessionId) => {
  const matches = sessionId.match(/^session_(\d+)_([a-z0-9]+)$/);
  if (!matches) return null;

  return {
    timestamp: parseInt(matches[1]),
    randomId: matches[2],
    createdAt: new Date(parseInt(matches[1]))
  };
};

/**
 * Build WebSocket URL from base URL and session ID
 * @param {string} baseUrl - Base WebSocket URL from API
 * @param {string} sessionId - Session ID
 * @returns {string} Full WebSocket URL
 */
export const buildWebSocketUrl = (baseUrl, sessionId) => {
  return `${baseUrl}/${sessionId}`;
};

/**
 * Handle WebSocket reconnection with exponential backoff
 * @param {function} connect - Function to call to reconnect
 * @param {number} maxAttempts - Maximum number of reconnect attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<WebSocket>} Promise that resolves when connected
 */
export const reconnectWithBackoff = async (connect, maxAttempts = 5, initialDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ws = connect();
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        await new Promise(resolve => {
          ws.onopen = () => resolve();
          setTimeout(() => resolve(), initialDelay * attempt);
        });
      }
      return ws;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Reconnect attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export default {
  fetchActiveSessions,
  fetchSessionData,
  closeSession,
  transferToBot,
  sendWebSocketMessage,
  authenticateWebSocket,
  createWebSocketConnection,
  formatTimestamp,
  isSessionActive,
  getSessionStatusText,
  getElapsedTime,
  getSessionActions,
  isValidSessionId,
  parseSessionId,
  buildWebSocketUrl,
  reconnectWithBackoff
};
