import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiSend, BiX } from 'react-icons/bi';
import { BsChatFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';

const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm AI Assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);

  const suggestedQuestions = [
    "What are your key skills?",
    "Tell me about recent projects",
    "How can I reach you?"
  ];

  const getNextMessageId = () => {
    const nextId = messageIdRef.current;
    messageIdRef.current += 1;
    return nextId;
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeWebSocket = () => {
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

        ws.onopen = () => {
          console.log('WebSocket connected');
          if (isMounted) {
            setIsConnected(true);
            setIsConnecting(false);
          }
        };

        ws.onmessage = (event) => {
          if (isMounted) {
            try {
              const data = JSON.parse(event.data);
              const botMsg = {
                id: getNextMessageId(),
                text: data.content || data.message || event.data,
                sender: data.role === 'admin' ? 'admin' : 'bot'
              };
              setMessages(prev => [...prev, botMsg]);
              setIsLoading(false);
            } catch {
              const botMsg = {
                id: getNextMessageId(),
                text: event.data,
                sender: 'bot'
              };
              setMessages(prev => [...prev, botMsg]);
              setIsLoading(false);
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) {
            setIsConnected(false);
            setIsConnecting(false);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (isMounted) {
            setIsConnected(false);
            setIsConnecting(false);
          }
          webSocketRef.current = null;
        };

        webSocketRef.current = ws;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initializeWebSocket();

    return () => {
      isMounted = false;
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const userMsg = { id: getNextMessageId(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(input);
      setIsLoading(true);
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (!isConnected) return;

    const userMsg = { id: getNextMessageId(), text: question, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);

    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(question);
      setIsLoading(true);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="chatbot-fab-wrapper">
        <Button 
          className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Chat"
          title={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? <BiX size={26} /> : <BsChatFill size={22} />}
        </Button>
        <span
          className={`chatbot-status-dot ${
            isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'
          }`}
          title={isConnecting ? 'Connecting…' : isConnected ? 'Online' : 'Offline'}
        />
      </div>

      {/* Chat Window */}
      <div className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}>
        <Card className="h-100 border-0 overflow-hidden d-flex flex-column">
          
          {/* Header */}
          <div className="chatbot-header d-flex align-items-center justify-content-between p-3 gap-3">
            <div className="d-flex align-items-center gap-2">
              <span
                className={`chatbot-status-dot chatbot-status-dot--lg ${
                  isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'
                }`}
              />
              <div>
                <h6 className="mb-0 fw-600 text-white lh-1">Chat Support</h6>
                <small className={`lh-1 ${
                  isConnecting ? 'text-warning' : isConnected ? 'text-success' : 'text-danger'
                } opacity-90`}>
                  {isConnecting ? 'Connecting…' : isConnected ? 'Online' : 'Offline'}
                </small>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="btn btn-sm text-white p-0 chatbot-close-btn"
              aria-label="Close chat"
            >
              <BiX size={22} />
            </button>
          </div>

          {/* Messages */}
          <Card.Body className="chat-messages overflow-auto p-3 flex-grow-1">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`d-flex mb-3 gap-2 ${msg.sender === 'user' ? 'justify-content-end' : ''}`}
              >
                <div 
                  className={`py-2 px-3 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-navy text-white' 
                      : 'bg-light text-dark'
                  }`}
                  style={{ maxWidth: '80%', borderRadius: '12px' }}
                >
                  {msg.sender !== 'user' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({children}) => <p className="mb-2">{children}</p>,
                        code: ({inline, children}) => 
                          inline ? 
                            <code className="bg-secondary bg-opacity-25 px-2 py-1 rounded">{children}</code> :
                            <pre className="bg-secondary bg-opacity-25 p-2 rounded overflow-auto my-2"><code>{children}</code></pre>,
                        ul: ({children}) => <ul className="ps-4 mb-2">{children}</ul>,
                        ol: ({children}) => <ol className="ps-4 mb-2">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary">{children}</a>,
                        strong: ({children}) => <strong>{children}</strong>,
                        em: ({children}) => <em>{children}</em>
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="d-flex mb-3">
                <div className="bg-light text-dark py-2 px-3 rounded-lg d-flex align-items-center gap-2">
                  <Spinner animation="grow" size="sm" variant="secondary" />
                  <small>Typing...</small>
                </div>
              </div>
            )}

            {/* Suggested Questions - Only show on initial state */}
            {messages.length === 1 && (
              <div className="mt-4 pt-2">
                <small className="text-muted d-block mb-2">Quick questions:</small>
                <div className="d-flex flex-column gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(q)}
                      disabled={!isConnected}
                      className="btn btn-sm btn-outline-secondary text-start text-wrap"
                      style={{ fontSize: '0.875rem' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </Card.Body>

          {/* Input */}
          <div className="card-footer bg-white border-top p-2">
            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control 
                placeholder={isConnected ? "Type a message..." : "Disconnected..."} 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                disabled={!isConnected}
                className="border rounded-lg bg-light"
                style={{ fontSize: '0.9rem' }}
                rows="1"
              />
              <Button 
                type="submit" 
                variant="primary"
                disabled={!isConnected || !input.trim()}
                className="bg-navy border-0 px-3"
              >
                <BiSend />
              </Button>
            </Form>
          </div>

        </Card>
      </div>

      <style jsx>{`
        .chatbot-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #001f3f 0%, #003366 100%);
          border: 0;
          color: white;
          z-index: 1040;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 31, 63, 0.3);
        }

        .chatbot-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(0, 31, 63, 0.4);
        }

        .chatbot-fab:active {
          transform: scale(0.95);
        }

        .chatbot-window {
          position: fixed;
          bottom: 100px;
          right: 30px;
          width: 100%;
          max-width: 400px;
          height: 600px;
          max-height: 80vh;
          border-radius: 12px;
          z-index: 1039;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(20px);
        }

        .chatbot-window.open {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .chatbot-window .card {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }

        .chatbot-header {
          background: linear-gradient(135deg, #001f3f 0%, #003366 100%);
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chatbot-close-btn {
          transition: transform 0.2s;
          cursor: pointer;
        }

        .chatbot-close-btn:hover {
          transform: rotate(90deg);
        }

        .chat-messages {
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
        }

        .rounded-lg {
          border-radius: 8px;
        }

        @media (max-width: 480px) {
          .chatbot-window {
            bottom: 20px;
            right: 20px;
            left: 20px;
            max-width: unset;
            height: 500px;
          }

          .chatbot-fab {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default Chatbot;