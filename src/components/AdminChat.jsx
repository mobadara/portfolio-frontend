import { useState, useEffect, useRef } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { BiSend, BiX } from 'react-icons/bi';
import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, toWebSocketUrl, withAuthHeaders } from '../utils/adminApi';

/**
 * AdminChat Component - Handles admin-to-user chat interface
 * Connects to a specific chat session via WebSocket for real-time messaging
 * 
 * @param {string} sessionId - The chat session ID to connect to
 * @param {function} onClose - Callback when admin closes the chat
 */
const AdminChat = ({ sessionId, onClose }) => {
  const token = getStoredAdminToken();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial chat session data and establish WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Step 1: Fetch session data
        const response = await fetch(
          buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`),
          {
            headers: withAuthHeaders(token)
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch session data: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'ok' && isMounted) {
          setSessionInfo(data);
          
          // Convert API messages format to display format
          const formattedMessages = data.messages.map((msg, index) => ({
            id: index,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            sender: msg.role === 'user' ? 'user' : 'admin'
          }));
          
          setMessages(formattedMessages);
          
          // Step 2: Connect to WebSocket after session data is loaded
          connectWebSocket(data.admin_websocket || data.websocket || '');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error fetching session data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load chat session');
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      // Cleanup on unmount
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [sessionId]);

  const connectWebSocket = (wsConfig) => {
    try {
      const rawUrl = typeof wsConfig === 'string' ? wsConfig : wsConfig?.url;
      let wsUrl = toWebSocketUrl(rawUrl);

      if (token && wsUrl) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}token=${encodeURIComponent(token)}`;
      }

      if (!wsUrl) {
        throw new Error('Invalid websocket URL from backend');
      }
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for admin');
        setIsConnected(true);
        setIsLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const newMessage = {
              id: Date.now(),
              role: data.role || 'user',
              content: data.content || data.message,
              timestamp: new Date().toISOString(),
              sender: data.role === 'admin' ? 'admin' : 'user'
            };
            
            setMessages(prev => [...prev, newMessage]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          // If not JSON, treat as plain text message
          const newMessage = {
            id: Date.now(),
            role: 'user',
            content: event.data,
            timestamp: new Date().toISOString(),
            sender: 'user'
          };
          setMessages(prev => [...prev, newMessage]);
        }
        
        setIsSending(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      webSocketRef.current = ws;
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      setError('Failed to connect to chat service');
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!input.trim() || !isConnected || isSending) return;

    try {
      setIsSending(true);

      // Add user message to display
      const userMessage = {
        id: Date.now(),
        role: 'admin',
        content: input,
        timestamp: new Date().toISOString(),
        sender: 'admin'
      };

      setMessages(prev => [...prev, userMessage]);

      // Send via WebSocket
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'message',
          content: input,
          role: 'admin'
        }));
      } else {
        setError('Connection lost. Please refresh the page.');
        setIsSending(false);
      }

      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="admin-chat-container">
      <Card className="h-100 border-0 overflow-hidden my-chat-card">
        
        <div className="card-header my-chat-header d-flex align-items-center justify-content-between py-2 px-3">
          <div className="d-flex align-items-center gap-2">
            <div className="my-chat-avatar">
              <i className="bi bi-person-workspace" />
            </div>
            <div>
              <h6 className="mb-0 fw-semibold">Live Support</h6>
              <small className="my-connection-text">
                {isConnected ? 'online' : 'disconnected'}
              </small>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-sm my-close-btn p-0"
            aria-label="Close chat"
          >
            <BiX size={24} />
          </button>
        </div>

        {sessionInfo && (
          <div className="my-session-meta px-3 py-2 border-bottom">
            <small className="text-muted d-flex align-items-center gap-2 flex-wrap">
              <strong>Session:</strong> {sessionId}
              {sessionInfo.human_mode && (
                <span className="badge bg-primary">HUMAN MODE</span>
              )}
            </small>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-0 rounded-0">
            <small>{error}</small>
          </Alert>
        )}

        <Card.Body className="chat-body my-chat-body p-3 overflow-auto" style={{ minHeight: '420px' }}>
          {isLoading ? (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Loading chat session...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center h-100">
              <p className="text-muted text-center">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`d-flex mb-2 ${msg.sender === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div 
                  className={`p-2 px-3 rounded-3 my-message-bubble ${
                    msg.sender === 'admin'
                      ? 'my-message-admin rounded-bottom-end-0'
                      : 'my-message-user rounded-bottom-start-0'
                  }`}
                  style={{ maxWidth: '78%', wordWrap: 'break-word' }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <small className="d-flex justify-content-end mt-1 my-message-time">
                      {formatTimestamp(msg.timestamp)}
                    </small>
                  )}
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="d-flex mb-3 justify-content-end">
              <div className="p-3 rounded-3 my-message-admin rounded-bottom-end-0 d-flex align-items-center gap-2">
                <Spinner animation="grow" size="sm" variant="light" />
                <small style={{ fontSize: '0.9rem' }}>Sending...</small>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </Card.Body>

        <div className="card-footer my-input-wrap p-2 border-top">
          <Form onSubmit={handleSendMessage} className="d-flex gap-2">
            <Form.Control 
              type="text" 
              placeholder={isConnected ? 'Type a message' : 'Disconnected...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isConnected || isLoading}
              className="border-0 shadow-none my-chat-input"
              style={{ fontSize: '0.88rem' }}
            />
            <Button 
              type="submit" 
              variant="primary"
              disabled={!isConnected || isLoading || isSending || !input.trim()}
              className="d-flex align-items-center justify-content-center px-3 my-send-btn"
            >
              {isSending ? <Spinner animation="border" size="sm" /> : <BiSend />}
            </Button>
          </Form>
        </div>

      </Card>
    </div>
  );
};

export default AdminChat;
