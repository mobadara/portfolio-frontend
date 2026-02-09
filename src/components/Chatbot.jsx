import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiBot, BiSend, BiX } from 'react-icons/bi';
import { BsChatDotsFill } from 'react-icons/bs';

const CHAT_API_BASE = 'https://portfolio-backend-tjq3.onrender.com'
// const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm Muyiwa's AI Assistant. Ask me about his skills, projects, or schedule!", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Initialize WebSocket connection when chatbot opens
  useEffect(() => {
    if (isOpen && !webSocketRef.current) {
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
        };

        ws.onmessage = (event) => {
          console.log('Message received from server:', event.data);
          const botMsg = {
            id: getNextMessageId(),
            text: event.data,
            sender: 'bot'
          };
          setMessages(prev => [...prev, botMsg]);
          setIsLoading(false);
          playMessageSound();
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          const errorMsg = {
            id: getNextMessageId(),
            text: "Sorry, I encountered a connection error. Please try again.",
            sender: 'bot'
          };
          setMessages(prev => [...prev, errorMsg]);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          webSocketRef.current = null;
        };

        webSocketRef.current = ws;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        const errorMsg = {
          id: getNextMessageId(),
          text: "Unable to connect to the chat service. Please refresh and try again.",
          sender: 'bot'
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }

    return () => {
      // Don't close WebSocket when component unmounts, only when chatbot closes
    };
  }, [isOpen]);

  // Close WebSocket when chatbot window closes
  useEffect(() => {
    if (!isOpen && webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  }, [isOpen]);

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
      const errorMsg = { 
        id: getNextMessageId(), 
        text: "Connection not established. Please refresh and try again.", 
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
        text: "Connection not established. Please refresh and try again.", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
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
          <div className="card-header bg-navy text-white d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center gap-2">
                <div className="bg-white text-navy rounded-circle p-1 d-flex">
                    <BiBot size={20} />
                </div>
                <h6 className="mb-0 fw-bold">Assistant</h6>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white-50 p-0">
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
                      : 'bg-white text-dark border rounded-bottom-left-0' // Bot Style
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <small className="d-block mb-1 opacity-75" style={{ fontSize: '0.7rem' }}>
                    {msg.sender === 'user' ? 'You' : 'AI'}
                  </small>
                  {msg.text}
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