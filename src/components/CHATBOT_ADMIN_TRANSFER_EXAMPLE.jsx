/**
 * Example: Integrating Admin Chat Transfer from Chatbot
 * 
 * This example shows how to modify the existing Chatbot component
 * to transfer to the admin chat interface when the user asks to chat with a human.
 * 
 * IMPLEMENTATION STEPS:
 * 1. Add a state variable to track admin mode
 * 2. Listen for transfer signals from the backend
 * 3. Render AdminChat component when transferred
 * 4. Pass session ID and callbacks to AdminChat
 */

import { useState, useRef, useEffect } from 'react';
import AdminChat from './AdminChat';
import Modal from 'react-bootstrap/Modal';

/**
 * Example modification to the Chatbot component
 * Add this to your existing Chatbot.jsx
 */
export const ChatbotWithAdminTransfer = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminSessionId, setAdminSessionId] = useState(null);

  // Add this to your existing message handler in Chatbot
  // Note: This is an example function definition - use in your actual implementation
  // eslint-disable-next-line no-unused-vars
  const handleBotMessageResponse = (message) => {
    // Check if the backend indicates a transfer to human
    // This depends on your backend's implementation
    
    if (message.includes('connecting you with') || 
        message.type === 'transfer_to_human' ||
        message.action === 'transfer_to_admin') {
      
      // Extract session ID from the message or response
      // This assumes your backend provides it
      const sessionId = extractSessionIdFromMessage(message);
      
      if (sessionId) {
        setAdminSessionId(sessionId);
        setIsAdminMode(true);
      }
    }
  };

  const extractSessionIdFromMessage = (message) => {
    // Parse session ID from backend response
    // Format: session_TIMESTAMP_RANDOMID
    const match = message.match?.(/session_\d+_[a-z0-9]+/);
    return match ? match[0] : null;
  };

  const handleAdminChatClose = () => {
    setIsAdminMode(false);
    setAdminSessionId(null);
    // Optionally navigate back or show message
  };

  // If in admin mode, show the admin chat interface
  if (isAdminMode && adminSessionId) {
    return (
      <Modal show={isAdminMode} onHide={handleAdminChatClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Connected with Support</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '600px' }}>
          <AdminChat 
            sessionId={adminSessionId}
            onClose={handleAdminChatClose}
          />
        </Modal.Body>
      </Modal>
    );
  }

  // Otherwise show the regular chatbot
  // ... rest of Chatbot component
};

/**
 * BACKEND PROTOCOL EXAMPLE
 * 
 * When bot decides to transfer to human, send:
 * 
 * {
 *   "type": "transfer_to_human",
 *   "session_id": "session_1770560465255_fd0jqhg7r",
 *   "message": "I'm connecting you with Muyiwa now. He'll be with you shortly! 👋"
 * }
 * 
 * Or in plain text:
 * "I'm connecting you with Muyiwa now. He'll be with you shortly! 👋 
 *  Session: session_1770560465255_fd0jqhg7r"
 */

/**
 * ALTERNATIVE: Using a separate admin session route
 * 
 * Instead of modal, you could redirect to a dedicated page:
 */
import { useNavigate } from 'react-router-dom';

export const ChatbotWithRouting = () => {
  const navigate = useNavigate();

  // Use in your message handler to navigate to admin chat:
  // eslint-disable-next-line no-unused-vars
  const handleTransferToAdmin = (sessionId) => {
    navigate(`/admin/chat/${sessionId}`);
  };

  // This function is used in your message handler like:
  // handleTransferToAdmin(extractedSessionId);
  return null;
};

/**
 * FULL EXAMPLE: ChatbotWithAdminSupport
 * 
 * A complete example component showing everything together
 */

export const ChatbotWithAdminSupport = () => {
  // eslint-disable-next-line no-unused-vars
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [messages, setMessages] = useState([]);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [adminSessionId, setAdminSessionId] = useState(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);

  const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

  // Initialize WebSocket
  useEffect(() => {
    if (!isOpen || webSocketRef.current) return;

    let sessionId = localStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatSessionId', sessionId);
    }
    sessionIdRef.current = sessionId;

    const wsBase = CHAT_API_BASE.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/chat/${sessionId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const data = event.data;
        
        // Check if this is a transfer to human
        if (data.includes('connecting you') || data.includes('human')) {
          // Extract session ID from message or use current session
          setAdminSessionId(sessionId);
          setShowAdminChat(true);
          return;
        }

        // Regular bot message
        const botMsg = {
          id: Date.now(),
          text: data,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botMsg]);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      webSocketRef.current = ws;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }, [isOpen, CHAT_API_BASE]);

  const handleAdminChatClose = () => {
    setShowAdminChat(false);
    setAdminSessionId(null);
    // Close the main chatbot too if desired
    // setIsOpen(false);
  };

  // Show admin chat if transferred
  if (showAdminChat && adminSessionId) {
    return (
      <Modal show={showAdminChat} onHide={handleAdminChatClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Support Session</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '600px' }}>
          <AdminChat 
            sessionId={adminSessionId}
            onClose={handleAdminChatClose}
          />
        </Modal.Body>
      </Modal>
    );
  }

  // Show regular chatbot otherwise
  // ... render chatbot UI
  return <div>Chatbot UI here...</div>;
};

export default ChatbotWithAdminSupport;
