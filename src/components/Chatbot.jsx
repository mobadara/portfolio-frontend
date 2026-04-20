import { useState, useRef, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import { formatTimestamp } from '../utils/adminChatUtils';
import EmojiPicker from 'emoji-picker-react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { BiMicrophone, BiSend, BiStopCircle, BiX, BiSmile, BiPaperclip, BiReply, BiImage, BiFile } from 'react-icons/bi';
import { BsChatFill } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const CHAT_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');
const CHAT_REQUEST_HUMAN_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/request-human`;
const CHAT_CLEAR_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/clear`;
const CHAT_ATTACHMENT_UPLOAD_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/attachment`;
const CONTACT_CREATE_ENDPOINT = (import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact');
const CHAT_SESSION_STATUS_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/status`;
const CHAT_SESSION_HISTORY_ENDPOINT = (sessionId) => `${CHAT_API_BASE}/chat/${sessionId}/history`;
const CHATBOT_SESSION_STORAGE_KEY = 'portfolio_chatbot_session_id';
const CHATBOT_AUDIO_PREFIX = 'portfolio_chatbot_audio_';
const CHATBOT_MESSAGES_PREFIX = 'portfolio_chatbot_messages_';
const CHATBOT_LEAD_SUBMITTED_KEY = 'portfolio_chatbot_lead_submitted';
const CHATBOT_LEAD_DETAILS_KEY = 'portfolio_chatbot_lead_details';
const CHATBOT_LAST_PAGE_EXIT_AT_KEY = 'portfolio_chatbot_last_page_exit_at';
const CHATBOT_AUTO_PROMPT_KEY = 'portfolio_chatbot_auto_prompt_seen_v1';
const CHATBOT_AUTO_PROMPT_DELAY_MS = 25000;
const CHATBOT_IDLE_RESET_TIMEOUT_MS = (() => {
  const configuredMinutes = Number(import.meta?.env?.VITE_CHATBOT_IDLE_RESET_MINUTES ?? 7);
  if (!Number.isFinite(configuredMinutes) || configuredMinutes <= 0) return 7 * 60 * 1000;
  return configuredMinutes * 60 * 1000;
})();
const defaultBotMessage = { id: 1, text: "Hi! I'm Muyiwa's AI Assistant. How can I help you today?", sender: 'bot', type: 'text' };

const generateSessionId = () => {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString().slice(2, 9);
  return (timestamp + randomPart).slice(0, 16).padEnd(16, '0');
};

const getChatMessagesStorageKey = (sessionId) => `${CHATBOT_MESSAGES_PREFIX}${sessionId}`;
const getChatAudioStorageKey = (sessionId, messageId) => `${CHATBOT_AUDIO_PREFIX}${sessionId}_${messageId}`;

const normalizeReplyPayload = (replyTo) => {
  if (!replyTo || typeof replyTo !== 'object') return null;
  const previewText = String(replyTo.previewText || replyTo.preview_text || replyTo.text || replyTo.content || '').trim();
  const sender = String(replyTo.sender || '').trim();
  const normalized = {
    id: replyTo.id ?? null,
    sender: sender || null,
    previewText: previewText || null,
  };

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== null && value !== '')) || null;
};

const normalizeAttachmentPayload = (attachment) => {
  if (!attachment || typeof attachment !== 'object') return null;
  const fileName = String(attachment.file_name || attachment.name || '').trim();
  const mimeType = String(attachment.mime_type || attachment.type || '').trim();
  const dataUrl = String(attachment.data_url || attachment.dataUrl || attachment.url || '').trim();
  const previewType = String(attachment.preview_type || attachment.previewType || '').trim() || (mimeType.startsWith('image/') ? 'image' : mimeType ? 'document' : '');
  const normalized = {
    file_name: fileName || null,
    mime_type: mimeType || null,
    size_bytes: attachment.size_bytes ?? attachment.sizeBytes ?? null,
    data_url: dataUrl || null,
    preview_type: previewType || null,
  };

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== null && value !== '')) || null;
};

const parseStructuredChatPayload = (rawValue) => {
  const rawContent = typeof rawValue === 'string' ? rawValue : '';
  if (!rawContent) return null;

  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.type === 'audio' && parsed.audio_base64) {
      return {
        kind: 'audio',
        mimeType: parsed.mime_type || 'audio/webm',
        audioData: parsed.audio_base64,
        timestamp: parsed.timestamp || new Date().toISOString()
      };
    }

    const attachment = normalizeAttachmentPayload(parsed.attachment);
    const replyTo = normalizeReplyPayload(parsed.reply_to);
    const text = String(parsed.content || parsed.text || parsed.caption || '').trim();

    return {
      kind: attachment ? 'attachment' : 'text',
      text,
      attachment,
      replyTo,
      timestamp: parsed.timestamp || new Date().toISOString()
    };
  } catch {
    return null;
  }
};

