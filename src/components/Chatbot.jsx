import { useState, useRef, useEffect, useMemo } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { formatTimestamp } from '../utils/adminChatUtils';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiMicrophone, BiSend, BiStopCircle, BiTrash, BiX } from 'react-icons/bi';
import { BsChatFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './ChatbotFooterResponsive.css';

const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');
const CHAT_REQUEST_HUMAN_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/request-human`;
const CONTACT_CREATE_ENDPOINT = (import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact');
const CHAT_CLEAR_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/clear`;
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

const clearChatStorageForSession = (sessionId) => {
  if (!sessionId) return;
  localStorage.removeItem(getChatMessagesStorageKey(sessionId));

  const audioPrefix = `${CHATBOT_AUDIO_PREFIX}${sessionId}_`;
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(audioPrefix)) {
      localStorage.removeItem(key);
    }
  });
};

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
      clearChatStorageForSession(storedSessionId);
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
              setLeadSubmitStatus({ type: 'success', text: 'Chat cleared. Start a new conversation anytime.' });
              clearLoadingTimeout();
              setIsLoading(false);
              return;
            }

            if (data?.type === 'session_deleted') {
              const activeSession = sessionIdRef.current;
              if (activeSession) clearChatStorageForSession(activeSession);
              localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
              sessionIdRef.current = null;

              setMessages([defaultBotMessage]);
              setIsHumanMode(false);
              setShowHumanForm(false);
              setInput('');
              setLeadSubmitStatus({ type: 'success', text: 'Previous chat session was closed by admin. A new session will start now.' });
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
      resetHumanSupportForm();
    }
  };

  const startVoiceRecording = async () => {
    if (!isHumanMode || isRecording) return;
    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setLeadSubmitStatus({ type: 'error', text: 'Voice recording is not supported in this browser.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        clearRecordingTimer();

        if (!blob.size) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const audioBase64 = typeof reader.result === 'string' ? reader.result : '';
          if (!audioBase64) return;

          const messageId = getNextMessageId();
          const sessionId = sessionIdRef.current;
          const audioStorageKey = storeAudioForMessage(sessionId, messageId, audioBase64);

          setMessages((prev) => [
            ...prev,
            { id: messageId, sender: 'user', type: 'audio', mimeType: blob.type || 'audio/webm', audioStorageKey, timestamp: new Date().toISOString() }
          ]);

          sendSocketMessage({ type: 'audio', audio_base64: audioBase64, mime_type: blob.type || 'audio/webm', duration_seconds: null, timestamp: new Date().toISOString() });
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
      clearRecordingTimer();
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    clearRecordingTimer();
  };

  const handleClearChat = async () => {
    const activeSession = sessionIdRef.current;
    if (activeSession) {
      sendSocketMessage({ type: 'clear_chat', session_id: activeSession, timestamp: new Date().toISOString() });
      try { await fetch(CHAT_CLEAR_ENDPOINT(activeSession), { method: 'POST' }); } catch { /* ignore clear chat error */ }
      clearChatStorageForSession(activeSession);
    }

    localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
    sessionIdRef.current = null;

    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    setMessages([defaultBotMessage]);
    setShowHumanForm(false);
    setLeadSubmitStatus({ type: 'success', text: 'Chat cleared. A fresh session has started.' });
    setInput('');
    setIsHumanMode(false);
    setIsRecording(false);
    setIsLoading(false);
    setIsConnected(false);
    setIsConnecting(true);
    clearLoadingTimeout();
    clearRecordingTimer();

    if (isOpen) setSocketResetNonce((prev) => prev + 1);
  };

  // --- UI RENDERERS ---
  const renderHumanFormStep = () => {
    if (!showHumanForm) return null;
    return (
      <Form onSubmit={handleHumanFormSubmit} className="human-form mb-3 w-100">
        {leadSubmitStatus && (
          <div className={`alert py-2 px-2 mb-2 small ${leadSubmitStatus.type === 'success' ? 'alert-success' : leadSubmitStatus.type === 'error' ? 'alert-danger' : 'alert-info'}`} role="status">
            {leadSubmitStatus.text}
          </div>
        )}
        {humanFormStep === 0 && (
          <>
            <small className="d-block mb-2 text-muted">Step 1 of 3</small>
            <Form.Control className="mb-2" type="text" placeholder="Enter your full name" value={contactForm.name} onChange={(e) => handleContactFieldChange('name', e.target.value)} autoFocus />
            <Button type="submit" variant="primary" className="w-100 bg-navy border-0" disabled={!contactForm.name.trim()}>Continue</Button>
          </>
        )}
        {humanFormStep === 1 && (
          <>
            <small className="d-block mb-2 text-muted">Step 2 of 3</small>
            <Form.Control className="mb-2" type="email" placeholder="Enter your email (e.g., john@example.com)" value={contactForm.email} onChange={(e) => handleContactFieldChange('email', e.target.value)} autoFocus />
            <Button type="submit" variant="primary" className="w-100 bg-navy border-0" disabled={!contactForm.email.trim()}>Next</Button>
          </>
        )}
        {humanFormStep === 2 && (
          <>
            <small className="d-block mb-2 text-muted">Step 3 of 3</small>
            <div className="mb-2" style={{ color: '#000' }}>
              <PhoneInput
                country={contactForm.countryCode.replace('+', '') || 'ng'}
                value={contactForm.countryCode + contactForm.phone}
                onChange={(value, data) => {
                  const code = data.dialCode ? `+${data.dialCode}` : '';
                  const local = value.replace(data.dialCode, '').replace(/^\+/, '');
                  setContactForm((prev) => ({ ...prev, countryCode: code, phone: local }));
                }}
                inputClass="form-control"
                inputStyle={{ width: '100%', height: '38px', borderRadius: '0.375rem' }}
                buttonClass="bg-light border-secondary"
                containerClass="w-100"
                disableDropdown={false}
                enableSearch={true}
                autoFormat={true}
                placeholder="Enter phone number"
                countryCodeEditable={true}
              />
            </div>
            <Button type="submit" variant="success" className="w-100 bg-navy border-0" disabled={!contactForm.phone.trim() || isLeadSubmitting}>
              {isLeadSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}
      </Form>
    );
  };

  return (
    <>
      <div className={`chatbot-fab-wrapper ${isOpen ? 'is-open' : ''}`}>
        <Button
          className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg bg-navy"
          onClick={toggleChat}
          aria-label="Toggle Chat"
          title={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? <BiX size={26} /> : <BsChatFill size={22} />}
        </Button>
        <span
          className={`chatbot-status-dot ${isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'}`}
          title={isConnecting ? 'Connecting…' : isConnected ? 'Online' : 'Offline'}
        />
      </div>

      <div
        className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}
        tabIndex={-1}
      >
        <Card className="h-100 border-0 overflow-hidden d-flex flex-column w-100 bg-transparent">
          
          <div className="chatbot-header d-flex align-items-center justify-content-between p-3 gap-3 bg-navy flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <span className={`chatbot-status-dot chatbot-status-dot--lg ${isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'}`} />
              <div>
                <h6 className="mb-0 fw-600 text-white lh-1">Chat Support</h6>
                <small className={`lh-1 ${isConnecting ? 'text-warning' : isConnected ? 'text-success' : 'text-danger'} opacity-90`}>
                  {isConnecting ? 'Connecting…' : isConnected ? 'Online' : 'Offline'}
                </small>
              </div>
            </div>
            <button onClick={toggleChat} className="btn btn-sm text-white p-0 chatbot-close-btn" aria-label="Close chat" type="button">
              <BiX size={22} />
            </button>
          </div>

          <Card.Body
            className="chat-messages overflow-auto flex-grow-1 px-3 py-3"
            style={{
              background: '#f7f8fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div className="quick-questions-drawer mb-3">
              <button
                className="btn btn-link px-0 mb-1"
                style={{ fontSize: '1rem', color: '#0d6efd', textDecoration: 'none' }}
                onClick={() => setIsDrawerOpen((open) => !open)}
                aria-expanded={isDrawerOpen}
              >
                {isDrawerOpen ? 'Hide Quick Questions ▲' : 'Show Quick Questions ▼'}
              </button>
              {isDrawerOpen && (
                <div>
                  <small className="text-muted d-block mb-2">Quick questions:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleSuggestedQuestion(question);
                          setIsDrawerOpen(false);
                        }}
                        disabled={!isConnected}
                        className="btn btn-sm chatbot-quick-btn text-start text-wrap"
                        style={{ fontSize: '0.8rem' }}
                      >
                        {question}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        openHumanSupportForm();
                        setIsDrawerOpen(false);
                      }}
                      className="btn btn-sm chatbot-transfer-btn text-start text-wrap"
                      style={{ fontSize: '0.8rem' }}
                      type="button"
                    >
                      Transfer to Muyiwa
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              onClick={() => isDrawerOpen && setIsDrawerOpen(false)}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`d-flex gap-2 ${msg.sender === 'user' ? 'justify-content-end' : ''}`} style={{ width: '100%' }}>
                  <div
                    className={`py-2 px-3 rounded-lg ${msg.sender === 'user' ? 'bg-navy text-white' : 'bg-light text-dark'}`}
                    style={{
                      maxWidth: '90%',
                      minWidth: '30px',
                      borderRadius: 14,
                      fontSize: '1rem',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    {msg.type === 'audio' ? (
                      <audio controls preload="metadata" style={{ width: '220px', maxWidth: '100%' }} src={resolveAudioSource(msg)} />
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
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

          <div className="card-footer bg-white p-3 border-top flex-shrink-0 w-100 chatbot-footer-responsive">
            {/* Responsive fix for chatbot footer on mobile */}
            
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
                  
                  {!isRecording && (
                    <Button
                      type="button"
                      variant="light"
                      onClick={handleClearChat}
                      title="Clear chat"
                      className="rounded-circle d-flex align-items-center justify-content-center shadow-sm border p-0 bg-light text-dark"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <BiTrash size={20} />
                    </Button>
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