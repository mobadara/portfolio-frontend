import { useState, useRef, useEffect, useMemo } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { formatTimestamp } from '../utils/adminChatUtils';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiMicrophone, BiSend, BiStopCircle, BiX } from 'react-icons/bi';
import { BsChatFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');
const CHAT_REQUEST_HUMAN_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/request-human`;
const CONTACT_CREATE_ENDPOINT = (import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact');
const CHAT_SESSION_STATUS_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/status`;
const CHATBOT_SESSION_STORAGE_KEY = 'portfolio_chatbot_session_id';
const CHATBOT_AUDIO_PREFIX = 'portfolio_chatbot_audio_';
const CHATBOT_MESSAGES_PREFIX = 'portfolio_chatbot_messages_';
const defaultBotMessage = { id: 1, text: "Hi! I'm AI Assistant. How can I help you today?", sender: 'bot', type: 'text' };

const generateSessionId = () => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString().slice(2, 9);
  return (timestamp + randomPart).slice(0, 16).padEnd(16, '0');
};

const getChatMessagesStorageKey = (sessionId) => `${CHATBOT_MESSAGES_PREFIX}${sessionId}`;
const getChatAudioStorageKey = (sessionId, messageId) => `${CHATBOT_AUDIO_PREFIX}${sessionId}_${messageId}`;

