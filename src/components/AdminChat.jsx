import { useState, useEffect, useRef } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { BiSend, BiX } from 'react-icons/bi';
import { MdAdminPanelSettings } from 'react-icons/md';

const API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

/**
 * AdminChat Component - Handles admin-to-user chat interface
 * Connects to a specific chat session via WebSocket for real-time messaging
 * 
 * @param {string} sessionId - The chat session ID to connect to
 * @param {function} onClose - Callback when admin closes the chat
 */
const AdminChat = ({ sessionId, onClose }) => {
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
          `${API_BASE}/admin/chat_sessions/${sessionId}`
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
            sender: msg.role === 'user' ? 'user' : 'assistant'
          }));
          
          setMessages(formattedMessages);
          
          // Step 2: Connect to WebSocket after session data is loaded
          connectWebSocket(data.admin_websocket);
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
      let wsUrl = wsConfig.url;
      
      // Add ADMIN_AUTH_TOKEN as query parameter
      const token = import.meta.env.VITE_ADMIN_AUTH_TOKEN;
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}token=${encodeURIComponent(token)}`;
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
              role: data.role || 'assistant',
              content: data.content || data.message,
              timestamp: new Date().toISOString(),
              sender: data.role === 'user' ? 'user' : 'assistant'
            };
            
            setMessages(prev => [...prev, newMessage]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          // If not JSON, treat as plain text message
          const newMessage = {
            id: Date.now(),
            role: 'assistant',
            content: event.data,
            timestamp: new Date().toISOString(),
            sender: 'assistant'
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
        sender: 'user'
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
      <Card className="h-100 border-0 overflow-hidden shadow-lg">
        
        {/* Header */}
        <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between p-3">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white text-primary rounded-circle p-1 d-flex">
              <MdAdminPanelSettings size={20} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">Admin Chat</h6>
              <small className="opacity-75">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </small>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-sm text-white-50 p-0"
            aria-label="Close chat"
          >
            <BiX size={24} />
          </button>
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="bg-light px-3 py-2 border-bottom">
            <small className="text-muted">
              <strong>Session:</strong> {sessionId}
              {sessionInfo.human_mode && (
                <span className="badge bg-success ms-2">HUMAN MODE</span>
              )}
            </small>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-0 rounded-0">
            <small>{error}</small>
          </Alert>
        )}

        {/* Messages Area */}
        <Card.Body className="chat-body bg-light p-3 overflow-auto" style={{ minHeight: '400px' }}>
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
                className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div 
                  className={`p-3 rounded-3 ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-bottom-right-0'
                      : 'bg-white text-dark border rounded-bottom-left-0'
                  }`}
                  style={{ maxWidth: '75%', wordWrap: 'break-word' }}
                >
                  <small className="d-block mb-1 opacity-75" style={{ fontSize: '0.75rem' }}>
                    {msg.sender === 'user' ? 'You (Admin)' : 'User'}
                    {msg.timestamp && ` • ${formatTimestamp(msg.timestamp)}`}
                  </small>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isSending && (
            <div className="d-flex mb-3 justify-content-end">
              <div className="p-3 rounded-3 bg-primary text-white rounded-bottom-right-0 d-flex align-items-center gap-2">
                <Spinner animation="grow" size="sm" variant="light" />
                <small style={{ fontSize: '0.9rem' }}>Sending...</small>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </Card.Body>

        {/* Input Area */}
        <div className="card-footer bg-white p-2 border-top">
          <Form onSubmit={handleSendMessage} className="d-flex gap-2">
            <Form.Control 
              type="text" 
              placeholder={isConnected ? "Type your message..." : "Disconnected..."} 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isConnected || isLoading}
              className="border-0 bg-light shadow-none"
              style={{ fontSize: '0.9rem' }}
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!isConnected || isLoading || isSending || !input.trim()}
              className="d-flex align-items-center justify-content-center px-3"
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
