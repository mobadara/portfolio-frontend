import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Spinner, Dropdown, Form, Modal, Button, Toast, ToastContainer } from 'react-bootstrap';
import EmojiPicker from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  BiArrowBack, BiSmile, BiPaperclip, BiSend, BiMicrophone, BiPause, BiPlay, BiLockAlt,
  BiDotsVerticalRounded, BiX, BiCheckDouble, BiChevronDown, BiSearch
} from 'react-icons/bi';
import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, toWebSocketUrl, withAuthHeaders } from '../utils/adminApi';

const MESSAGE_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏'];
const VOICE_WAVE_BARS = [5, 8, 6, 11, 7, 10, 6, 12, 8, 9, 5, 11, 7, 10, 6, 12, 8, 9, 5, 8];

const AdminChat = ({ sessionId, onClose, displayName, chatUserName, statusLabel, isMobileView, onRefreshSession }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [openMessageActionsId, setOpenMessageActionsId] = useState(null);
  const [swipeReplyState, setSwipeReplyState] = useState({ messageId: null, offset: 0 });
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [audioCurrentById, setAudioCurrentById] = useState({});
  const [audioDurationById, setAudioDurationById] = useState({});
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    title: '',
    body: '',
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm: null
  });
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
  });
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchRowRef = useRef(null);
  const searchToggleBtnRef = useRef(null);
  const emojiPopoverRef = useRef(null);
  const webSocketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioElementsRef = useRef({});
  const swipeReplyRef = useRef({ messageId: null, offset: 0 });
  const messageTouchRef = useRef({
    messageId: null,
    startX: 0,
    startY: 0,
    isHorizontal: false,
    longPressTriggered: false
  });
  const longPressTimerRef = useRef(null);
  const isMicPressingRef = useRef(false);
  const micStartYRef = useRef(null);
  const shouldSendRecordingRef = useRef(true);
  const onCloseRef = useRef(onClose);
  const onRefreshSessionRef = useRef(onRefreshSession);
  const token = getStoredAdminToken();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onRefreshSessionRef.current = onRefreshSession;
  }, [onRefreshSession]);

  useEffect(() => {
    const audioMap = audioElementsRef.current;
    return () => {
      Object.values(audioMap).forEach((audioEl) => {
        if (!audioEl) return;
        try {
          audioEl.pause();
        } catch {
          // no-op
        }
      });
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stopVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecordingTimer = useCallback(() => {
    clearRecordingTimer();
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearRecordingTimer]);

  const formatRecordingTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const appendIncomingMessage = useCallback((messageData) => {
    if (!messageData) return;

    if (messageData.type === 'audio' && messageData.audio_base64) {
      const sender = messageData.role === 'user' ? 'user' : 'admin';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random()}`,
          sender,
          type: 'audio',
          audioBase64: messageData.audio_base64,
          mimeType: messageData.mime_type || 'audio/webm',
          created_at: messageData.timestamp || new Date().toISOString(),
          reaction: null,
          replyTo: null,
          deleted: false
        }
      ]);
      return;
    }

    if (messageData.type === 'session_deleted') {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random()}`,
          sender: 'admin',
          text: 'This chat session was deleted.',
          created_at: messageData.timestamp || new Date().toISOString(),
          type: 'text',
          reaction: null,
          replyTo: null,
          deleted: false
        }
      ]);
      if (onCloseRef.current) onCloseRef.current();
      return;
    }

    if (messageData.type === 'session_cleared') {
      setMessages([]);
      return;
    }

    if (messageData.type === 'pong') {
      return;
    }

    const content = (messageData.content || messageData.message || '').toString();
    if (!content.trim()) return;

    const sender = messageData.role === 'user' ? 'user' : 'admin';
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random()}`,
        sender,
        text: content,
        created_at: messageData.timestamp || new Date().toISOString(),
        type: 'text'
      }
    ]);
  }, []);

  const parseStoredMessages = useCallback((rawMessages = []) => {
    return rawMessages
      .map((entry, index) => {
        const role = entry?.role;
        const rawContent = typeof entry?.content === 'string' ? entry.content : '';
        const createdAt = entry?.timestamp || new Date().toISOString();

        try {
          const parsed = JSON.parse(rawContent);
          if (parsed?.type === 'audio' && parsed?.audio_base64) {
            const sender = parsed.role === 'user' ? 'user' : 'admin';
            return {
              id: `${Date.now()}_${index}`,
              sender,
              type: 'audio',
              audioBase64: parsed.audio_base64,
              mimeType: parsed.mime_type || 'audio/webm',
              created_at: parsed.timestamp || createdAt
            };
          }
        } catch {
          // Text messages are plain strings; ignore JSON parse failures.
        }

        return {
          id: `${Date.now()}_${index}`,
          sender: role === 'user' ? 'user' : 'admin',
          text: rawContent,
          created_at: createdAt,
          type: 'text',
          reaction: null,
          replyTo: null,
          deleted: false
        };
      })
      .filter(Boolean);
  }, []);

  const sendSocketPayload = useCallback((payload) => {
    const ws = webSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, []);

  const connectAdminWebSocket = useCallback((currentSessionId) => {
    if (!currentSessionId || !token) return;

    const wsUrl = `${toWebSocketUrl(`/ws/admin/${currentSessionId}`)}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;

    ws.onopen = () => {
      setLoading(false);
      setSending(false);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        appendIncomingMessage(parsed);
      } catch {
        appendIncomingMessage({
          type: 'message',
          role: 'user',
          content: event.data,
          timestamp: new Date().toISOString()
        });
      }
    };

    ws.onerror = () => {
      setSending(false);
    };

    ws.onclose = (event) => {
      webSocketRef.current = null;
      setSending(false);

      if (!shouldReconnectRef.current || event?.code === 1008) return;

      reconnectTimerRef.current = setTimeout(() => {
        connectAdminWebSocket(currentSessionId);
      }, 1500);
    };
  }, [appendIncomingMessage, token]);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);

    try {
      const url = buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`);
      const response = await fetch(url, { headers: withAuthHeaders(token) });
      
      if (response.ok) {
        const data = await response.json();
        const parsedHistory = parseStoredMessages(data.messages || []);
        setMessages(parsedHistory);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [parseStoredMessages, sessionId, token]);

  // Initial fetch and websocket setup
  useEffect(() => {
    shouldReconnectRef.current = true;
    fetchMessages();

    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }

    connectAdminWebSocket(sessionId);

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
      }

      stopVoiceRecording();
      clearRecordingTimer();
      clearLongPressTimer();
    };
  }, [clearLongPressTimer, clearRecordingTimer, connectAdminWebSocket, fetchMessages, sessionId, stopVoiceRecording]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleOutsideClick = (event) => {
      if (emojiPopoverRef.current && !emojiPopoverRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!showMessageSearch) return;
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [showMessageSearch]);

  useEffect(() => {
    if (!showMessageSearch) return;

    const handleOutsideSearchClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (
        searchRowRef.current?.contains(target) ||
        searchToggleBtnRef.current?.contains(target)
      ) {
        return;
      }

      setShowMessageSearch(false);
      setMessageSearchQuery('');
    };

    document.addEventListener('mousedown', handleOutsideSearchClick);
    document.addEventListener('touchstart', handleOutsideSearchClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideSearchClick);
      document.removeEventListener('touchstart', handleOutsideSearchClick);
    };
  }, [showMessageSearch]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Escape closes all UI elements
      if (event.key === 'Escape') {
        setShowActionsMenu(false);
        setOpenMessageActionsId(null);
        setShowEmojiPicker(false);
        setShowMessageSearch(false);
        setMessageSearchQuery('');
        return;
      }

      // Ctrl/Cmd+F activates search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowMessageSearch(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!openMessageActionsId) return;

    const handleOutsideActionsClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (
        target.closest('.my-message-mobile-actions') ||
        target.closest('.my-message-actions-dropdown') ||
        target.closest('.my-message-actions-toggle')
      ) {
        return;
      }

      setOpenMessageActionsId(null);
    };

    document.addEventListener('mousedown', handleOutsideActionsClick);
    document.addEventListener('touchstart', handleOutsideActionsClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideActionsClick);
      document.removeEventListener('touchstart', handleOutsideActionsClick);
    };
  }, [openMessageActionsId]);

  const startVoiceRecording = useCallback(async () => {
    if (isRecording || sending) return;
    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      shouldSendRecordingRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setIsRecordingLocked(false);
        setIsRecordingPaused(false);
        isMicPressingRef.current = false;
        micStartYRef.current = null;
        clearRecordingTimer();

        if (!blob.size || !shouldSendRecordingRef.current) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const audioBase64 = typeof reader.result === 'string' ? reader.result : '';
          if (!audioBase64) return;

          const optimisticAudioId = `${Date.now()}_${Math.random()}`;

          setMessages((prev) => [
            ...prev,
            {
              id: optimisticAudioId,
              sender: 'admin',
              type: 'audio',
              audioBase64,
              mimeType: blob.type || 'audio/webm',
              created_at: new Date().toISOString(),
              isPending: true
            }
          ]);

          const sent = sendSocketPayload({
            type: 'audio',
            audio_base64: audioBase64,
            mime_type: blob.type || 'audio/webm',
            duration_seconds: null,
            timestamp: new Date().toISOString()
          });

          if (sent) {
            setMessages((prev) => prev.map((msg) => (msg.id === optimisticAudioId ? { ...msg, isPending: false } : msg)));
            if (onRefreshSessionRef.current) onRefreshSessionRef.current();
          } else {
            setMessages((prev) => prev.map((msg) => (msg.id === optimisticAudioId ? { ...msg, isPending: false, failed: true } : msg)));
          }
        };

        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setIsRecordingLocked(false);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);
      startRecordingTimer();
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Microphone access failed:', error);
      setIsRecording(false);
      setIsRecordingLocked(false);
      setIsRecordingPaused(false);
      clearRecordingTimer();
    }
  }, [clearRecordingTimer, isRecording, sendSocketPayload, sending, startRecordingTimer]);

  const stopVoiceRecordingWithMode = useCallback((shouldSend = true) => {
    shouldSendRecordingRef.current = shouldSend;
    stopVoiceRecording();
  }, [stopVoiceRecording]);

  const togglePauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === 'recording') {
      recorder.pause();
      setIsRecordingPaused(true);
      clearRecordingTimer();
    } else if (recorder.state === 'paused') {
      recorder.resume();
      setIsRecordingPaused(false);
      startRecordingTimer();
    }
  }, [clearRecordingTimer, startRecordingTimer]);

  const handleMicPressStart = async (clientY = null) => {
    if (inputText.trim() || attachedFile || sending) return;
    isMicPressingRef.current = true;
    micStartYRef.current = clientY;

    if (!isRecording) {
      await startVoiceRecording();
    }
  };

  const handleMicPressMove = (clientY = null) => {
    if (!isRecording || isRecordingLocked || !isMicPressingRef.current) return;
    if (micStartYRef.current === null || clientY === null) return;

    const deltaY = micStartYRef.current - clientY;
    if (deltaY >= 56) {
      setIsRecordingLocked(true);
      isMicPressingRef.current = false;
      micStartYRef.current = null;
    }
  };

  const handleMicPressEnd = () => {
    if (!isRecording) return;

    if (!isRecordingLocked) {
      stopVoiceRecordingWithMode(true);
    }

    isMicPressingRef.current = false;
    micStartYRef.current = null;
  };

  const handleMicPressCancel = () => {
    if (!isRecording) return;

    if (!isRecordingLocked) {
      stopVoiceRecordingWithMode(false);
    }

    isMicPressingRef.current = false;
    micStartYRef.current = null;
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedFile) || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    const outboundText = attachedFile
      ? `${textToSend}${textToSend ? '\n' : ''}[Attachment selected: ${attachedFile.name}]`
      : textToSend;
    const replyHeader = replyToMessage?.previewText ? `↩️ Replying to: ${replyToMessage.previewText}` : '';
    const payloadText = replyHeader ? `${replyHeader}\n${outboundText}` : outboundText;
    
    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(),
      sender: 'admin',
      text: payloadText,
      created_at: new Date().toISOString(),
      file: attachedFile ? attachedFile.name : null,
      isPending: true,
      reaction: null,
      replyTo: replyToMessage,
      deleted: false
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setAttachedFile(null);
    setReplyToMessage(null);
    setShowEmojiPicker(false);
    scrollToBottom();

    try {
      const sent = sendSocketPayload({
        type: 'message',
        role: 'admin',
        content: payloadText,
        timestamp: new Date().toISOString()
      });

      if (sent) {
        setMessages((prev) => prev.map((msg) => (msg.id === optimisticMsg.id ? { ...msg, isPending: false } : msg)));
        if (onRefreshSessionRef.current) onRefreshSessionRef.current();
      } else {
        throw new Error('WebSocket is not connected.');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.map((msg) => (msg.id === optimisticMsg.id ? { ...msg, isPending: false, failed: true } : msg)));
    } finally {
      setSending(false);
    }
  };

  const handlePingUser = async () => {
    const sent = sendSocketPayload({
      type: 'message',
      role: 'admin',
      content: 'Ping 👋',
      timestamp: new Date().toISOString()
    });

    if (sent) {
      if (onRefreshSessionRef.current) onRefreshSessionRef.current();
      setShowActionsMenu(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;

    const shouldDelete = window.confirm('Delete this chat session permanently? The user will be notified by email if available.');
    if (!shouldDelete) return;

    try {
      const response = await fetch(buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`), {
        method: 'DELETE',
        headers: withAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to delete session.');
      }

      setShowActionsMenu(false);
      if (onRefreshSessionRef.current) onRefreshSessionRef.current();
      if (onCloseRef.current) onCloseRef.current();
    } catch (err) {
      console.error('Delete session failed:', err);
    }
  };

  const handleThemeToggle = () => {
    const nextDarkState = !isDarkModeEnabled;
    const nextTheme = nextDarkState ? 'dark' : 'light';
    setIsDarkModeEnabled(nextDarkState);
    localStorage.setItem('adminTheme', nextTheme);
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
    }
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData?.emoji || '';
    if (!emoji) return;

    const inputEl = inputRef.current;
    if (!inputEl) {
      setInputText((prev) => prev + emoji);
      setShowEmojiPicker(false);
      return;
    }

    const start = inputEl.selectionStart ?? inputText.length;
    const end = inputEl.selectionEnd ?? inputText.length;

    setInputText((prev) => `${prev.slice(0, start)}${emoji}${prev.slice(end)}`);
    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      inputEl.focus();
      const nextPos = start + emoji.length;
      inputEl.setSelectionRange(nextPos, nextPos);
    });
  };

  const getMessagePreviewText = useCallback((msg) => {
    if (!msg) return '';
    if (msg.type === 'audio') return 'Voice message';
    const base = (msg.text || '').replace(/\s+/g, ' ').trim();
    if (!base) return 'Message';
    return base.length > 65 ? `${base.slice(0, 65)}...` : base;
  }, []);

  const handleCopyMessage = useCallback(async (msg) => {
    const text = msg?.type === 'audio' ? 'Voice message' : (msg?.text || '');
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }

    setShowCopyToast(true);
    setOpenMessageActionsId(null);
  }, []);

  const handleReplyToMessage = useCallback((msg) => {
    if (!msg) return;
    setReplyToMessage({
      id: msg.id,
      sender: msg.sender,
      previewText: getMessagePreviewText(msg)
    });
    setOpenMessageActionsId(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [getMessagePreviewText]);

  const handleReactToMessage = useCallback((messageId, emoji) => {
    setMessages((prev) => prev.map((msg) => (
      msg.id === messageId ? { ...msg, reaction: emoji } : msg
    )));
    setOpenMessageActionsId(null);
  }, []);

  const handleDeleteFromMe = useCallback((messageId) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete message?',
      body: 'This message will be removed from your view.',
      confirmLabel: 'Delete message',
      variant: 'danger',
      onConfirm: () => {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        if (replyToMessage?.id === messageId) {
          setReplyToMessage(null);
        }
      }
    });
    setOpenMessageActionsId(null);
  }, [replyToMessage]);

  const handleDeleteForEveryone = useCallback((msg) => {
    if (!msg) return;

    const isAdminMessage = msg.sender === 'admin' || msg.sender === 'bot';
    setDeleteConfirm({
      show: true,
      title: 'Delete for everyone?',
      body: isAdminMessage
        ? 'This will replace the message with a deleted placeholder for everyone.'
        : 'This message will be removed from your view.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        if (!isAdminMessage) {
          setMessages((prev) => prev.filter((entry) => entry.id !== msg.id));
          if (replyToMessage?.id === msg.id) {
            setReplyToMessage(null);
          }
          return;
        }

        const sent = sendSocketPayload({
          type: 'message',
          role: 'admin',
          content: 'This message was deleted.',
          timestamp: new Date().toISOString()
        });

        setMessages((prev) => prev.map((entry) => (
          entry.id === msg.id
            ? {
                ...entry,
                text: 'This message was deleted.',
                type: 'text',
                deleted: true,
                reaction: null,
                file: null,
                audioBase64: null,
                mimeType: null
              }
            : entry
        )));

        if (replyToMessage?.id === msg.id) {
          setReplyToMessage(null);
        }

        if (sent && onRefreshSessionRef.current) {
          onRefreshSessionRef.current();
        }
      }
    });

    setOpenMessageActionsId(null);
  }, [replyToMessage, sendSocketPayload]);

  const confirmDeleteAction = useCallback(async () => {
    const action = deleteConfirm.onConfirm;
    setDeleteConfirm((prev) => ({ ...prev, show: false }));
    if (action) {
      await action();
    }
  }, [deleteConfirm.onConfirm]);

  const onMessageTouchStart = useCallback((msg, event) => {
    if (!isMobileView) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    messageTouchRef.current = {
      messageId: msg.id,
      startX: touch.clientX,
      startY: touch.clientY,
      isHorizontal: false,
      longPressTriggered: false
    };

    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      messageTouchRef.current.longPressTriggered = true;
      setOpenMessageActionsId((prev) => (prev === msg.id ? null : msg.id));
    }, 420);
  }, [clearLongPressTimer, isMobileView]);

  const onMessageTouchMove = useCallback((msg, event) => {
    if (!isMobileView) return;
    const touch = event.touches?.[0];
    if (!touch) return;

    const touchState = messageTouchRef.current;
    if (touchState.messageId !== msg.id) return;

    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;

    if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
      clearLongPressTimer();
      swipeReplyRef.current = { messageId: null, offset: 0 };
      setSwipeReplyState((prev) => (prev.messageId === msg.id ? { messageId: null, offset: 0 } : prev));
      return;
    }

    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      touchState.isHorizontal = true;
      clearLongPressTimer();
      const nextSwipe = { messageId: msg.id, offset: Math.min(deltaX, 84) };
      swipeReplyRef.current = nextSwipe;
      setSwipeReplyState(nextSwipe);
    }
  }, [clearLongPressTimer, isMobileView]);

  const onMessageTouchEnd = useCallback((msg) => {
    if (!isMobileView) return;
    clearLongPressTimer();

    const currentSwipe = swipeReplyRef.current;
    if (currentSwipe.messageId === msg.id && currentSwipe.offset >= 56) {
      handleReplyToMessage(msg);
    }

    swipeReplyRef.current = { messageId: null, offset: 0 };
    setSwipeReplyState({ messageId: null, offset: 0 });
    messageTouchRef.current = {
      messageId: null,
      startX: 0,
      startY: 0,
      isHorizontal: false,
      longPressTriggered: false
    };
  }, [clearLongPressTimer, handleReplyToMessage, isMobileView]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const renderHighlightedText = useCallback((text, query) => {
    const source = (text || '').toString();
    const search = (query || '').trim();
    if (!search) return source;

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return source;

    const regex = new RegExp(`(${escaped})`, 'ig');
    const pieces = source.split(regex);

    return pieces.map((piece, idx) => {
      const isMatch = piece.toLowerCase() === search.toLowerCase();
      if (!isMatch) return <React.Fragment key={`text-${idx}`}>{piece}</React.Fragment>;
      return (
        <mark key={`mark-${idx}`} className="my-search-highlight">
          {piece}
        </mark>
      );
    });
  }, []);

  const setAudioElementRef = useCallback((audioId, node) => {
    if (!audioId) return;
    if (node) {
      audioElementsRef.current[audioId] = node;
      return;
    }
    delete audioElementsRef.current[audioId];
  }, []);

  const formatAudioTime = useCallback((seconds = 0) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  const handleAudioLoadedMetadata = useCallback((audioId, event) => {
    const duration = Number(event.currentTarget?.duration || 0);
    if (!duration) return;
    setAudioDurationById((prev) => ({ ...prev, [audioId]: duration }));
  }, []);

  const handleAudioTimeUpdate = useCallback((audioId, event) => {
    const current = Number(event.currentTarget?.currentTime || 0);
    setAudioCurrentById((prev) => ({ ...prev, [audioId]: current }));
  }, []);

  const handleAudioEnded = useCallback((audioId) => {
    setActiveAudioId((prev) => (prev === audioId ? null : prev));
  }, []);

  const handleAudioPause = useCallback((audioId) => {
    setActiveAudioId((prev) => (prev === audioId ? null : prev));
  }, []);

  const handleAudioSeek = useCallback((audioId, nextTime) => {
    const audioEl = audioElementsRef.current[audioId];
    if (!audioEl || !Number.isFinite(nextTime)) return;
    audioEl.currentTime = nextTime;
    setAudioCurrentById((prev) => ({ ...prev, [audioId]: nextTime }));
  }, []);

  const toggleAudioPlayback = useCallback((audioId) => {
    const targetAudio = audioElementsRef.current[audioId];
    if (!targetAudio) return;

    Object.entries(audioElementsRef.current).forEach(([id, audioEl]) => {
      if (!audioEl) return;
      if (id !== audioId && !audioEl.paused) {
        audioEl.pause();
      }
    });

    if (targetAudio.paused) {
      targetAudio.play()
        .then(() => {
          setActiveAudioId(audioId);
        })
        .catch(() => {
          setActiveAudioId(null);
        });
      return;
    }

    targetAudio.pause();
    setActiveAudioId(null);
  }, []);

  const renderedMessages = useMemo(() => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" className="my-teal-spinner" />
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="text-center text-muted mt-5">
          <small className="bg-white rounded-pill px-3 py-1 shadow-sm opacity-75">
            No messages yet. Send a message to start the conversation.
          </small>
        </div>
      );
    }

    return messages.map((msg, idx) => {
      const isAdmin = msg.sender === 'admin' || msg.sender === 'bot';
      const isActionsOpen = openMessageActionsId === msg.id;
      const swipeOffset = swipeReplyState.messageId === msg.id ? swipeReplyState.offset : 0;
      const audioId = String(msg.id || idx);
      const currentAudioTime = audioCurrentById[audioId] || 0;
      const totalAudioDuration = audioDurationById[audioId] || 0;
      const clampedCurrentTime = Math.min(currentAudioTime, totalAudioDuration || currentAudioTime);
      const waveformProgressPct = totalAudioDuration > 0
        ? Math.min((clampedCurrentTime / totalAudioDuration) * 100, 100)
        : 0;
      const isAudioPlaying = activeAudioId === audioId;
      const messageOwnerName = isAdmin ? 'Admin' : (chatUserName?.trim() || 'User');
      return (
        <div key={msg.id || idx} className={`mb-2 my-msg-row-shell ${isAdmin ? 'my-msg-row-admin' : 'my-msg-row-user'}`}>
          <div className="my-message-avatar" aria-hidden="true">
            {isAdmin ? 'A' : 'U'}
          </div>
          <div
            className={`my-message-bubble p-2 rounded position-relative ${isAdmin ? 'my-message-admin' : 'my-message-user'} ${isActionsOpen ? 'my-message-active' : ''}`}
            style={{ transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined }}
            onTouchStart={(event) => onMessageTouchStart(msg, event)}
            onTouchMove={(event) => onMessageTouchMove(msg, event)}
            onTouchEnd={() => onMessageTouchEnd(msg)}
            onTouchCancel={() => onMessageTouchEnd(msg)}
          >
            <div
              className={`my-message-top-row ${isActionsOpen ? 'my-message-top-row-active' : ''}`}
              onClick={() => setOpenMessageActionsId((prev) => (prev === msg.id ? null : msg.id))}
            >
              <span className="my-message-owner-name">{messageOwnerName}</span>
              <Dropdown
                align="end"
                className="my-message-actions-dropdown"
                autoClose={true}
                show={isActionsOpen}
                onToggle={(isOpen) => setOpenMessageActionsId(isOpen ? msg.id : null)}
              >
                <Dropdown.Toggle
                  as="button"
                  className="my-message-actions-toggle"
                  aria-label="Message options"
                  onClick={(event) => event.stopPropagation()}
                >
                  <BiChevronDown size={11} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="my-message-actions-menu">
                  <div className="my-reaction-row" role="group" aria-label="React to message">
                    {MESSAGE_REACTIONS.map((emoji) => (
                      <button
                        key={`${msg.id}-${emoji}`}
                        type="button"
                        className="my-reaction-btn"
                        onClick={() => handleReactToMessage(msg.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <Dropdown.Divider />
                  <Dropdown.Item className="my-message-action-item" onClick={() => handleCopyMessage(msg)}>
                    Copy
                  </Dropdown.Item>
                  <Dropdown.Item className="my-message-action-item" onClick={() => handleReplyToMessage(msg)}>
                    Reply
                  </Dropdown.Item>
                  <Dropdown.Item className="my-message-action-item text-danger" onClick={() => handleDeleteFromMe(msg.id)}>
                    Delete from me
                  </Dropdown.Item>
                  <Dropdown.Item className="my-message-action-item text-danger" onClick={() => handleDeleteForEveryone(msg)}>
                    Delete from everyone
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {msg.file && (
              <div className="bg-dark bg-opacity-10 rounded p-2 mb-1 small d-flex align-items-center gap-2">
                <BiPaperclip /> {msg.file}
              </div>
            )}

            {msg.type === 'audio' && msg.audioBase64 ? (
              <div className="my-voice-note-shell">
                <button
                  type="button"
                  className="my-voice-note-play-btn"
                  onClick={() => toggleAudioPlayback(audioId)}
                  aria-label={isAudioPlaying ? 'Pause voice note' : 'Play voice note'}
                >
                  {isAudioPlaying ? <BiPause size={16} /> : <BiPlay size={16} />}
                </button>

                <div className="my-voice-note-main">
                  <div className="my-voice-note-wave" aria-hidden="true">
                    {VOICE_WAVE_BARS.map((barHeight, waveIdx) => {
                      const checkpoint = ((waveIdx + 1) / VOICE_WAVE_BARS.length) * 100;
                      const isWaveActive = waveformProgressPct >= checkpoint;
                      return (
                        <span
                          key={`${audioId}-bar-${waveIdx}`}
                          className={`my-voice-note-bar ${isWaveActive ? 'my-voice-note-bar-active' : ''}`}
                          style={{ height: `${barHeight}px` }}
                        />
                      );
                    })}
                  </div>

                  <input
                    type="range"
                    className="my-voice-note-seek"
                    min="0"
                    max={totalAudioDuration || 0}
                    step="0.01"
                    value={totalAudioDuration ? clampedCurrentTime : 0}
                    onChange={(event) => handleAudioSeek(audioId, Number(event.target.value))}
                    aria-label="Seek voice note"
                  />
                </div>

                <span className="my-voice-note-duration">
                  {formatAudioTime(clampedCurrentTime)} / {formatAudioTime(totalAudioDuration)}
                </span>

                <audio
                  ref={(node) => setAudioElementRef(audioId, node)}
                  src={msg.audioBase64}
                  preload="metadata"
                  onLoadedMetadata={(event) => handleAudioLoadedMetadata(audioId, event)}
                  onTimeUpdate={(event) => handleAudioTimeUpdate(audioId, event)}
                  onEnded={() => handleAudioEnded(audioId)}
                  onPause={() => handleAudioPause(audioId)}
                  onPlay={() => setActiveAudioId(audioId)}
                  className="my-voice-note-native"
                />
              </div>
            ) : (
              <div style={{ wordBreak: 'break-word' }}>
                {msg.replyTo && (
                  <div className="my-replied-context mb-1">
                    <small>{msg.replyTo.previewText}</small>
                  </div>
                )}
                {messageSearchQuery.trim() ? (
                  <div className="my-searchable-message-text">{renderHighlightedText(msg.text || '', messageSearchQuery)}</div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.text || ''}
                  </ReactMarkdown>
                )}
              </div>
            )}

            <div className="my-message-time text-end mt-1 d-flex align-items-center justify-content-end gap-1">
              {formatTime(msg.created_at)}
              {isAdmin && (
                <BiCheckDouble size={16} color={msg.isPending ? 'gray' : msg.failed ? '#ff7b7b' : '#53bdeb'} />
              )}
            </div>

            {msg.reaction && (
              <div className="my-message-reaction-chip" aria-label={`Reaction ${msg.reaction}`}>
                {msg.reaction}
              </div>
            )}

          </div>
        </div>
      );
    });
  }, [
    loading,
    messages,
    openMessageActionsId,
    swipeReplyState,
    onMessageTouchStart,
    onMessageTouchMove,
    onMessageTouchEnd,
    handleReactToMessage,
    handleCopyMessage,
    handleReplyToMessage,
    handleDeleteFromMe,
    handleDeleteForEveryone,
    activeAudioId,
    audioCurrentById,
    audioDurationById,
    toggleAudioPlayback,
    setAudioElementRef,
    handleAudioLoadedMetadata,
    handleAudioTimeUpdate,
    handleAudioEnded,
    handleAudioPause,
    handleAudioSeek,
    formatAudioTime,
    formatTime,
    chatUserName,
    messageSearchQuery,
    renderHighlightedText
  ]);

  return (
    <div className="d-flex flex-column h-100 admin-chat-container position-relative">
      
      {/* --- HEADER --- */}
      <div className="my-chat-header d-flex align-items-center px-2 px-md-3">
        <div className="my-chat-header-left">
          {isMobileView && (
            <button className="my-header-back-btn" onClick={onClose} aria-label="Go back">
              <BiArrowBack size={24} />
            </button>
          )}
          <div className="my-chat-avatar">
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="my-chat-user-meta ms-2">
            <span className="my-chat-title">{displayName}</span>
            <span className="my-connection-text">{statusLabel}</span>
          </div>
        </div>
        
        {/* Three Dots Context Menu */}
        <div className="my-chat-header-actions">
          {showMessageSearch && (
            <div ref={searchRowRef} className="my-chat-search-inline-shell d-flex align-items-center gap-2">
              <input
                ref={searchInputRef}
                type="text"
                className="my-chat-search-input"
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search in chat messages"
              />
            </div>
          )}

          <button
            ref={searchToggleBtnRef}
            type="button"
            className="btn btn-link shadow-none my-actions-toggle-btn text-muted p-2"
            onClick={() => {
              setShowMessageSearch((prev) => !prev);
              if (showMessageSearch) {
                setMessageSearchQuery('');
              }
            }}
            aria-label="Search messages"
            title="Search messages"
          >
            <BiSearch size={20} color={isMobileView ? 'white' : undefined} />
          </button>

          <Dropdown
            align="end"
            className="my-actions-dropdown-wrap"
            autoClose={true}
            show={showActionsMenu}
            onToggle={(isOpen) => setShowActionsMenu(Boolean(isOpen))}
          >
            <Dropdown.Toggle as="button" className="btn btn-link shadow-none my-actions-toggle-btn text-muted p-2">
              <BiDotsVerticalRounded size={24} color={isMobileView ? "white" : undefined} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="my-chat-actions-menu border-0 shadow-sm">
              <Dropdown.Item className="my-actions-item text-danger" onClick={handleDeleteSession}>
                Delete Session
              </Dropdown.Item>
              <Dropdown.Item className="my-actions-item" onClick={handlePingUser}>
                Ping User
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.ItemText className="my-actions-item d-flex align-items-center justify-content-between gap-2">
                <span>Darkmode</span>
                <Form.Check
                  type="switch"
                  id={`chat-darkmode-switch-${sessionId}`}
                  checked={isDarkModeEnabled}
                  onChange={handleThemeToggle}
                  onClick={(event) => event.stopPropagation()}
                  className="m-0"
                />
              </Dropdown.ItemText>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* --- CHAT BODY --- */}
      <div className="my-chat-body flex-grow-1 overflow-auto p-3">
        {renderedMessages}
        <div ref={messagesEndRef} />
      </div>

      {/* --- ATTACHMENT PREVIEW --- */}
      {replyToMessage && (
        <div className="my-reply-preview d-flex align-items-center justify-content-between px-3 py-2">
          <div className="my-reply-preview-content">
            <small className="d-block fw-semibold">Replying to {replyToMessage.sender === 'admin' ? 'you' : 'user'}</small>
            <small className="d-block text-truncate">{replyToMessage.previewText}</small>
          </div>
          <button
            type="button"
            className="btn btn-link text-muted p-0 my-reply-preview-close"
            onClick={() => setReplyToMessage(null)}
            aria-label="Cancel reply"
          >
            <BiX size={18} />
          </button>
        </div>
      )}

      {attachedFile && (
        <div className="my-attachment-preview bg-white border-top p-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 text-truncate small text-muted">
            <BiPaperclip size={18} />
            <span className="text-truncate">{attachedFile.name}</span>
          </div>
          <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setAttachedFile(null)}>
            <BiX size={22} />
          </button>
        </div>
      )}

      {/* --- INPUT AREA (WhatsApp Style) --- */}
      <div className="my-input-wrap d-flex align-items-end p-2 gap-2 w-100 position-relative">
        
        {/* Custom Emoji Picker Popover */}
        {showEmojiPicker && (
          <>
            <button
              type="button"
              className="my-emoji-dismiss-layer"
              onClick={() => setShowEmojiPicker(false)}
              aria-label="Close emoji picker"
            />
            <div
              ref={emojiPopoverRef}
              className="my-emoji-picker-popover shadow-sm rounded p-2 position-absolute bg-white border"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={280}
                previewConfig={{ showPreview: false }}
              />
            </div>
          </>
        )}

        {/* White pill wrapper for input and inner buttons */}
        <div className="my-chat-input-wrapper d-flex align-items-center flex-grow-1">

          {isRecording && !isRecordingLocked ? (
            <div className="my-recording-hold-status">
              <span className="my-recording-dot" />
              <span className="my-recording-time">{formatRecordingTime(recordingSeconds)}</span>
              <span className="my-recording-hint">Swipe up to lock</span>
            </div>
          ) : (
            <>
              {/* Emoji Button (Left) */}
              <button 
                type="button"
                className="my-action-icon" 
                title="Emojis"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <BiSmile size={22} />
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                className="my-chat-input-field form-control border-0 shadow-none bg-transparent w-100"
                placeholder="Type a message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                autoComplete="off"
                ref={inputRef}
              />

              {/* Attach File Button (Right - Docs & Images Only) */}
              <label className="my-action-icon" title="Attach file" style={{ cursor: 'pointer' }}>
                <BiPaperclip size={22} style={{ transform: 'rotate(45deg)' }} />
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileAttach}
                />
              </label>
            </>
          )}

          {isRecordingLocked && (
            <div className="my-recording-locked-controls ms-2">
              <button
                type="button"
                className="my-action-icon"
                onClick={togglePauseRecording}
                title={isRecordingPaused ? 'Resume recording' : 'Pause recording'}
              >
                {isRecordingPaused ? <BiPlay size={22} /> : <BiPause size={22} />}
              </button>
              <span className="my-recording-time">{formatRecordingTime(recordingSeconds)}</span>
              <button
                type="button"
                className="my-action-icon"
                onClick={() => stopVoiceRecordingWithMode(true)}
                title="Send recording"
              >
                <BiSend size={21} />
              </button>
            </div>
          )}
        </div>

        {/* Floating Send/Mic Button (Far Right) */}
        <button
          className="my-send-mic-btn d-flex align-items-center justify-content-center flex-shrink-0"
          onMouseDown={(e) => {
            if (inputText.trim() || attachedFile) return;
            e.preventDefault();
            handleMicPressStart(e.clientY);
          }}
          onMouseMove={(e) => {
            if (inputText.trim() || attachedFile) return;
            handleMicPressMove(e.clientY);
          }}
          onMouseUp={(e) => {
            if (inputText.trim() || attachedFile) return;
            e.preventDefault();
            handleMicPressEnd();
          }}
          onMouseLeave={() => {
            if (inputText.trim() || attachedFile) return;
            if (isMicPressingRef.current && !isRecordingLocked) {
              handleMicPressCancel();
            }
          }}
          onTouchStart={(e) => {
            if (inputText.trim() || attachedFile) return;
            e.preventDefault();
            const touch = e.touches?.[0];
            handleMicPressStart(touch?.clientY ?? null);
          }}
          onTouchMove={(e) => {
            if (inputText.trim() || attachedFile) return;
            e.preventDefault();
            const touch = e.touches?.[0];
            handleMicPressMove(touch?.clientY ?? null);
          }}
          onTouchEnd={(e) => {
            if (inputText.trim() || attachedFile) return;
            e.preventDefault();
            handleMicPressEnd();
          }}
          onClick={(e) => {
            if (inputText.trim() || attachedFile) {
              handleSendMessage();
              return;
            }
            e.preventDefault();

            if (!isRecording) {
              handleMicPressStart(null);
              return;
            }

            if (!isMicPressingRef.current) {
              stopVoiceRecordingWithMode(true);
            }
          }}
          title={(inputText.trim() || attachedFile) ? 'Send message' : isRecording ? (isRecordingLocked ? 'Recording locked' : 'Release to send') : 'Hold to record'}
          disabled={sending}
        >
          {sending ? (
            <Spinner animation="border" size="sm" variant="light" />
          ) : (inputText.trim() || attachedFile) ? (
            <BiSend size={20} color="white" />
          ) : isRecordingLocked ? (
            <BiLockAlt size={22} color="white" />
          ) : (
            <BiMicrophone size={24} color={isRecording ? '#ff4d4f' : 'white'} />
          )}
        </button>
      </div>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast bg="success" show={showCopyToast} autohide delay={2200} onClose={() => setShowCopyToast(false)}>
          <Toast.Body className="text-white">Copied successfully</Toast.Body>
        </Toast>
      </ToastContainer>

      <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm((prev) => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton>
          <Modal.Title>{deleteConfirm.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{deleteConfirm.body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteConfirm((prev) => ({ ...prev, show: false }))}>
            Cancel
          </Button>
          <Button variant={deleteConfirm.variant || 'danger'} onClick={confirmDeleteAction}>
            {deleteConfirm.confirmLabel || 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminChat;