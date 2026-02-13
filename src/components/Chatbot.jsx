/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiBot, BiSend, BiX } from 'react-icons/bi';
import { BsChatDotsFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';

const CHAT_API_BASE = 'https://portfolio-backend-tjq3.onrender.com'
// const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm Muyiwa's AI Assistant. Ask me about his skills, projects, or schedule!", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [requestingHuman, setRequestingHuman] = useState(false);
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);

  const predefinedQuestions = [
    "What are Muyiwa's main skills?",
    "Tell me about his recent projects",
    "What's his availability?",
    "How can I contact him?"
  ];

  const getNextMessageId = () => {
    const nextId = messageIdRef.current;
    messageIdRef.current += 1;
    return nextId;
  };

  const playMessageSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    let isMounted = true;

    if (!webSocketRef.current) {
      // Generate or retrieve session ID
      let sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chatSessionId', sessionId);
      }
      sessionIdRef.current = sessionId;

      // Connect to WebSocket
      const wsBase = CHAT_API_BASE.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/chat/${sessionId}`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          if (isMounted) {
            setIsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          console.log('Message received from server:', event.data);
          if (isMounted) {
            try {
              // Try to parse as JSON first (for system messages)
              const data = JSON.parse(event.data);
              
              if (data.type === 'human_mode_activated') {
                setHumanMode(true);
                setRequestingHuman(false);
                const botMsg = {
                  id: getNextMessageId(),
                  text: data.message || "You've been connected to a human! Muyiwa will respond shortly.",
                  sender: 'bot'
                };
                setMessages(prev => [...prev, botMsg]);
                playMessageSound();
              } else if (data.type === 'message') {
                const botMsg = {
                  id: getNextMessageId(),
                  text: data.content || data.message,
                  sender: data.role === 'admin' ? 'admin' : 'bot'
                };
                setMessages(prev => [...prev, botMsg]);
                setIsLoading(false);
                playMessageSound();
              }
            } catch (e) {
              // If not JSON, treat as regular text message
              const botMsg = {
                id: getNextMessageId(),
                text: event.data,
                sender: 'bot'
              };
              setMessages(prev => [...prev, botMsg]);
              setIsLoading(false);
              playMessageSound();
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (isMounted) {
            setIsConnected(false);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (isMounted) {
            setIsConnected(false);
          }
          webSocketRef.current = null;
        };

        webSocketRef.current = ws;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        // Connection state remains false by default, no need to set it
      }
    }

    return () => {
      isMounted = false;
      // Clean up WebSocket on component unmount
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, []);

  // Auto-trigger chatbot after 30 seconds
  useEffect(() => {
    const autoTriggerTimer = setTimeout(() => {
      if (!hasAutoTriggered && !isOpen) {
        setHasAutoTriggered(true);
        setIsOpen(true);
        playMessageSound();
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(autoTriggerTimer);
  }, [hasAutoTriggered, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { id: getNextMessageId(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // 2. Send to WebSocket
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(input);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      const errorMsg = { 
        id: getNextMessageId(), 
        text: isConnected ? "Connection is being established. Please try again in a moment." : "Unable to connect to the chat service. Please check your connection and try again.", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handlePredefinedQuestion = (question) => {
    // 1. Add User Message
    const userMsg = { id: getNextMessageId(), text: question, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);

    // 2. Send to WebSocket
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(question);
      setIsLoading(true);
    } else {
      const errorMsg = { 
        id: getNextMessageId(), 
        text: isConnected ? "Connection is being established. Please try again in a moment." : "Unable to connect to the chat service. Please check your connection and try again.", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const requestHumanSupport = async () => {
    if (requestingHuman || humanMode) return;
    
    setRequestingHuman(true);
    
    // Add user message indicating they want human support
    const userMsg = { 
      id: getNextMessageId(), 
      text: "I'd like to talk to a human", 
      sender: 'user' 
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Send WebSocket message to request human mode
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'request_human',
          message: "User requesting human support"
        }));
      }

      // Also make HTTP request as backup
      const response = await fetch(
        `${CHAT_API_BASE}/chat/${sessionIdRef.current}/request-human`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setHumanMode(true);
        
        const botMsg = {
          id: getNextMessageId(),
          text: data.message || "You've been connected to a human! Muyiwa will respond shortly.",
          sender: 'bot'
        };
        setMessages(prev => [...prev, botMsg]);
        playMessageSound();
      } else {
        throw new Error('Failed to request human support');
      }
    } catch (error) {
      console.error('Error requesting human support:', error);
      const errorMsg = {
        id: getNextMessageId(),
        text: "I'm having trouble connecting you to Muyiwa right now. Please try using the contact form or email directly.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setRequestingHuman(false);
    }
  };

  return (
    <>
      {/* 1. THE FLOATING BUTTON (FAB) */}
      <Button 
        className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Chat"
      >
        {isOpen ? <BiX size={28} /> : <BsChatDotsFill size={24} />}
      </Button>

      {/* 2. THE CHAT WINDOW */}
      <div className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}>
        <Card className="h-100 border-0 overflow-hidden">
          
          {/* Header */}
          <div className="chatbot-header d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center gap-3">
                <div className="chatbot-avatar-wrapper">
                    <div className="chatbot-avatar">
                        <BiBot size={22} />
                    </div>
                    <div className={`chatbot-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
                </div>
                <div>
                    <h6 className="mb-0 fw-bold chatbot-header-title">
                      {humanMode ? 'Muyiwa' : 'AI Assistant'}
                    </h6>
                    <small className="chatbot-header-subtitle">
                      {humanMode 
                        ? '👤 Human Support' 
                        : isConnected 
                        ? 'Online • Ready to help' 
                        : 'Connecting...'}
                    </small>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white p-0 chatbot-close-btn">
                <BiX size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <Card.Body className="chat-body bg-light p-3 overflow-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div 
                  className={`p-2 px-3 rounded-3 ${
                    msg.sender === 'user' 
                      ? 'bg-navy text-white rounded-bottom-right-0' // User Style
                      : msg.sender === 'admin'
                      ? 'bg-success text-white rounded-bottom-left-0' // Admin Style
                      : 'bg-white text-dark border rounded-bottom-left-0' // Bot Style
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <small className="d-block mb-1 opacity-75" style={{ fontSize: '0.7rem' }}>
                    {msg.sender === 'user' ? 'You' : msg.sender === 'admin' ? '👤 Muyiwa' : 'AI'}
                  </small>
                  {msg.sender !== 'user' ? (
                    <ReactMarkdown 
                      className="markdown-content"
                      components={{
                        p: ({node, ...props}) => <p style={{marginBottom: '0.5rem'}} {...props} />,
                        code: ({node, inline, ...props}) => 
                          inline ? 
                            <code style={{backgroundColor: msg.sender === 'admin' ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: '3px', fontSize: '0.9em'}} {...props} /> :
                            <code style={{display: 'block', backgroundColor: msg.sender === 'admin' ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: '0.5rem', borderRadius: '5px', overflowX: 'auto', fontSize: '0.85em'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{marginLeft: '1rem', marginBottom: '0.5rem'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{marginLeft: '1rem', marginBottom: '0.5rem'}} {...props} />,
                        li: ({node, ...props}) => <li style={{marginBottom: '0.25rem'}} {...props} />,
                        a: ({node, ...props}) => <a style={{color: msg.sender === 'admin' ? '#fff' : '#0066cc', textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer" {...props} />,
                        h1: ({node, ...props}) => <h5 style={{marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold'}} {...props} />,
                        h2: ({node, ...props}) => <h6 style={{marginTop: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold'}} {...props} />,
                        h3: ({node, ...props}) => <h6 style={{marginTop: '0.5rem', marginBottom: '0.5rem'}} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '3px solid #ccc', paddingLeft: '0.5rem', marginLeft: '0', color: msg.sender === 'admin' ? '#fff' : '#666'}} {...props} />,
                        strong: ({node, ...props}) => <strong {...props} />,
                        em: ({node, ...props}) => <em {...props} />
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
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="d-flex mb-3 justify-content-start">
                <div className="p-2 px-3 rounded-3 bg-white text-dark border rounded-bottom-left-0 d-flex align-items-center gap-2">
                  <Spinner animation="grow" size="sm" variant="primary" />
                  <small style={{ fontSize: '0.9rem' }}>Assistant is typing...</small>
                </div>
              </div>
            )}
            
            {/* Show predefined questions only after initial bot message */}
            {messages.length === 1 && (
              <div className="mt-4">
                <p className="text-muted small mb-3">What would you like to know?</p>
                <div className="d-flex flex-column gap-2">
                  {predefinedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline-navy"
                      size="sm"
                      onClick={() => handlePredefinedQuestion(question)}
                      className="text-start"
                      style={{ 
                        borderColor: '#001a4d',
                        color: '#001a4d',
                        whiteSpace: 'normal',
                        padding: '0.5rem 0.75rem'
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Talk to Human Button */}
            {!humanMode && messages.length > 1 && (
              <div className="text-center my-3">
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={requestHumanSupport}
                  disabled={requestingHuman}
                  className="d-flex align-items-center gap-2 mx-auto"
                >
                  {requestingHuman ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-fill"></i>
                      <span>Talk to Muyiwa</span>
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </Card.Body>

          {/* Input Area */}
          <div className="card-footer bg-white p-2">
            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control 
                type="text" 
                placeholder="Type a message..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-0 bg-light shadow-none"
                style={{ fontSize: '0.9rem' }}
              />
              <Button type="submit" variant="primary" className="bg-navy border-navy d-flex align-items-center justify-content-center px-3">
                <BiSend />
              </Button>
            </Form>
          </div>

        </Card>
      </div>
    </>
  );
};

export default Chatbot;