const parseResumeSessionFromUrl = () => {
  if (typeof window === 'undefined') return { sessionId: '', shouldOpen: false };

  const params = new URLSearchParams(window.location.search);
  const sessionId = String(params.get('chat_session') || '').trim();
  const shouldOpen = params.get('open_chat') === '1';

  if (!sessionId) return { sessionId: '', shouldOpen: false };

  const sanitized = sessionId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return { sessionId: sanitized, shouldOpen };
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
  reader.onerror = () => reject(new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

const formatFileSize = (sizeBytes) => {
  const value = Number(sizeBytes || 0);
  if (!Number.isFinite(value) || value <= 0) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
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
  const [isHumanMode, setIsHumanMode] = useState(false); // Strictly defaults to AI mode
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
  const [awaitingTransferConfirmation, setAwaitingTransferConfirmation] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const webSocketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const messageIdRef = useRef(2);
  const loadingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const pendingReachSupportTriggerRef = useRef(false);
  const resumeSessionRef = useRef(parseResumeSessionFromUrl());
  const shouldResetModeOnConnectRef = useRef(false);

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

  const clearChatStorageForSession = (sessionId) => {
    if (!sessionId) return;
    localStorage.removeItem(getChatMessagesStorageKey(sessionId));
    const prefix = `${CHATBOT_AUDIO_PREFIX}${sessionId}_`;
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => localStorage.removeItem(key));
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

  const requestHumanModeActivation = async (leadPayload = {}) => {
    const sessionId = sessionIdRef.current || localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
    if (!sessionId) return false;

    try {
      const response = await fetch(CHAT_REQUEST_HUMAN_ENDPOINT(sessionId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadPayload,
          type: 'request_human',
          source: 'portfolio-frontend'
        })
      });

      if (response.ok) {
        setHasSession(true);
        setIsHumanMode(true);
        return true;
      }
    } catch {
      // Fall through to the optimistic UI update below.
    }

    setHasSession(true);
    setIsHumanMode(true);
    return false;
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
          text: 'The AI is taking longer than expected. If you were previously waiting for a human agent, your message may be queued for them. You can wait, or click "Clear Session" from the Quick Actions menu to restart the chat.',
          sender: 'bot'
        }
      ]);
    }, 12000); // Shorter timeout for better UX
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

  const getMessageSenderLabel = (sender) => {
    if (sender === 'user') return 'You';
    if (sender === 'admin') return 'Admin';
    return 'Muyiwa AI';
  };

  const getReplyPreviewText = (text = '', maxLen = 64) => {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}...` : normalized;
  };

  const renderReplyQuote = (replyTarget, isOutgoing = false) => {
    if (!replyTarget?.previewText) return null;

    const quoteBg = isOutgoing ? 'rgba(255,255,255,0.14)' : 'rgba(0,168,132,0.12)';
    const quoteBorder = isOutgoing ? 'rgba(255,255,255,0.55)' : '#00a884';
    const quoteLabel = replyTarget.sender ? getMessageSenderLabel(replyTarget.sender) : 'Message';

    return (
      <div
        className="mb-2 px-2 py-1 rounded-2"
        style={{
          borderLeft: `3px solid ${quoteBorder}`,
          background: quoteBg,
          lineHeight: 1.2
        }}
      >
        <small className="d-block fw-semibold" style={{ opacity: 0.9 }}>
          Replying to {quoteLabel}
        </small>
        <small className="d-block text-truncate" style={{ opacity: 0.95 }}>
          {replyTarget.previewText}
        </small>
      </div>
    );
  };

  const handleEmojiPick = (emojiData) => {
    const emoji = emojiData?.emoji || '';
    if (!emoji) return;
    setInput((prev) => `${prev}${emoji}`);
  };

  const handleAttachFile = (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetReplyTarget = (msg) => {
    if (!msg) return;
    const attachmentName = msg.attachment?.file_name || msg.fileName || '';
    setReplyToMessage({
      id: msg.id,
      sender: msg.sender,
      previewText: getReplyPreviewText(msg.text || (attachmentName ? `Attachment: ${attachmentName}` : 'Voice message'))
    });
  };

  const openChatPanel = () => {
    setLeadSubmitStatus(null);
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      setIsConnecting(true);
    }
    setShowHumanForm(false);
    setAwaitingTransferConfirmation(false);
    setIsOpen(true);
  };

  const closeChatPanel = () => {
    setLeadSubmitStatus(null);
    setIsLoading(false);
    setIsRecording(false);
    clearLoadingTimeout();
    clearRecordingTimer();
    setIsOpen(false);
  };

  const toggleChat = () => {
    if (isOpen) {
      closeChatPanel();
      return;
    }
    openChatPanel();
  };

  // --- USE EFFECTS ---
  useEffect(scrollToBottom, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (!leadSubmitStatus || leadSubmitStatus.type === 'pending') return undefined;
    const timer = setTimeout(() => setLeadSubmitStatus(null), 7000);
    return () => clearTimeout(timer);
  }, [leadSubmitStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const markPageExit = () => {
      localStorage.setItem(CHATBOT_LAST_PAGE_EXIT_AT_KEY, String(Date.now()));
    };

    window.addEventListener('pagehide', markPageExit);
    window.addEventListener('beforeunload', markPageExit);

    return () => {
      window.removeEventListener('pagehide', markPageExit);
      window.removeEventListener('beforeunload', markPageExit);
    };
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    persistMessagesForSession(sessionId, messages);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      clearRecordingTimer();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const hasShownPrompt = localStorage.getItem(CHATBOT_AUTO_PROMPT_KEY) === 'true';
    if (hasShownPrompt) return undefined;

    const autoPromptTimer = setTimeout(() => {
      playChatSound('receive');
      setShowWelcomeModal(true);
      openChatPanel();
      localStorage.setItem(CHATBOT_AUTO_PROMPT_KEY, 'true');
    }, CHATBOT_AUTO_PROMPT_DELAY_MS);

    return () => clearTimeout(autoPromptTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let handleVisibilityChange;

    const resolveSessionId = async () => {
      const resumeSessionId = resumeSessionRef.current.sessionId;
      if (resumeSessionId) {
        const previousSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
        if (previousSessionId && previousSessionId !== resumeSessionId) {
          clearChatStorageForSession(previousSessionId);
        }

        localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
        localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
        localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
        localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, resumeSessionId);

        return resumeSessionId;
      }

      const storedSessionId = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
      if (!storedSessionId) return generateSessionId();

      const lastExitRaw = localStorage.getItem(CHATBOT_LAST_PAGE_EXIT_AT_KEY);
      const lastExitAt = Number(lastExitRaw || 0);
      const shouldResetForIdle = Number.isFinite(lastExitAt)
        && lastExitAt > 0
        && (Date.now() - lastExitAt >= CHATBOT_IDLE_RESET_TIMEOUT_MS);

      shouldResetModeOnConnectRef.current = Boolean(shouldResetForIdle);
      localStorage.removeItem(CHATBOT_LAST_PAGE_EXIT_AT_KEY);

      if (shouldResetForIdle) {
        localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
        localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
      }
      
      try {
        const response = await fetch(CHAT_SESSION_STATUS_ENDPOINT(storedSessionId));
        if (!response.ok) return storedSessionId; 
        const data = await response.json();
        if (data?.exists) {
          setHasSession(true);
          setIsHumanMode(shouldResetForIdle ? false : Boolean(data?.human_mode));
          return storedSessionId;
        }
      } catch {
        return storedSessionId;
      }
      
      // Clear data if backend rejected the session
      localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
      localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
      localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
      setHasSession(false);
      return generateSessionId();
    };

    const initializeWebSocket = async () => {
      const sessionId = await resolveSessionId();
      if (!isMounted) return;

      sessionIdRef.current = sessionId;
      localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, sessionId);

      const restoredMessages = loadMessagesForSession(sessionId);
      let initialMessages = restoredMessages;

      if (resumeSessionRef.current.sessionId) {
        try {
          const historyResponse = await fetch(CHAT_SESSION_HISTORY_ENDPOINT(sessionId));
          const historyData = await historyResponse.json();
          const historyMessages = Array.isArray(historyData?.messages) ? historyData.messages : [];

          if (historyMessages.length > 0) {
            const hydrated = historyMessages.map((entry) => {
              const role = entry?.role === 'user' ? 'user' : 'bot';
              const timestamp = entry?.timestamp || new Date().toISOString();
              const structured = parseStructuredChatPayload(entry?.content || '');

              if (structured?.kind === 'audio') {
                return {
                  id: getNextMessageId(),
                  sender: role,
                  type: 'audio',
                  mimeType: structured.mimeType,
                  audioData: structured.audioData,
                  timestamp: structured.timestamp || timestamp
                };
              }

              if (structured) {
                return {
                  id: getNextMessageId(),
                  sender: role,
                  text: structured.text,
                  type: structured.kind,
                  fileName: structured.attachment?.file_name || null,
                  fileType: structured.attachment?.mime_type || null,
                  fileDataUrl: structured.attachment?.data_url || null,
                  attachment: structured.attachment,
                  replyTo: structured.replyTo,
                  timestamp: structured.timestamp || timestamp
                };
              }

              return {
                id: getNextMessageId(),
                sender: role,
                text: entry?.content || '',
                type: 'text',
                timestamp
              };
            }).filter(Boolean);

            initialMessages = hydrated.length > 0 ? hydrated : [defaultBotMessage];
          } else {
            initialMessages = [defaultBotMessage];
          }

          persistMessagesForSession(sessionId, initialMessages);
        } catch {
          initialMessages = restoredMessages;
        }
      }

      setMessages(initialMessages);

      const maxId = initialMessages.reduce((acc, item) => Math.max(acc, Number(item?.id || 0)), 0);
      messageIdRef.current = Math.max(maxId + 1, 2);

      if (resumeSessionRef.current.sessionId) {
        setHasSession(true);
        setAwaitingTransferConfirmation(false);
        setShowHumanForm(false);

        try {
          const statusResponse = await fetch(CHAT_SESSION_STATUS_ENDPOINT(resumeSessionRef.current.sessionId));
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData?.exists) {
              setIsHumanMode(Boolean(statusData?.human_mode));
            }
          }
        } catch {
          // Keep the existing local mode if the status check fails.
        }

        if (resumeSessionRef.current.shouldOpen) {
          setIsOpen(true);
          setShowWelcomeModal(false);
        }

        if (typeof window !== 'undefined') {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('chat_session');
          currentUrl.searchParams.delete('open_chat');
          window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        }

        resumeSessionRef.current = { sessionId: '', shouldOpen: false };
      }

      const wsBase = CHAT_API_BASE.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/chat/${sessionId}`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isMounted) {
            setIsConnected(true);
            setIsConnecting(false);
          }

          if (shouldResetModeOnConnectRef.current && sessionIdRef.current) {
            try {
              ws.send(JSON.stringify({
                type: 'leave_human_mode',
                session_id: sessionIdRef.current,
                reason: 'idle_timeout'
              }));
              shouldResetModeOnConnectRef.current = false;
              setIsHumanMode(false);
              setAwaitingTransferConfirmation(false);
              setShowHumanForm(false);
              localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
              localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
            } catch {
              // If this fails, session status fetch already forced local AI mode.
            }
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

            if (data?.type === 'message' && (data.reply_to || data.attachment)) {
              const nextId = getNextMessageId();
              const attachment = normalizeAttachmentPayload(data.attachment);
              const replyTo = normalizeReplyPayload(data.reply_to);
              const sender = data.role === 'admin' ? 'admin' : 'bot';
              const text = String(data.content || data.text || data.caption || '').trim();

              setMessages((prev) => [
                ...prev,
                {
                  id: nextId,
                  text,
                  sender,
                  type: attachment ? 'attachment' : 'text',
                  fileName: attachment?.file_name || null,
                  fileType: attachment?.mime_type || null,
                  fileDataUrl: attachment?.data_url || null,
                  attachment,
                  replyTo,
                  timestamp: data.timestamp || new Date().toISOString()
                }
              ]);
              if (sender === 'admin') setIsHumanMode(true);
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
              localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
              localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
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

            // If an admin replies, we switch to human mode instantly
            if (sender === 'admin') setIsHumanMode(true);

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
  }, [socketResetNonce]);

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

  const submitHumanSupportLead = async ({ name, email, countryCode, localPhone, phone, fullPhone, detailsMessage }) => {
    if (!hasSession) setHasSession(true);
    let sessionId = sessionIdRef.current;
    
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, sessionId);
    }

    const normalizedLocalPhone = String(localPhone || phone || '').replace(/[^\d]/g, '');
    const normalizedCountryCode = String(countryCode || '+234').trim();
    const normalizedFullPhone = (fullPhone || `${normalizedCountryCode}${normalizedLocalPhone}`).trim();

    const transferPayload = {
      name,
      email,
      country_code: normalizedCountryCode,
      phone_local: normalizedLocalPhone,
      phone: normalizedFullPhone,
      details: detailsMessage,
      subject: 'Transfer Request',
      type: 'request_human',
      source: 'portfolio-frontend',
      timestamp: new Date().toISOString(),
      user_name: name,
      user_email: email,
      user_phone: normalizedFullPhone
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
    const hasSubmittedLead = localStorage.getItem(CHATBOT_LEAD_SUBMITTED_KEY) === 'true';
    const activeSession = localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
    
    if (hasSubmittedLead && activeSession) {
      setAwaitingTransferConfirmation(true);
      setShowHumanForm(false); 
      setMessages((prev) => [
        ...prev,
        { 
          id: getNextMessageId(), 
          text: 'You already have an active session. Would you like to **continue** waiting for Muyiwa, or **clear** the session and start over?\n\n[Continue Session](#continue-transfer)  |  [Clear Session](#clear-transfer)', 
          sender: 'bot' 
        }
      ]);
      return;
    }

    if (!showHumanForm) {
      setShowHumanForm(true);
      setHumanFormStep(0);
      setLeadSubmitStatus(null);
      setIsHumanMode(true);
      setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Sure — I can connect you to human support. Please enter your details step by step below.', sender: 'bot' }]);
      if (!isConnected) {
        setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Live chat is currently offline, but you can still submit this form and Muyiwa will be notified directly.', sender: 'bot' }]);
      }

      void requestHumanModeActivation({
        name: contactForm.name.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        country_code: contactForm.countryCode || undefined,
        phone_local: contactForm.phone.replace(/[^\d]/g, '') || undefined
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const messageText = input.trim();
    if (!messageText && !attachedFile) return;

    const replyContext = replyToMessage
      ? {
          id: replyToMessage.id,
          sender: replyToMessage.sender,
          previewText: replyToMessage.previewText
        }
      : null;

    const attachmentLabel = attachedFile ? `[Attachment: ${attachedFile.name}]` : '';
    const composedText = [messageText, attachmentLabel].filter(Boolean).join('\n');
    const outgoingText = composedText || attachmentLabel;

    const sendMessage = async () => {
      let attachmentPayload = null;
      if (attachedFile) {
        try {
          const formData = new FormData();
          formData.append('file', attachedFile);
          formData.append('caption', messageText);

          const response = await fetch(CHAT_ATTACHMENT_UPLOAD_ENDPOINT(sessionIdRef.current), {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            attachmentPayload = await response.json();
          }
        } catch {
          const localDataUrl = await readFileAsDataUrl(attachedFile);
          if (localDataUrl) {
            attachmentPayload = {
              file_name: attachedFile.name,
              mime_type: attachedFile.type || 'application/octet-stream',
              size_bytes: attachedFile.size,
              data_url: localDataUrl,
              preview_type: attachedFile.type?.startsWith('image/') ? 'image' : 'document'
            };
          }
        }
      }

      const optimisticMessage = {
        id: getNextMessageId(),
        text: messageText || (attachmentPayload?.file_name ? '' : outgoingText),
        sender: 'user',
        type: attachmentPayload ? (attachmentPayload.preview_type === 'image' ? 'image' : 'attachment') : 'text',
        fileName: attachmentPayload?.file_name || attachedFile?.name || null,
        fileType: attachmentPayload?.mime_type || attachedFile?.type || null,
        fileDataUrl: attachmentPayload?.data_url || null,
        attachment: attachmentPayload,
        replyTo: replyContext,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setInput('');
      setAttachedFile(null);
      setReplyToMessage(null);
      setShowEmojiPicker(false);
      playChatSound('send');

      const wantsHumanSupport = shouldEnableHumanMode(outgoingText);
      if (wantsHumanSupport) {
        openHumanSupportForm();
        return;
      }

      if (isConnected && sendSocketMessage({
        type: 'message',
        content: messageText,
        role: 'user',
        reply_to: replyContext,
        attachment: attachmentPayload
      })) {
        if (!isHumanMode) {
          setIsLoading(true);
          startLoadingTimeout();
        }
      }
    };

    void sendMessage();
  };

  const handleSuggestedQuestion = (question) => {
    if (!isConnected) return;
    const normalizedQuestion = String(question || '').toLowerCase();
    pendingReachSupportTriggerRef.current = normalizedQuestion.includes('how can i reach you');
    setMessages((prev) => [...prev, { id: getNextMessageId(), text: question, sender: 'user', type: 'text' }]);
    playChatSound('send');

    if (sendSocketMessage(question)) {
      if (!isHumanMode) {
        setIsLoading(true);
        startLoadingTimeout();
      }
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
      
      const payloadDetails = {
        name: trimmedName,
        email: trimmedEmail,
        countryCode: contactForm.countryCode,
        phone: localPhone,
        fullPhone,
        detailsMessage
      };
      
      // Save data securely in localStorage to persist across reloads
      localStorage.setItem(CHATBOT_LEAD_SUBMITTED_KEY, 'true');
      localStorage.setItem(CHATBOT_LEAD_DETAILS_KEY, JSON.stringify(payloadDetails));
      
      resetHumanSupportForm();
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording) return;
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

    // Completely wipe session data
    localStorage.removeItem(CHATBOT_SESSION_STORAGE_KEY);
    localStorage.removeItem(CHATBOT_LEAD_SUBMITTED_KEY);
    localStorage.removeItem(CHATBOT_LEAD_DETAILS_KEY);
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

    setSocketResetNonce((prev) => prev + 1);
  };

  // --- UI RENDERERS ---
  const renderHumanFormStep = () => {
    if (!showHumanForm) return null;
    return (
      <Form onSubmit={handleHumanFormSubmit} className="human-form mb-3 w-100">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted fw-bold mb-0">Step {humanFormStep + 1} of 3</small>
          <button 
            type="button" 
            className="btn-close" 
            style={{ fontSize: '0.75rem' }} 
            onClick={() => {
              setShowHumanForm(false);
              setAwaitingTransferConfirmation(false);
            }}
            aria-label="Close form"
          />
        </div>

        {leadSubmitStatus && (
          <div className={`alert py-2 px-2 mb-2 small ${leadSubmitStatus.type === 'success' ? 'alert-success' : leadSubmitStatus.type === 'error' ? 'alert-danger' : 'alert-info'}`} role="status">
            {leadSubmitStatus.text}
          </div>
        )}

        {humanFormStep === 0 && (
          <>
            <Form.Control className="mb-2" type="text" placeholder="Enter your full name" value={contactForm.name} onChange={(e) => handleContactFieldChange('name', e.target.value)} autoFocus />
            <Button type="submit" variant="primary" className="w-100 bg-navy border-0" disabled={!contactForm.name.trim()}>Continue</Button>
          </>
        )}
        {humanFormStep === 1 && (
          <>
            <Form.Control className="mb-2" type="email" placeholder="Enter your email (e.g., john@example.com)" value={contactForm.email} onChange={(e) => handleContactFieldChange('email', e.target.value)} autoFocus />
            <Button type="submit" variant="primary" className="w-100 bg-navy border-0" disabled={!contactForm.email.trim()}>Next</Button>
          </>
        )}
        {humanFormStep === 2 && (
          <>
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

  const renderAttachmentPreview = (message) => {
    const attachment = message?.attachment;
    const fileName = attachment?.file_name || message?.fileName || '';
    const fileType = attachment?.mime_type || message?.fileType || '';
    const dataUrl = attachment?.data_url || message?.fileDataUrl || '';
    const previewType = attachment?.preview_type || message?.attachment?.previewType || (fileType.startsWith('image/') ? 'image' : 'document');
    const fileSize = formatFileSize(attachment?.size_bytes || message?.fileSize);

    if (!attachment && !fileName) return null;

    const isImagePreview = previewType === 'image' && Boolean(dataUrl);
    const isDocumentPreview = !isImagePreview;

    if (isImagePreview) {
      return (
        <div className="chatbot-attachment-preview chatbot-attachment-preview--image mb-2">
          <div className="chatbot-attachment-preview-label">
            <BiImage size={14} /> Image preview
          </div>
          <img
            src={dataUrl}
            alt={fileName || 'Attachment preview'}
            className="chatbot-attachment-image"
          />
        </div>
      );
    }

    if (isDocumentPreview) {
      return (
        <div className="chatbot-attachment-preview chatbot-attachment-preview--document mb-2">
          <div className="chatbot-attachment-meta">
            <div className="chatbot-attachment-preview-icon">
              <BiFile size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-truncate fw-semibold">{fileName || 'Attachment'}</div>
              <small className="d-block text-truncate opacity-75">
                {fileType || 'File'}{fileSize ? ` · ${fileSize}` : ''}
              </small>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Modern Bouncing Dots Typing Animation */}
      <style>{`
        .modern-typing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 14px;
        }
        .modern-typing-indicator span {
          width: 8px;
          height: 8px;
          background-color: #6c757d;
          border-radius: 50%;
          animation: modernBounce 1.4s infinite ease-in-out both;
        }
        .modern-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .modern-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes modernBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
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
        className={`chatbot-page-dim ${isOpen ? 'open' : ''}`}
        onClick={closeChatPanel}
        aria-hidden={!isOpen}
      />

      <div
        className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}
        tabIndex={-1}
      >
        <Card className="h-100 border-0 d-flex flex-column w-100 bg-transparent">
          
          <div className="chatbot-header d-flex align-items-center justify-content-between p-3 gap-3 bg-navy flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <span className={`chatbot-status-dot chatbot-status-dot--lg ${isConnecting ? 'dot-connecting' : isConnected ? 'dot-connected' : 'dot-disconnected'}`} />
              <div>
                <h6 className="mb-0 fw-600 text-white lh-1">Chat Support</h6>
                <small className={`lh-1 ${isConnecting ? 'text-warning' : isConnected ? 'text-success fw-bold' : 'text-danger'} opacity-90`}>
                  {isConnecting ? 'Connecting…' : isConnected ? (isHumanMode ? 'Connected to human' : 'Connected to bot') : 'Offline'}
                </small>
              </div>
            </div>
            <button onClick={toggleChat} className="btn btn-sm text-white p-0 chatbot-close-btn" aria-label="Close chat" type="button">
              <BiX size={22} />
            </button>
          </div>

          <Card.Body
            className="chat-messages flex-grow-1 px-3 py-3"
            style={{
              background: '#f7f8fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto'
            }}
          >
            <div className="quick-questions-drawer mb-3 flex-shrink-0">
              <button
                className="btn btn-link px-0 mb-1"
                style={{ fontSize: '1rem', color: '#0d6efd', textDecoration: 'none' }}
                onClick={() => setIsDrawerOpen((open) => !open)}
                aria-expanded={isDrawerOpen}
              >
                {isDrawerOpen ? 'Hide Quick Actions ▲' : 'Show Quick Actions ▼'}
              </button>
              {isDrawerOpen && (
                <div>
                  <small className="text-muted d-block mb-2">Quick actions:</small>
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
                    {/* Clear Session Button - Always visible if they have history */}
                    {(messages.length > 1 || hasSession) && (
                      <button
                        onClick={() => {
                          setShowClearConfirmModal(true);
                          setIsDrawerOpen(false);
                        }}
                        className="btn btn-sm btn-outline-danger text-start text-wrap"
                        style={{ fontSize: '0.8rem' }}
                        type="button"
                      >
                        Clear Session
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              onClick={() => {
                if (isDrawerOpen) setIsDrawerOpen(false);
                if (showEmojiPicker) setShowEmojiPicker(false);
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`d-flex gap-2 w-100 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  style={{
                    width: '100%',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    className={`py-2 px-3 rounded-lg ${msg.sender === 'user' ? 'bg-navy text-white' : 'bg-light text-dark'}`}
                    style={{
                      maxWidth: 'min(100%, calc(100% - 1rem))',
                      width: 'fit-content',
                      minWidth: '30px',
                      borderRadius: 14,
                      fontSize: '1rem',
                      wordBreak: 'break-word',
                      minInlineSize: 0,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      marginLeft: msg.sender === 'user' ? 'auto' : 0,
                      marginRight: msg.sender === 'user' ? 0 : 'auto',
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      textAlign: 'left'
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between mb-1" style={{ gap: '0.5rem', minWidth: 0 }}>
                      <small className="fw-semibold" style={{ opacity: 0.9, color: msg.sender === 'user' ? '#f2f8ff' : '#7f1d34', whiteSpace: 'nowrap' }}>
                        {getMessageSenderLabel(msg.sender)}
                      </small>
                      <button
                        type="button"
                        onClick={() => handleSetReplyTarget(msg)}
                        className="btn btn-link p-0"
                        style={{ color: msg.sender === 'user' ? '#f2f8ff' : '#5f6b73', textDecoration: 'none', lineHeight: 1, flexShrink: 0, marginLeft: 'auto' }}
                        aria-label="Reply to this message"
                        title="Reply"
                      >
                        <BiReply size={14} />
                      </button>
                    </div>

                    {renderReplyQuote(msg.replyTo, msg.sender === 'user')}

                    {renderAttachmentPreview(msg)}

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
                            // --- Resend the email notification securely ---
                            if (href === '#continue-transfer') {
                              return (
                                <button 
                                  onClick={async (e) => { 
                                    e.preventDefault(); 
                                    setAwaitingTransferConfirmation(false);
                                    setIsHumanMode(true);
                                    setMessages((prev) => [...prev, { id: getNextMessageId(), text: 'Excellent. You are now connected. Please wait while a representative joins the chat.', sender: 'bot' }]);
                                    
                                    // Fetch details and immediately resend lead
                                    const savedDetails = localStorage.getItem(CHATBOT_LEAD_DETAILS_KEY);
                                    if (savedDetails) {
                                      try {
                                        const parsedDetails = JSON.parse(savedDetails);
                                        await submitHumanSupportLead(parsedDetails);
                                      } catch {
                                        // No-op: silently ignore malformed cached lead payload.
                                      }
                                    }
                                  }} 
                                  className="btn btn-sm btn-success mt-2 mb-1 d-block w-100" 
                                  type="button"
                                >
                                  {children}
                                </button>
                              );
                            }
                            if (href === '#clear-transfer') {
                              return (
                                <button 
                                  onClick={(e) => { 
                                    e.preventDefault(); 
                                    setShowClearConfirmModal(true);
                                  }} 
                                  className="btn btn-sm btn-outline-danger mt-2 mb-1 d-block w-100" 
                                  type="button"
                                >
                                  {children}
                                </button>
                              );
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
              
              {/* REVAMPED TYPING ANIMATION */}
              {isLoading && (
                <div className="d-flex mb-3">
                  <div className="bg-light text-dark rounded-lg" style={{ borderRadius: 14 }}>
                    <div className="modern-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card.Body>

          <div className="card-footer p-3 border-top flex-shrink-0 w-100 chatbot-footer-responsive">
            {renderHumanFormStep()}

            {replyToMessage ? (
              <div className="d-flex align-items-center justify-content-between mb-2 px-2 py-2 rounded-2" style={{ background: '#f3f5f7', borderLeft: '3px solid #00a884' }}>
                <div className="text-truncate" style={{ lineHeight: 1.15 }}>
                  <small className="d-block fw-semibold">Replying to {getMessageSenderLabel(replyToMessage.sender)}</small>
                  <small className="text-muted d-block text-truncate">{replyToMessage.previewText}</small>
                </div>
                <button type="button" className="btn btn-link text-muted p-0" onClick={() => setReplyToMessage(null)} aria-label="Cancel reply">
                  <BiX size={18} />
                </button>
              </div>
            ) : null}

            {attachedFile ? (
              <div className="chatbot-composer-attachment mb-2">
                <div className="chatbot-composer-attachment-main">
                  <div className="chatbot-composer-attachment-thumb chatbot-composer-attachment-thumb--doc">
                    <BiPaperclip size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-truncate fw-semibold">{attachedFile.name}</div>
                    <small className="d-block text-muted text-truncate">
                      {attachedFile.type || 'File'}{attachedFile.size ? ` · ${formatFileSize(attachedFile.size)}` : ''}
                    </small>
                  </div>
                </div>
                <button type="button" className="btn btn-link text-danger p-0 flex-shrink-0" onClick={() => setAttachedFile(null)} aria-label="Remove attachment">
                  <BiX size={18} />
                </button>
              </div>
            ) : null}

            <Form onSubmit={handleSend} className="chatbot-input-form w-100 m-0">
              <div className="chatbot-input-row">
                <div className="chatbot-input-shell">
                  <button
                    type="button"
                    className="btn btn-link text-secondary p-1 chatbot-input-icon-btn"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Open emoji picker"
                    title="Emoji"
                  >
                    <BiSmile size={20} />
                  </button>
                  {isHumanMode && !awaitingTransferConfirmation ? (
                    <label className="btn btn-link text-secondary p-1 mb-0 chatbot-input-icon-btn" style={{ lineHeight: 1 }} title="Attach file">
                      <BiPaperclip size={20} />
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleAttachFile}
                        accept=".doc,.docx,.pdf,image/*,text/plain"
                      />
                    </label>
                  ) : null}

                  {showEmojiPicker && !isRecording ? (
                    <div className="chatbot-emoji-popover">
                      <EmojiPicker
                        onEmojiClick={handleEmojiPick}
                        width={280}
                        height={320}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  ) : null}

                  {isHumanMode && isRecording ? (
                    <div className="d-flex align-items-center w-100 text-danger animate__animated animate__fadeIn bg-light rounded-pill px-3 chatbot-recording-pill" style={{ height: '42px' }}>
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
                      disabled={(!isConnected && !isHumanMode) || awaitingTransferConfirmation}
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

                <div className="chatbot-send-slot">
                  {(input.trim() || attachedFile) && !isRecording ? (
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={(!isConnected && !isHumanMode) || awaitingTransferConfirmation}
                      className="rounded-circle d-flex align-items-center justify-content-center bg-navy border-0 shadow-sm p-0 chatbot-send-mic-btn"
                      style={{ width: '42px', height: '42px' }}
                    >
                      <BiSend size={20} />
                    </Button>
                  ) : isHumanMode ? (
                    <Button
                      type="button"
                      variant={isRecording ? 'danger' : 'primary'}
                      disabled={awaitingTransferConfirmation}
                      className={`rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm p-0 chatbot-send-mic-btn ${!isRecording ? 'bg-navy' : ''}`}
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
                  ) : null}
                </div>
              </div>
            </Form>
          </div>
        </Card>
      </div>

      {/* Clear Session Confirmation Modal */}
      <Modal show={showClearConfirmModal} onHide={() => setShowClearConfirmModal(false)} centered style={{ zIndex: 99999 }}>
        <Modal.Header closeButton>
          <Modal.Title>Clear Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to clear your current session and chat history? You will need to enter your details again to speak with human support.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={async () => {
            setShowClearConfirmModal(false);
            setAwaitingTransferConfirmation(false);
            await handleClearChat();
            setTimeout(() => openHumanSupportForm(), 500); 
          }}>
            Clear Session
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showWelcomeModal}
        onHide={() => {
          setShowWelcomeModal(false);
          closeChatPanel();
        }}
        centered
        backdrop="static"
        keyboard={false}
        style={{ zIndex: 99999 }}
      >
        <Modal.Header>
          <Modal.Title>Need help before you leave?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          I can answer project, hiring, and technical questions instantly. Start a quick chat now.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowWelcomeModal(false);
              closeChatPanel();
            }}
          >
            Maybe later
          </Button>
          <Button
            variant="primary"
            className="bg-navy border-0"
            onClick={() => {
              setShowWelcomeModal(false);
              openChatPanel();
            }}
          >
            Start chat
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default Chatbot;