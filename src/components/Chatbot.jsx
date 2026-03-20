import { useState, useRef, useEffect, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { BiMicrophone, BiSend, BiStopCircle, BiTrash, BiX } from 'react-icons/bi';
import { BsChatFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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

const COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 US/CA (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
  { code: '+234', label: '🇳🇬 Nigeria (+234)' },
  { code: '+91', label: '🇮🇳 India (+91)' },
  { code: '+971', label: '🇦🇪 UAE (+971)' },
  { code: '+49', label: '🇩🇪 Germany (+49)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+27', label: '🇿🇦 South Africa (+27)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
  { code: '+81', label: '🇯🇵 Japan (+81)' }
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([defaultBotMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);
  const loadingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const typingSoundIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const pendingReachSupportTriggerRef = useRef(false);

  const suggestedQuestions = [
    'What are your key skills?',
    'Tell me about recent projects',
    'How can I reach you?'
  ];

  const selectedCountry = useMemo(
    () => COUNTRY_CODES.find((item) => item.code === contactForm.countryCode) || COUNTRY_CODES[0],
    [contactForm.countryCode]
  );

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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
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
    const normalizedCompact = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const directTriggers = [
      'human mode',
      'human support',
      'live support',
      'live chat',
      'real person',
      'customer support',
      'technical support',
      'support agent',
      'transfer me',
      'escalate this',
      'connect with muyiwa',
      'connect me with muyiwa',
      'talk to muyiwa',
      'speak with muyiwa',
      'contact muyiwa',
      'reach muyiwa',
      'chat with muyiwa',
      'message muyiwa'
    ];

    if (directTriggers.some((trigger) => normalizedCompact.includes(trigger))) {
      return true;
    }

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
    setContactForm({
      name: '',
      email: '',
      countryCode: '+234',
      phone: ''
    });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  useEffect(() => {
    if (!leadSubmitStatus || leadSubmitStatus.type === 'pending') return undefined;

    const timer = setTimeout(() => {
      setLeadSubmitStatus(null);
    }, 7000);

    return () => clearTimeout(timer);
  }, [leadSubmitStatus]);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    persistMessagesForSession(sessionId, messages);
  }, [messages]);

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
        resetHumanSupportForm();
      }
      return nextOpen;
    });
  };

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

  useEffect(() => () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
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

    const resolveSessionId = async () => {
      const storedSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
      if (!storedSessionId) {
        return generateSessionId();
      }

      try {
        const response = await fetch(CHAT_SESSION_STATUS_ENDPOINT(storedSessionId));
        if (!response.ok) {
          return storedSessionId;
        }

        const data = await response.json();
        if (data?.exists) {
          return storedSessionId;
        }
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
                  id: nextId,
                  sender,
                  type: 'audio',
                  mimeType: data.mime_type || 'audio/webm',
                  audioStorageKey,
                  timestamp: data.timestamp || new Date().toISOString()
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
              if (activeSession) {
                clearChatStorageForSession(activeSession);
              }

              localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
              sessionIdRef.current = null;

              setMessages([defaultBotMessage]);
              setIsHumanMode(false);
              setShowHumanForm(false);
              setInput('');
              setLeadSubmitStatus({
                type: 'success',
                text: 'Previous chat session was closed by admin. A new session will start now.'
              });
              clearLoadingTimeout();
              setIsLoading(false);
              setIsConnected(false);
              setIsConnecting(true);

              if (webSocketRef.current) {
                webSocketRef.current.close();
                webSocketRef.current = null;
              }

              setSocketResetNonce((prev) => prev + 1);
              return;
            }

            const content = data.content || data.message || event.data;
            const sender = data.role === 'admin' ? 'admin' : 'bot';
            setMessages((prev) => [...prev, { id: getNextMessageId(), text: content, sender, type: 'text' }]);

            if (sender === 'admin') {
              setIsHumanMode(true);
            }

            if (pendingReachSupportTriggerRef.current && sender === 'bot') {
              pendingReachSupportTriggerRef.current = false;
              setShowHumanForm(true);
              setHumanFormStep(0);
              setLeadSubmitStatus(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: getNextMessageId(),
                  text: 'Sure — I can connect you to human support. Please enter your details step by step below.',
                  sender: 'bot'
                }
              ]);
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
        };

        webSocketRef.current = ws;
      } catch {
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
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }
    };
  }, [isOpen, socketResetNonce]);

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
    const sessionId = sessionIdRef.current;
    const parserFriendlyMessage = `Name: ${name} | Email: ${email} | Phone: ${fullPhone}`;
    const transferPayload = {
      name,
      user_name: name,
      requester_name: name,
      email,
      user_email: email,
      phone: fullPhone,
      phone_number: fullPhone,
      contact_phone: fullPhone,
      phone_e164: fullPhone,
      country_code: countryCode,
      phone_local: localPhone,
      message: parserFriendlyMessage,
      details: detailsMessage,
      notes: detailsMessage,
      subject: 'Transfer Request',
      type: 'request_human',
      source: 'portfolio-frontend',
      timestamp: new Date().toISOString()
    };

    if (sessionId) {
      try {
        const response = await fetch(CHAT_REQUEST_HUMAN_ENDPOINT(sessionId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transferPayload)
        });

        if (response.ok) {
          return true;
        }
      } catch {
        // fallback below
      }
    }

    try {
      const response = await fetch(`${CHAT_API_BASE}${CONTACT_CREATE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: 'Transfer Request',
          message: `${parserFriendlyMessage}\n\n${detailsMessage}`
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const openHumanSupportForm = () => {
    if (!showHumanForm) {
      setShowHumanForm(true);
      setHumanFormStep(0);
      setLeadSubmitStatus(null);
      setMessages((prev) => [
        ...prev,
        {
          id: getNextMessageId(),
          text: 'Sure — I can connect you to human support. Please enter your details step by step below.',
          sender: 'bot'
        }
      ]);

      if (!isConnected) {
        setMessages((prev) => [
          ...prev,
          {
            id: getNextMessageId(),
            text: 'Live chat is currently offline, but you can still submit this form and Muyiwa will be notified directly.',
            sender: 'bot'
          }
        ]);
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
    }

    if (!isConnected && !wantsHumanSupport) {
      setMessages((prev) => [
        ...prev,
        {
          id: getNextMessageId(),
          text: 'Chat is currently offline. You can use the “Transfer to Muyiwa” button below to send your details directly.',
          sender: 'bot'
        }
      ]);
      return;
    }

    if (isConnected && sendSocketMessage(messageText)) {
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

  const handleContactFieldChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleHumanFormSubmit = async (e) => {
    e.preventDefault();

    if (humanFormStep === 0) {
      const trimmedName = contactForm.name.trim();
      if (!trimmedName) return;

      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: trimmedName, sender: 'user' },
        {
          id: getNextMessageId(),
          text: "Got it! Now, what's your email address? (e.g., john@example.com)",
          sender: 'bot'
        }
      ]);
      playChatSound('send');
      setHumanFormStep(1);
      return;
    }

    if (humanFormStep === 1) {
      const trimmedEmail = contactForm.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setMessages((prev) => [
          ...prev,
          {
            id: getNextMessageId(),
            text: 'Please enter a valid email address (e.g., john@example.com)',
            sender: 'bot'
          }
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: trimmedEmail, sender: 'user' },
        {
          id: getNextMessageId(),
          text: "Perfect! Finally, choose your country code and enter your phone number.",
          sender: 'bot'
        }
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
        type: 'HUMAN_SUPPORT_REQUEST',
        version: 3,
        schema: 'human_support_lead',
        name: trimmedName,
        email: trimmedEmail,
        country_code: contactForm.countryCode,
        phone_local: localPhone,
        phone: fullPhone,
        phone_e164: fullPhone,
        message: detailsMessage,
        source: 'portfolio-frontend',
        timestamp: new Date().toISOString()
      };

      const legacyPayload = `HUMAN_SUPPORT_REQUEST\n${detailsMessage}`;

      setMessages((prev) => [
        ...prev,
        { id: getNextMessageId(), text: detailsMessage, sender: 'user' },
        {
          id: getNextMessageId(),
          text: 'Perfect! Your details have been captured. A human support representative will reach out to you shortly. Thank you!',
          sender: 'bot'
        }
      ]);
      playChatSound('send');

      setIsLeadSubmitting(true);
      setLeadSubmitStatus({ type: 'pending', text: 'Sending details to support...' });

      const leadSaved = await submitHumanSupportLead({
        name: trimmedName,
        email: trimmedEmail,
        countryCode: contactForm.countryCode,
        localPhone,
        fullPhone,
        detailsMessage
      });

      if (leadSaved) {
        setLeadSubmitStatus({ type: 'success', text: 'Details sent successfully.' });
      } else {
        setLeadSubmitStatus({ type: 'error', text: 'Could not confirm delivery. Please try again.' });
        setMessages((prev) => [
          ...prev,
          {
            id: getNextMessageId(),
            text: 'I could not confirm lead delivery to the support inbox. Please submit again or use the contact page.',
            sender: 'bot'
          }
        ]);
      }

      setIsLeadSubmitting(false);

      if (!sendSocketMessage(humanSupportPayload)) {
        sendSocketMessage(legacyPayload);
      }

      setIsHumanMode(true);

      resetHumanSupportForm();
    }
  };

  const renderHumanFormStep = () => {
    if (!showHumanForm) return null;

    return (
      <Form onSubmit={handleHumanFormSubmit} className="human-form mb-3">
        {leadSubmitStatus && (
          <div
            className={`alert py-2 px-2 mb-2 small ${
              leadSubmitStatus.type === 'success'
                ? 'alert-success'
                : leadSubmitStatus.type === 'error'
                  ? 'alert-danger'
                  : 'alert-info'
            }`}
            role="status"
          >
            {leadSubmitStatus.text}
          </div>
        )}

        {humanFormStep === 0 && (
          <>
            <small className="d-block mb-2 text-muted">Step 1 of 3</small>
            <Form.Control
              className="mb-2"
              type="text"
              placeholder="Enter your full name"
              value={contactForm.name}
              onChange={(e) => handleContactFieldChange('name', e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="primary" className="w-100" disabled={!contactForm.name.trim()}>
              Continue
            </Button>
          </>
        )}

        {humanFormStep === 1 && (
          <>
            <small className="d-block mb-2 text-muted">Step 2 of 3</small>
            <Form.Control
              className="mb-2"
              type="email"
              placeholder="Enter your email (e.g., john@example.com)"
              value={contactForm.email}
              onChange={(e) => handleContactFieldChange('email', e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="primary" className="w-100" disabled={!contactForm.email.trim()}>
              Next
            </Button>
          </>
        )}

        {humanFormStep === 2 && (
          <>
            <small className="d-block mb-2 text-muted">Step 3 of 3</small>
            <div className="d-flex gap-2 mb-2">
              <Form.Select
                style={{ maxWidth: '48%' }}
                value={contactForm.countryCode}
                onChange={(e) => handleContactFieldChange('countryCode', e.target.value)}
                aria-label="Select country code"
              >
                {COUNTRY_CODES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                type="tel"
                placeholder="Phone number"
                value={contactForm.phone}
                onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                autoFocus
              />
            </div>
            <small className="d-block mb-2 text-muted">
              Selected: {selectedCountry.label}
            </small>
            <Button type="submit" variant="success" className="w-100" disabled={!contactForm.phone.trim() || isLeadSubmitting}>
              {isLeadSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}
      </Form>
    );
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
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

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
            {
              id: messageId,
              sender: 'user',
              type: 'audio',
              mimeType: blob.type || 'audio/webm',
              audioStorageKey,
              timestamp: new Date().toISOString()
            }
          ]);

          sendSocketMessage({
            type: 'audio',
            audio_base64: audioBase64,
            mime_type: blob.type || 'audio/webm',
            duration_seconds: null,
            timestamp: new Date().toISOString()
          });
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setLeadSubmitStatus({ type: 'error', text: 'Microphone access was denied.' });
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleClearChat = async () => {
    const activeSession = sessionIdRef.current;

    if (activeSession) {
      sendSocketMessage({ type: 'clear_chat', session_id: activeSession, timestamp: new Date().toISOString() });
      try {
        await fetch(CHAT_CLEAR_ENDPOINT(activeSession), { method: 'POST' });
      } catch {
        // WebSocket clear event already sent; ignore network fallback failures.
      }
    }

    if (activeSession) {
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

    if (isOpen) {
      setSocketResetNonce((prev) => prev + 1);
    }
  };

  return (
    <>
      <div className={`chatbot-fab-wrapper ${isOpen ? 'is-open' : ''}`}>
        <Button
          className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg"
          onClick={toggleChat}
          aria-label="Toggle Chat"
          title={isOpen ? 'Close chat' : 'Open chat'}
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

      <div className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}>
        <Card className="h-100 border-0 overflow-hidden d-flex flex-column">
          <div className="chatbot-header d-flex align-items-center justify-content-between p-3 gap-3">
            <div className="d-flex align-items-center gap-2">
              <span
                className={`chatbot-status-dot chatbot-status-dot--lg ${
                  isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'
                }`}
              />
              <div>
                <h6 className="mb-0 fw-600 text-white lh-1">Chat Support</h6>
                <small className={`lh-1 ${isConnecting ? 'text-warning' : isConnected ? 'text-success' : 'text-danger'} opacity-90`}>
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

          <Card.Body className="chat-messages overflow-auto p-3 flex-grow-1">
            <div className="quick-questions-sticky mb-3">
              <small className="text-muted d-block mb-2">Quick questions:</small>
              <div className="d-flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={!isConnected}
                    className="btn btn-sm chatbot-quick-btn text-start text-wrap"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {question}
                  </button>
                ))}
                <button
                  onClick={openHumanSupportForm}
                  className="btn btn-sm chatbot-transfer-btn text-start text-wrap"
                  style={{ fontSize: '0.8rem' }}
                  type="button"
                >
                  Transfer to Muyiwa
                </button>
              </div>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`d-flex mb-3 gap-2 ${msg.sender === 'user' ? 'justify-content-end' : ''}`}>
                <div
                  className={`py-2 px-3 rounded-lg ${msg.sender === 'user' ? 'bg-navy text-white' : 'bg-light text-dark'}`}
                  style={{ maxWidth: '80%', borderRadius: '12px' }}
                >
                  {msg.type === 'audio' ? (
                    <audio
                      controls
                      preload="metadata"
                      style={{ width: '220px', maxWidth: '100%' }}
                      src={resolveAudioSource(msg)}
                    />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        code: ({ inline, children }) =>
                          inline ? (
                            <code className="bg-secondary bg-opacity-25 px-2 py-1 rounded">{children}</code>
                          ) : (
                            <pre className="bg-secondary bg-opacity-25 p-2 rounded overflow-auto my-2">
                              <code>{children}</code>
                            </pre>
                          ),
                        ul: ({ children }) => <ul className="ps-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="ps-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ href, children }) => {
                        // Intercept the special #transfer link from the AI and render a UI button instead
                        if (href === '#transfer') {
                          return (
                            <button
                              onClick={(e) => {
                              e.preventDefault();
                              openHumanSupportForm();
                              }}
                              className="btn btn-sm btn-primary mt-2 mb-1 d-block chatbot-transfer-btn"
                              type="button"
                            >
                              {children}
                            </button>
                            );
                          }
  
                        // Standard links
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary">
                            {children}
                            </a>
                          );
                        },
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>
                      }}
                    >
                      {msg.text || ''}
                    </ReactMarkdown>
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

          <div className="card-footer bg-white border-top p-2">
            {renderHumanFormStep()}

            {!showHumanForm && leadSubmitStatus && (
              <div
                className={`alert py-2 px-2 mb-2 small ${
                  leadSubmitStatus.type === 'success'
                    ? 'alert-success'
                    : leadSubmitStatus.type === 'error'
                      ? 'alert-danger'
                      : 'alert-info'
                }`}
                role="status"
              >
                {leadSubmitStatus.text}
              </div>
            )}

            {isRecording && (
              <div className="chat-recording-indicator mb-2">
                <span className="chat-recording-dot" /> Recording in progress — speak now.
              </div>
            )}

            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control
                placeholder={isConnected ? 'Type a message...' : 'Disconnected...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                disabled={false}
                className="border rounded-lg bg-light chatbot-message-input"
                style={{ fontSize: '0.9rem', color: '#333' }}
                rows="1"
              />
              {isHumanMode && (
                <Button
                  type="button"
                  variant={isRecording ? 'danger' : 'outline-primary'}
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                  className="px-2"
                >
                  {isRecording ? <BiStopCircle /> : <BiMicrophone />}
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={!input.trim()} className="bg-navy border-0 px-3">
                <BiSend />
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleClearChat}
                title="Clear chat"
                className="px-2"
              >
                <BiTrash />
              </Button>
            </Form>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Chatbot;