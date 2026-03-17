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
  const [isConnecting, setIsConnecting] = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);
  const loadingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const typingSoundIntervalRef = useRef(null);

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

  const playChatSound = (type = 'receive') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      const config = {
        send: { frequency: 620, duration: 0.06 },
        receive: { frequency: 740, duration: 0.08 },
        error: { frequency: 280, duration: 0.12 }
      };

      const { frequency, duration } = config[type] || config.receive;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
      // Silent fail for browsers that block autoplay/audio context.
    }
  };

  const playTypingPulse = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      const now = context.currentTime;

      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(900, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(context.destination);
      osc1.start(now);
      osc1.stop(now + 0.06);

      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(760, now + 0.04);
      gain2.gain.setValueAtTime(0.0001, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.025, now + 0.055);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      osc2.connect(gain2);
      gain2.connect(context.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.11);
    } catch {
      // Silent fail for browsers that block autoplay/audio context.
    }
  };

  const shouldEnableHumanMode = (text = '') => {
    const normalized = text.toLowerCase();
    const triggers = ['human mode', 'human', 'agent', 'real person', 'representative', 'live support'];
    return triggers.some(trigger => normalized.includes(trigger));
  };

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const startLoadingTimeout = () => {
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: getNextMessageId(),
          text: 'Response timed out. Please try again.',
          sender: 'bot'
        }
      ]);
    }, 20000);
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        setIsConnected(false);
        setIsConnecting(true);
      } else {
        setIsConnecting(false);
        setIsLoading(false);
        clearLoadingTimeout();
        setShowHumanForm(false);
      }
      return nextOpen;
    });
  };

  // Initialize WebSocket connection only when chat is opened
  useEffect(() => {
    if (isLoading) {
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
      playTypingPulse();
      typingSoundIntervalRef.current = setInterval(() => {
        playTypingPulse();
      }, 900);
    } else {
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
    }

    return () => {
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      clearLoadingTimeout();
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
      return undefined;
    }

    let isMounted = true;

    const initializeWebSocket = () => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
              clearLoadingTimeout();
              playChatSound('receive');
            } catch {
              const botMsg = {
                id: getNextMessageId(),
                text: event.data,
                sender: 'bot'
              };
              setMessages(prev => [...prev, botMsg]);
              setIsLoading(false);
              clearLoadingTimeout();
              playChatSound('receive');
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) {
            setIsConnected(false);
            setIsConnecting(false);
            setIsLoading(false);
            clearLoadingTimeout();
            playChatSound('error');
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (isMounted) {
            setIsConnected(false);
            setIsConnecting(false);
            setIsLoading(false);
            clearLoadingTimeout();
          }
          webSocketRef.current = null;
        };

        webSocketRef.current = ws;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        if (isMounted) {
          setIsConnected(false);
          setIsConnecting(false);
        }
      }
    };

    initializeWebSocket();

    return () => {
      isMounted = false;
      clearLoadingTimeout();
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    const messageText = input.trim();

    const userMsg = { id: getNextMessageId(), text: messageText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    playChatSound('send');

    if (shouldEnableHumanMode(messageText) && !showHumanForm) {
      setShowHumanForm(true);
      setMessages(prev => [
        ...prev,
        {
          id: getNextMessageId(),
          text: 'Sure — I can connect you to human support. Please share your name, email, and phone number using the form below.',
          sender: 'bot'
        }
      ]);
    }

    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(messageText);
      setIsLoading(true);
      startLoadingTimeout();
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (!isConnected) return;

    const userMsg = { id: getNextMessageId(), text: question, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    playChatSound('send');

    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(question);
      setIsLoading(true);
      startLoadingTimeout();
    }
  };

  const handleContactFieldChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const handleHumanFormSubmit = (e) => {
    e.preventDefault();
    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedPhone = contactForm.phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      return;
    }

    const detailsMessage = `Human support details:\n- Name: ${trimmedName}\n- Email: ${trimmedEmail}\n- Phone: ${trimmedPhone}`;
    const humanSupportPayload = {
      type: 'HUMAN_SUPPORT_REQUEST',
      version: 2,
      schema: 'human_support_lead',
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      message: detailsMessage,
      source: 'portfolio-frontend',
      timestamp: new Date().toISOString()
    };
    const legacyPayload = `HUMAN_SUPPORT_REQUEST\n${detailsMessage}`;
    setMessages(prev => [
      ...prev,
      { id: getNextMessageId(), text: detailsMessage, sender: 'user' },
      {
        id: getNextMessageId(),
        text: 'Thanks! Your details have been captured. A human support contact will follow up shortly.',
        sender: 'bot'
      }
    ]);
    playChatSound('send');

    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      try {
        webSocketRef.current.send(JSON.stringify(humanSupportPayload));
      } catch {
        webSocketRef.current.send(legacyPayload);
      }
    }

    setShowHumanForm(false);
    setContactForm({ name: '', email: '', phone: '' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="chatbot-fab-wrapper">
        <Button 
          className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg"
          onClick={toggleChat}
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
              onClick={toggleChat}
              className="btn btn-sm text-white p-0 chatbot-close-btn"
              aria-label="Close chat"
              type="button"
            >
              <BiX size={22} />
            </button>
          </div>

          {/* Messages */}
          <Card.Body className="chat-messages overflow-auto p-3 flex-grow-1">
            <div className="quick-questions-sticky mb-3">
              <small className="text-muted d-block mb-2">Quick questions:</small>
              <div className="d-flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    disabled={!isConnected}
                    className="btn btn-sm btn-outline-secondary text-start text-wrap"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

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
            
            <div ref={messagesEndRef} />
          </Card.Body>

          {/* Input */}
          <div className="card-footer bg-white border-top p-2">
            {showHumanForm && (
              <Form onSubmit={handleHumanFormSubmit} className="human-form mb-3">
                <Form.Control
                  className="mb-2"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => handleContactFieldChange('name', e.target.value)}
                  required
                />
                <Form.Control
                  className="mb-2"
                  type="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={(e) => handleContactFieldChange('email', e.target.value)}
                  required
                />
                <Form.Control
                  className="mb-2"
                  type="tel"
                  placeholder="Your phone number"
                  value={contactForm.phone}
                  onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                  required
                />
                <Button type="submit" variant="outline-primary" className="w-100">
                  Submit for Human Support
                </Button>
              </Form>
            )}

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

        .quick-questions-sticky {
          position: sticky;
          top: -12px;
          background: #f8f9fa;
          z-index: 2;
          padding-top: 2px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .human-form {
          border: 1px solid rgba(0, 31, 63, 0.12);
          border-radius: 10px;
          padding: 10px;
          background: #f8f9fa;
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