const Chatbot = () => {
  // --- STATE & REFS ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([defaultBotMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [socketResetNonce, setSocketResetNonce] = useState(0);
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [leadSubmitStatus, setLeadSubmitStatus] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    countryCode: '+234',
    phone: ''
  });
  const [humanFormStep, setHumanFormStep] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  // Store last human support details for session reuse
  const lastHumanSupportDetailsRef = useRef(null);

  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);
  const loadingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const typingSoundIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const pendingReachSupportTriggerRef = useRef(false);

  const suggestedQuestions = [
    'What are your key skills?',
    'Tell me about recent projects',
    'How can I reach you?',
    'I have some STEM/CS or data related questions',
  ];

  // --- HELPER FUNCTIONS ---
  const getNextMessageId = () => {
    const nextId = messageIdRef.current;
    messageIdRef.current += 1;
    return nextId;
  };

  const loadMessagesForSession = (sessionId) => {
    const key = getChatMessagesStorageKey(sessionId);
    const raw = localStorage.getItem(key);
    if (!raw) return [defaultBotMessage];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [defaultBotMessage];
    } catch {
      return [defaultBotMessage];
    }
  };

  const persistMessagesForSession = (sessionId, updatedMessages) => {
    if (!sessionId) return;
    localStorage.setItem(getChatMessagesStorageKey(sessionId), JSON.stringify(updatedMessages));
  };

  const resolveAudioSource = (message) => {
    if (message?.audioData) return message.audioData;
    if (!message?.audioStorageKey) return '';
    return localStorage.getItem(message.audioStorageKey) || '';
  };

  const storeAudioForMessage = (sessionId, messageId, audioData) => {
    if (!sessionId || !messageId || !audioData) return null;
    const key = getChatAudioStorageKey(sessionId, messageId);
    localStorage.setItem(key, audioData);
    return key;
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const playChatSound = (type = 'receive') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const context = audioContextRef.current;
      if (context.state === 'suspended') context.resume();

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
    } catch { /* ignore audio error */ }
  };

  const playTypingPulse = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const context = audioContextRef.current;
      if (context.state === 'suspended') context.resume();

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
    } catch { /* ignore typing pulse error */ }
  };

  const shouldEnableHumanMode = (text = '') => {
    const normalized = text.toLowerCase();
    const normalizedCompact = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const directTriggers = [
      'human mode', 'human support', 'live support', 'live chat', 'real person',
      'customer support', 'technical support', 'support agent', 'transfer me',
      'escalate this', 'connect with muyiwa', 'connect me with muyiwa',
      'talk to muyiwa', 'speak with muyiwa', 'contact muyiwa', 'reach muyiwa',
      'chat with muyiwa', 'message muyiwa'
    ];

    if (directTriggers.some((trigger) => normalizedCompact.includes(trigger))) return true;

    const hasConnectVerb = /(connect|talk|speak|chat|contact|reach|transfer|escalate|forward|handoff)/.test(normalizedCompact);
    const hasHumanTarget = /(human|person|agent|representative|support|operator|muyiwa|owner|admin)/.test(normalizedCompact);
    return hasConnectVerb && hasHumanTarget;
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
      setMessages((prev) => [
        ...prev,
        {
          id: getNextMessageId(),
          text: 'Response timed out. The server may be slow or the connection was lost. Please try again or contact support.',
          sender: 'bot'
        }
      ]);
    }, 40000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetHumanSupportForm = () => {
    setShowHumanForm(false);
    setHumanFormStep(0);
    setIsLeadSubmitting(false);
    setContactForm({ name: '', email: '', countryCode: '+234', phone: '' });
  };

  const toggleChat = () => {
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        setLeadSubmitStatus(null);
        setIsConnected(false);
        setIsConnecting(true);
        // Always reset to bot mode when chat is opened
        setIsHumanMode(false);
        setShowHumanForm(false);
      } else {
        setLeadSubmitStatus(null);
        setIsConnecting(false);
        setIsLoading(false);
        setIsHumanMode(false);
        setIsRecording(false);
        clearLoadingTimeout();
        clearRecordingTimer();
        resetHumanSupportForm();
      }
      return nextOpen;
    });
  };

  // --- USE EFFECTS ---
  useEffect(scrollToBottom, [messages, isOpen]);

  useEffect(() => {
    if (!leadSubmitStatus || leadSubmitStatus.type === 'pending') return undefined;
    const timer = setTimeout(() => setLeadSubmitStatus(null), 7000);
    return () => clearTimeout(timer);
  }, [leadSubmitStatus]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    persistMessagesForSession(sessionId, messages);
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      if (typingSoundIntervalRef.current) clearInterval(typingSoundIntervalRef.current);
      playTypingPulse();
      typingSoundIntervalRef.current = setInterval(() => playTypingPulse(), 900);
    } else if (typingSoundIntervalRef.current) {
      clearInterval(typingSoundIntervalRef.current);
      typingSoundIntervalRef.current = null;
    }
    return () => {
      if (typingSoundIntervalRef.current) {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = null;
      }
    };
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearRecordingTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
      clearLoadingTimeout();
      return undefined;
    }
    let isMounted = true;
    let handleVisibilityChange;

    const resolveSessionId = async () => {
      const storedSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
      if (!storedSessionId) return generateSessionId();
      try {
        const response = await fetch(CHAT_SESSION_STATUS_ENDPOINT(storedSessionId));
        if (!response.ok) return storedSessionId;
        const data = await response.json();
        if (data?.exists) return storedSessionId;
      } catch {
        return storedSessionId;
      }
      localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
      return generateSessionId();
    };

    const initializeWebSocket = async () => {
      const sessionId = await resolveSessionId();
      if (!isMounted) return;

      sessionIdRef.current = sessionId;
      localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, sessionId);

      const restoredMessages = loadMessagesForSession(sessionId);
      setMessages(restoredMessages);

      const maxId = restoredMessages.reduce((acc, item) => Math.max(acc, Number(item?.id || 0)), 0);
      messageIdRef.current = Math.max(maxId + 1, 2);

      const wsBase = CHAT_API_BASE.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/chat/${sessionId}`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            setIsConnecting(false);
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'audio' && data.audio_base64) {
              const nextId = getNextMessageId();
              const activeSession = sessionIdRef.current;
              const audioStorageKey = storeAudioForMessage(activeSession, nextId, data.audio_base64);
              const sender = data.role === 'admin' ? 'admin' : 'bot';

              setMessages((prev) => [
                ...prev,
                {
                  id: nextId, sender, type: 'audio', mimeType: data.mime_type || 'audio/webm',
                  audioStorageKey, timestamp: data.timestamp || new Date().toISOString()
                }
              ]);
              setIsHumanMode(true);
              setIsLoading(false);
              clearLoadingTimeout();
              playChatSound('receive');
              return;
            }

            if (data?.type === 'session_cleared') {
              setMessages([defaultBotMessage]);
              setIsHumanMode(false);
              setShowHumanForm(false);
              clearLoadingTimeout();
              setIsLoading(false);
              return;
            }

            if (data?.type === 'session_deleted') {
              localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
              sessionIdRef.current = null;

              setMessages([defaultBotMessage]);
              setIsHumanMode(false);
              setShowHumanForm(false);
              setInput('');
              clearLoadingTimeout();
              setIsLoading(false);
              setIsConnected(false);
              setIsConnecting(true);

              if (webSocketRef.current) {
                webSocketRef.current.close();
                webSocketRef.current = null;
              }
              setSocketResetNonce((prev) => prev + 1);
              setHasSession(false);
              return;
            }

            const content = data.content || data.message || event.data;
            const sender = data.role === 'admin' ? 'admin' : 'bot';
            setMessages((prev) => [...prev, { id: getNextMessageId(), text: content, sender, type: 'text' }]);

            if (sender === 'admin') setIsHumanMode(true);

            if (pendingReachSupportTriggerRef.current && sender === 'bot') {
              pendingReachSupportTriggerRef.current = false;
              setShowHumanForm(true);
              setHumanFormStep(0);
              setLeadSubmitStatus(null);
              setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Sure — I can connect you to human support. Please enter your details step by step below.', sender: 'bot' }]);
            }
          } catch {
            setMessages((prev) => [...prev, { id: getNextMessageId(), text: event.data, sender: 'bot', type: 'text' }]);
          }

          setIsLoading(false);
          clearLoadingTimeout();
          playChatSound('receive');
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setIsConnecting(false);
          setIsLoading(false);
          clearLoadingTimeout();
          playChatSound('error');
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setIsConnecting(false);
          setIsLoading(false);
          clearLoadingTimeout();
          webSocketRef.current = null;
          setTimeout(() => {
            if (isMounted && document.visibilityState === 'visible') initializeWebSocket();
          }, 1500);
        };

        webSocketRef.current = ws;
      } catch {
        if (isMounted) {
          setIsConnected(false);
          setIsConnecting(false);
        }
      }
    };

    handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN)) {
        initializeWebSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    initializeWebSocket();

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearLoadingTimeout();
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [isOpen, socketResetNonce, hasSession]);

  // --- ACTIONS & HANDLERS ---
  const sendSocketMessage = (payload) => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) return false;
    try {
      if (typeof payload === 'string') {
        webSocketRef.current.send(payload);
      } else {
        webSocketRef.current.send(JSON.stringify(payload));
      }
      return true;
    } catch {
      return false;
    }
  };

  const submitHumanSupportLead = async ({ name, email, countryCode, localPhone, fullPhone, detailsMessage }) => {
    if (!hasSession) setHasSession(true);
    let sessionId = sessionIdRef.current;
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, sessionId);
    }
    const transferPayload = {
      name,
      email,
      country_code: countryCode,
      phone: fullPhone,
      details: detailsMessage,
      subject: 'Transfer Request',
      type: 'request_human',
      source: 'portfolio-frontend',
      timestamp: new Date().toISOString(),
      user_name: name,
      user_email: email,
      user_phone: fullPhone
    };

    if (sessionId) {
      try {
        const response = await fetch(CHAT_REQUEST_HUMAN_ENDPOINT(sessionId), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transferPayload)
        });
        if (response.ok) return true;
      } catch { /* ignore WebSocket error */ }
    }

    try {
      const response = await fetch(`${CHAT_API_BASE}${CONTACT_CREATE_ENDPOINT}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: 'Transfer Request', message: `Name: ${name} | Email: ${email} | Phone: ${fullPhone}\n\n${detailsMessage}` })
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const openHumanSupportForm = () => {
    if (!hasSession) {
      setHasSession(true);
      setIsConnecting(true);
    }
    // If we have previous human support details for this session, skip recapture
    if (lastHumanSupportDetailsRef.current && hasSession) {
      setIsHumanMode(true);
      setShowHumanForm(false);
      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: 'You are now connected to human support. A representative will reach out if available.', sender: 'bot' }
      ]);
      return;
    }
    if (!showHumanForm) {
      setShowHumanForm(true);
      setHumanFormStep(0);
      setLeadSubmitStatus(null);
      setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Sure — I can connect you to human support. Please enter your details step by step below.', sender: 'bot' }]);
      if (!isConnected) {
        setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Live chat is currently offline, but you can still submit this form and Muyiwa will be notified directly.', sender: 'bot' }]);
      }
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setMessages((prev) => [...prev, { id: getNextMessageId(), text: messageText, sender: 'user', type: 'text' }]);
    setInput('');
    playChatSound('send');

    const wantsHumanSupport = shouldEnableHumanMode(messageText);
    if (wantsHumanSupport) {
      openHumanSupportForm();
      return;
    }

    if (isConnected && sendSocketMessage({ type: 'message', content: messageText, role: 'user' })) {
      setIsLoading(true);
      startLoadingTimeout();
    }
  };

  const handleSuggestedQuestion = (question) => {
    if (!isConnected) return;
    const normalizedQuestion = String(question || '').toLowerCase();
    pendingReachSupportTriggerRef.current = normalizedQuestion.includes('how can i reach you');
    setMessages((prev) => [...prev, { id: getNextMessageId(), text: question, sender: 'user', type: 'text' }]);
    playChatSound('send');

    if (sendSocketMessage(question)) {
      setIsLoading(true);
      startLoadingTimeout();
    }
  };

  const handleContactFieldChange = (field, value) => setContactForm((prev) => ({ ...prev, [field]: value }));

  const handleHumanFormSubmit = async (e) => {
    e.preventDefault();

    if (humanFormStep === 0) {
      const trimmedName = contactForm.name.trim();
      if (!trimmedName) return;
      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: trimmedName, sender: 'user' },
        { id: getNextMessageId(), text: "Got it! Now, what's your email address? (e.g., john@example.com)", sender: 'bot' }
      ]);
      playChatSound('send');
      setHumanFormStep(1);
      return;
    }

    if (humanFormStep === 1) {
      const trimmedEmail = contactForm.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Please enter a valid email address (e.g., john@example.com)', sender: 'bot' }]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: trimmedEmail, sender: 'user' },
        { id: getNextMessageId(), text: "Perfect! Finally, choose your country code and enter your phone number.", sender: 'bot' }
      ]);
      playChatSound('send');
      setHumanFormStep(2);
      return;
    }

    if (humanFormStep === 2) {
      const trimmedName = contactForm.name.trim();
      const trimmedEmail = contactForm.email.trim();
      const localPhone = contactForm.phone.replace(/[^\d]/g, '');
      if (!localPhone) return;

      const fullPhone = `${contactForm.countryCode}${localPhone}`;
      const detailsMessage = `Human support details:\n- Name: ${trimmedName}\n- Email: ${trimmedEmail}\n- Phone: ${fullPhone}`;

      const handleHumanFormSubmit = async (e) => {
        e.preventDefault();

        if (humanFormStep === 0) {
          const trimmedName = contactForm.name.trim();
          if (!trimmedName) return;
          setMessages((prev) => [
            ...prev,
            { id: getNextMessageId(), text: trimmedName, sender: 'user' },
            { id: getNextMessageId(), text: "Got it! Now, what's your email address? (e.g., john@example.com)", sender: 'bot' }
          ]);
          playChatSound('send');
          setHumanFormStep(1);
          return;
        }

        if (humanFormStep === 1) {
          const trimmedEmail = contactForm.email.trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Please enter a valid email address (e.g., john@example.com)', sender: 'bot' }]);
            return;
          }
          setMessages((prev) => [
            ...prev,
            { id: getNextMessageId(), text: trimmedEmail, sender: 'user' },
            { id: getNextMessageId(), text: "Perfect! Finally, choose your country code and enter your phone number.", sender: 'bot' }
          ]);
          playChatSound('send');
          setHumanFormStep(2);
          return;
        }

        if (humanFormStep === 2) {
          const trimmedName = contactForm.name.trim();
          const trimmedEmail = contactForm.email.trim();
          const localPhone = contactForm.phone.replace(/[^\d]/g, '');
          if (!localPhone) return;

          const fullPhone = `${contactForm.countryCode}${localPhone}`;
          const detailsMessage = `Human support details:\n- Name: ${trimmedName}\n- Email: ${trimmedEmail}\n- Phone: ${fullPhone}`;

          const humanSupportPayload = {
            type: 'HUMAN_SUPPORT_REQUEST', version: 3, schema: 'human_support_lead',
            name: trimmedName, email: trimmedEmail, country_code: contactForm.countryCode,
            phone_local: localPhone, phone: fullPhone, phone_e164: fullPhone,
            message: detailsMessage, source: 'portfolio-frontend', timestamp: new Date().toISOString()
          };
          const legacyPayload = `HUMAN_SUPPORT_REQUEST\n${detailsMessage}`;

          setMessages((prev) => [
            ...prev,
            { id: getNextMessageId(), text: detailsMessage, sender: 'user' },
            { id: getNextMessageId(), text: 'Perfect! Your details have been captured. A human support representative will reach out to you shortly. Thank you!', sender: 'bot' }
          ]);
          playChatSound('send');

          setIsLeadSubmitting(true);
          setLeadSubmitStatus({ type: 'pending', text: 'Sending details to support...' });

          const leadSaved = await submitHumanSupportLead({ name: trimmedName, email: trimmedEmail, countryCode: contactForm.countryCode, localPhone, fullPhone, detailsMessage });

          if (leadSaved) {
            setLeadSubmitStatus({ type: 'success', text: 'Details sent successfully.' });
          } else {
            setLeadSubmitStatus({ type: 'error', text: 'Could not confirm delivery. Please try again.' });
            setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'I could not confirm lead delivery to the support inbox. Please submit again or use the contact page.', sender: 'bot' }]);
          }

          setIsLeadSubmitting(false);
          if (!sendSocketMessage(humanSupportPayload)) sendSocketMessage(legacyPayload);
          setIsHumanMode(true);
          // Store details for session reuse
          lastHumanSupportDetailsRef.current = {
            name: trimmedName,
            email: trimmedEmail,
            countryCode: contactForm.countryCode,
            phone: localPhone,
            fullPhone,
            detailsMessage
          };
          resetHumanSupportForm();
        }
      };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      clearRecordingTimer();
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } catch {
      setLeadSubmitStatus({ type: 'error', text: 'Microphone access was denied.' });
      setIsRecording(false);
      useEffect(() => {
        if (!isOpen) {
          if (webSocketRef.current) {
            webSocketRef.current.close();
            webSocketRef.current = null;
          }
          clearLoadingTimeout();
          return undefined;
        }
        let isMounted = true;
        let handleVisibilityChange;

        const resolveSessionId = async () => {
          const storedSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
          if (!storedSessionId) return generateSessionId();
          try {
            const response = await fetch(CHAT_SESSION_STATUS_ENDPOINT(storedSessionId));
            if (!response.ok) return storedSessionId;
            const data = await response.json();
            if (data?.exists) return storedSessionId;
          } catch {
            return storedSessionId;
          }
          localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
          // If session is deleted, clear last human support details
          lastHumanSupportDetailsRef.current = null;
          return generateSessionId();
        };

        const initializeWebSocket = async () => {
          const sessionId = await resolveSessionId();
          if (!isMounted) return;

          sessionIdRef.current = sessionId;
          localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, sessionId);

          const restoredMessages = loadMessagesForSession(sessionId);
          setMessages(restoredMessages);

          const maxId = restoredMessages.reduce((acc, item) => Math.max(acc, Number(item?.id || 0)), 0);
          messageIdRef.current = Math.max(maxId + 1, 2);

          const wsBase = CHAT_API_BASE.replace(/^http/, 'ws');
          const wsUrl = `${wsBase}/chat/${sessionId}`;

          try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
              if (isMounted) {
                setIsConnected(true);
                setIsConnecting(false);
              }
            };

            ws.onmessage = (event) => {
              if (!isMounted) return;
              try {
                const data = JSON.parse(event.data);
                if (data?.type === 'audio' && data.audio_base64) {
                  const nextId = getNextMessageId();
                  const activeSession = sessionIdRef.current;
                  const audioStorageKey = storeAudioForMessage(activeSession, nextId, data.audio_base64);
                  const sender = data.role === 'admin' ? 'admin' : 'bot';

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: nextId, sender, type: 'audio', mimeType: data.mime_type || 'audio/webm',
                      audioStorageKey, timestamp: data.timestamp || new Date().toISOString()
                    }
                  ]);
                  setIsHumanMode(true);
                  setIsLoading(false);
                  clearLoadingTimeout();
                  playChatSound('receive');
                  return;
                }

                if (data?.type === 'session_cleared') {
                  setMessages([defaultBotMessage]);
                  setIsHumanMode(false);
                  setShowHumanForm(false);
                  clearLoadingTimeout();
                  setIsLoading(false);
                  return;
                }

                if (data?.type === 'session_deleted') {
                  localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
                  sessionIdRef.current = null;
                  // Clear last human support details if session deleted
                  lastHumanSupportDetailsRef.current = null;

                  setMessages([defaultBotMessage]);
                  setIsHumanMode(false);
                  setShowHumanForm(false);
                  setInput('');
                  clearLoadingTimeout();
                  setIsLoading(false);
                  setIsConnected(false);
                  setIsConnecting(true);

                  if (webSocketRef.current) {
                    webSocketRef.current.close();
                    webSocketRef.current = null;
                  }
                  setSocketResetNonce((prev) => prev + 1);
                  setHasSession(false);
                  return;
                }

                const content = data.content || data.message || event.data;
                const sender = data.role === 'admin' ? 'admin' : 'bot';
                setMessages((prev) => [...prev, { id: getNextMessageId(), text: content, sender, type: 'text' }]);

                if (sender === 'admin') setIsHumanMode(true);

                if (pendingReachSupportTriggerRef.current && sender === 'bot') {
                  pendingReachSupportTriggerRef.current = false;
                  setShowHumanForm(true);
                  setHumanFormStep(0);
                  setLeadSubmitStatus(null);
                  setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Sure — I can connect you to human support. Please enter your details step by step below.', sender: 'bot' }]);
                }
              } catch {
                setMessages((prev) => [...prev, { id: getNextMessageId(), text: event.data, sender: 'bot', type: 'text' }]);
              }

              setIsLoading(false);
              clearLoadingTimeout();
              playChatSound('receive');
            };

            ws.onerror = () => {
              if (!isMounted) return;
              setIsConnected(false);
              setIsConnecting(false);
              setIsLoading(false);
              clearLoadingTimeout();
              playChatSound('error');
            };

            ws.onclose = () => {
              if (!isMounted) return;
              setIsConnected(false);
              setIsConnecting(false);
              setIsLoading(false);
              clearLoadingTimeout();
              webSocketRef.current = null;
              setTimeout(() => {
                if (isMounted && document.visibilityState === 'visible') initializeWebSocket();
              }, 1500);
            };

            webSocketRef.current = ws;
          } catch {
            if (isMounted) {
              setIsConnected(false);
              setIsConnecting(false);
            }
          }
        };

        handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN)) {
            initializeWebSocket();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        initializeWebSocket();

        return () => {
          isMounted = false;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearLoadingTimeout();
          if (webSocketRef.current) {
            webSocketRef.current.close();
            webSocketRef.current = null;
          }
        };
      }, [isOpen, socketResetNonce, hasSession]);
                        components={{
                          p: ({ children }) => <p className="mb-1">{children}</p>,
                          code: ({ inline, children }) => inline ? <code className="bg-secondary bg-opacity-25 px-2 py-1 rounded">{children}</code> : <pre className="bg-secondary bg-opacity-25 p-2 rounded overflow-auto my-2"><code>{children}</code></pre>,
                          ul: ({ children }) => <ul className="ps-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="ps-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          a: ({ href, children }) => {
                            if (href === '#transfer') {
                              return <button onClick={(e) => { e.preventDefault(); openHumanSupportForm(); }} className="btn btn-sm btn-primary mt-2 mb-1 d-block chatbot-transfer-btn" type="button">{children}</button>;
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary">{children}</a>;
                          },
                          strong: ({ children }) => <strong>{children}</strong>,
                          em: ({ children }) => <em>{children}</em>
                        }}
                      >
                        {msg.text || ''}
                      </ReactMarkdown>
                    )}
                    {msg.timestamp && (
                      <small className="d-block text-end mt-1 text-muted opacity-75" style={{ fontSize: '0.7em' }}>
                        {formatTimestamp(msg.timestamp, false)}
                      </small>
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
            </div>
          </Card.Body>

          <div className="card-footer bg-white p-3 border-top flex-shrink-0 w-100">
            {renderHumanFormStep()}

            <Form onSubmit={handleSend} className="chatbot-input-form w-100 m-0">
              <div className="d-flex w-100 align-items-center gap-2">
                
                <div className="flex-grow-1">
                  {isRecording ? (
                    <div className="d-flex align-items-center w-100 text-danger animate__animated animate__fadeIn bg-light rounded-pill px-3" style={{ height: '42px' }}>
                      <span 
                        className="me-2" 
                        style={{ width: '10px', height: '10px', backgroundColor: '#dc3545', borderRadius: '50%', animation: 'pulse-red 1.5s infinite' }} 
                      />
                      <span className="fw-medium fs-6">{formatRecordingDuration(recordingSeconds)}</span>
                      <span className="ms-auto small text-muted">Recording...</span>
                    </div>
                  ) : (
                    <Form.Control
                      type="text"
                      placeholder={isConnected ? 'Type a message...' : 'Disconnected...'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={!isConnected && !isHumanMode}
                      className="border shadow-none px-3"
                      style={{
                        fontSize: '1rem',
                        background: 'var(--bs-body-bg, #fff)',
                        color: 'var(--bs-body-color, #212529)',
                        borderRadius: '21px',
                        height: '42px',
                        width: '100%',
                      }}
                      autoComplete="off"
                    />
                  )}
                </div>

                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  {input.trim() && !isRecording ? (
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={!isConnected && !isHumanMode}
                      className="rounded-circle d-flex align-items-center justify-content-center bg-navy border-0 shadow-sm p-0"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <BiSend size={20} />
                    </Button>
                  ) : (
                    isHumanMode && (
                      <Button
                        type="button"
                        variant={isRecording ? 'danger' : 'primary'}
                        className={`rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm p-0 ${!isRecording ? 'bg-navy' : ''}`}
                        style={{ width: '42px', height: '42px', transition: 'transform 0.2s', transform: isRecording ? 'scale(1.15)' : 'scale(1)' }}
                        onTouchStart={(e) => { e.preventDefault(); startVoiceRecording(); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopVoiceRecording(); }}
                        onClick={(e) => {
                          if (e.nativeEvent.pointerType === 'mouse' || !e.nativeEvent.pointerType) {
                            isRecording ? stopVoiceRecording() : startVoiceRecording();
                          }
                        }}
                        title={isRecording ? 'Stop recording' : 'Record voice message'}
                      >
                        {isRecording ? <BiStopCircle size={24} /> : <BiMicrophone size={24} />}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </Form>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Chatbot;