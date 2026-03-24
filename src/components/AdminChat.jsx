import { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
  import Card from 'react-bootstrap/Card';
  import Button from 'react-bootstrap/Button';
  import Form from 'react-bootstrap/Form';
  import Spinner from 'react-bootstrap/Spinner';
  import Alert from 'react-bootstrap/Alert';
  import { BiMicrophone, BiSend, BiStopCircle, BiTrash, BiX } from 'react-icons/bi';
  import ReactMarkdown from 'react-markdown';
  import remarkMath from 'remark-math';
  import rehypeKatex from 'rehype-katex';
  import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, toWebSocketUrl, withAuthHeaders } from '../utils/adminApi';

  /**
   * AdminChat Component - Handles admin-to-user chat interface
   * Connects to a specific chat session via WebSocket for real-time messaging
   * 
   * @param {string} sessionId - The chat session ID to connect to
   * @param {function} onClose - Callback when admin closes the chat
   */
  const AdminChat = ({ sessionId, onClose }) => {
    const token = getStoredAdminToken();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [isRecording, setIsRecording] = useState(false)
    const [isDeletingSession, setIsDeletingSession] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const webSocketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const pingTimerRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isMountedRef = useRef(false);
    const intentionalCloseRef = useRef(false);
    const mediaRecorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const getAudioStorageKey = (messageId) => `portfolio_admin_chat_audio_${sessionId}_${messageId}`;

    const storeAudioForMessage = (messageId, audioData) => {
      const key = getAudioStorageKey(messageId);
      localStorage.setItem(key, audioData);
      return key;
    };


    const formatRecordingTime = (seconds = 0) => {
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      return `${mins}:${secs}`;
    };

    const resolveAudioSource = (msg) => {
      if (msg?.audioData) return msg.audioData;
      if (!msg?.audioStorageKey) return '';
      return localStorage.getItem(msg.audioStorageKey) || '';
    };

    // Auto-scroll to bottom
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearPingTimer = () => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };

    const clearRecordingTimer = () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };

    const startPing = (ws) => {
      clearPingTimer();
      pingTimerRef.current = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
          } catch {
            // ignore ping failures, close/reconnect lifecycle handles this.
          }
        }
      }, 25000);
    };

    const getCloseReasonText = (event) => {
      if (!event) return 'unknown reason';
      const reason = event.reason?.trim();
      if (reason) return reason;

      const knownReasons = {
        1000: 'normal closure',
        1001: 'endpoint going away',
        1006: 'network interruption',
        1008: 'policy violation (often auth/token)',
        1011: 'server internal error',
        1012: 'server restart'
      };

      return knownReasons[event.code] || `close code ${event.code || 'unknown'}`;
    };

    const scheduleReconnect = (wsConfig) => {
      if (!isMountedRef.current) return;

      setIsReconnecting(true);
      clearReconnectTimer();
      const attempts = reconnectAttemptsRef.current + 1;
      reconnectAttemptsRef.current = attempts;
      const delay = Math.min(1500 * attempts, 10000);

      reconnectTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        connectWebSocket(wsConfig);
      }, delay);
    };

    // Fetch initial chat session data and establish WebSocket connection
    useEffect(() => {
      isMountedRef.current = true;
      intentionalCloseRef.current = false;

      const initializeChat = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setIsConnected(false);
          setIsReconnecting(false);
          reconnectAttemptsRef.current = 0;
          
          // Verify token exists before attempting connection
          if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
          }
          
          // Step 1: Fetch session data
          const response = await fetch(
            buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`),
            {
              headers: withAuthHeaders(token)
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch session data: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.status === 'ok' && isMountedRef.current) {
            console.log('📥 DEBUG: Session data received:', {
              hasAdminWebsocket: !!data.admin_websocket,
              adminWebsocket: data.admin_websocket,
              messageCount: data.messages?.length || 0
            });
            setSessionInfo(data);
            
            // Convert API messages format to display format
            const formattedMessages = data.messages.map((msg, index) => {
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed?.type === 'audio' && parsed?.audio_base64) {
                  const messageId = `audio-${Date.now()}-${index}`;
                  const audioStorageKey = storeAudioForMessage(messageId, parsed.audio_base64);
                  return {
                    id: messageId,
                    role: msg.role,
                    type: 'audio',
                    mimeType: parsed.mime_type || 'audio/webm',
                    audioStorageKey,
                    timestamp: parsed.timestamp || msg.timestamp,
                    sender: parsed.role === 'admin' ? 'admin' : 'user'
                  };
                }
              } catch {
                // keep as text message
              }

              return {
                id: index,
                role: msg.role,
                type: 'text',
                content: msg.content,
                timestamp: msg.timestamp,
                sender: msg.role === 'user' ? 'user' : 'admin'
              };
            });
            
            setMessages(formattedMessages);
            setIsLoading(false);
            
            // Step 2: Connect to WebSocket after session data is loaded
            // Always attempt connection - the user might come back online
            console.log('🔌 Initiating WebSocket connection with:', data.admin_websocket);
            connectWebSocket(data.admin_websocket || data.websocket || '');
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (err) {
          console.error('Error fetching session data:', err);
          if (isMountedRef.current) {
            setError(err.message || 'Failed to load chat session');
            setIsLoading(false);
          }
        }
      };

      initializeChat();

      return () => {
        isMountedRef.current = false;
        intentionalCloseRef.current = true;
        clearReconnectTimer();
        clearPingTimer();
        clearRecordingTimer();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        // Cleanup on unmount
        if (webSocketRef.current) {
          webSocketRef.current.close();
        }
      };
    }, [sessionId, token]);

    const connectWebSocket = (wsConfig) => {
      try {
        console.log('🔍 DEBUG: connectWebSocket called with wsConfig:', wsConfig);
        console.log('🔍 DEBUG: wsConfig type:', typeof wsConfig);
        console.log('🔍 DEBUG: token exists:', !!token);
        
        if (webSocketRef.current) {
          intentionalCloseRef.current = true;
          webSocketRef.current.close(1000, 'switching websocket connection');
        }

        const rawUrl = typeof wsConfig === 'string' ? wsConfig : wsConfig?.url;
        console.log('🔍 DEBUG: rawUrl extracted:', rawUrl);
        
        let wsUrl = toWebSocketUrl(rawUrl);
        console.log('🔍 DEBUG: wsUrl after toWebSocketUrl:', wsUrl);

        if (token && wsUrl) {
          const separator = wsUrl.includes('?') ? '&' : '?';
          wsUrl += `${separator}token=${encodeURIComponent(token)}`;
          console.log('🔍 DEBUG: wsUrl after token appended:', wsUrl);
        } else {
          console.log('🔍 DEBUG: NOT appending token - token:', !!token, 'wsUrl:', !!wsUrl);
        }

        if (!wsUrl) {
          throw new Error('Invalid websocket URL from backend');
        }
        
        console.log('🔍 DEBUG: About to create WebSocket with URL:', wsUrl);
        const ws = new WebSocket(wsUrl);
        console.log('🔍 DEBUG: WebSocket object created, readyState:', ws.readyState);

        ws.onopen = () => {
          console.log('✅ WebSocket connected for admin');
          console.log('✅ DEBUG: ws.readyState OPEN:', ws.readyState === WebSocket.OPEN);
          intentionalCloseRef.current = false;
          reconnectAttemptsRef.current = 0;
          setIsReconnecting(false);
          clearReconnectTimer();
          clearPingTimer();
          setIsConnected(true);
          setError(null);
          setIsLoading(false);
          setSessionInfo((prev) => ({ ...(prev || {}), human_mode: true }));
          startPing(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'pong') {
              return;
            }

            if (data.type === 'audio' && data.audio_base64) {
              const messageId = `audio-${Date.now()}`;
              const audioStorageKey = storeAudioForMessage(messageId, data.audio_base64);
              setMessages(prev => [
                ...prev,
                {
                  id: messageId,
                  role: data.role || 'user',
                  type: 'audio',
                  mimeType: data.mime_type || 'audio/webm',
                  audioStorageKey,
                  timestamp: data.timestamp || new Date().toISOString(),
                  sender: data.role === 'admin' ? 'admin' : 'user'
                }
              ]);
              setIsSending(false);
              return;
            }

            if (data.type === 'session_cleared') {
              setSessionInfo((prev) => ({
                ...(prev || {}),
                cleared_by_user: true,
                cleared_at: data.timestamp || new Date().toISOString()
              }));
              setMessages([]);
              setError('User cleared this chat session. You can now delete the session.');
              setIsSending(false);
              return;
            }

            if (data.type === 'session_deleted') {
              setError('This chat session was deleted. Returning to chat list...');
              setIsSending(false);
              setTimeout(() => {
                onClose();
              }, 500);
              return;
            }
            
            if (data.type === 'message') {
              const newMessage = {
                id: Date.now(),
                role: data.role || 'user',
                type: 'text',
                content: String(data.content || data.message || ''),
                timestamp: data.timestamp || new Date().toISOString(),
                sender: data.role === 'admin' ? 'admin' : 'user'
              };
              
              setMessages(prev => [...prev, newMessage]);
              return;
            }

            if (typeof data.content === 'string' || typeof data.message === 'string') {
              const content = String(data.content || data.message || '').trim();
              if (!content) return;
              const sender = data.role === 'admin' ? 'admin' : 'user';

              setMessages(prev => [
                ...prev,
                {
                  id: Date.now(),
                  role: data.role || (sender === 'admin' ? 'assistant' : 'user'),
                  type: 'text',
                  content,
                  timestamp: data.timestamp || new Date().toISOString(),
                  sender
                }
              ]);
              return;
            }
          } catch (err) {
            const rawContent = String(event?.data || '').trim();
            if (!rawContent || rawContent.startsWith('---')) {
              return;
            }

            const isAdminPrefixed = /^Admin:\s*/i.test(rawContent);
            const normalized = rawContent
              .replace(/^User:\s*/i, '')
              .replace(/^Admin:\s*/i, '');

            const newMessage = {
              id: Date.now(),
              role: isAdminPrefixed ? 'assistant' : 'user',
              type: 'text',
              content: normalized,
              timestamp: new Date().toISOString(),
              sender: isAdminPrefixed ? 'admin' : 'user'
            };
            setMessages(prev => [...prev, newMessage]);
          }
          
          setIsSending(false);
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error('❌ DEBUG: ws.readyState:', ws.readyState);
          console.error('❌ DEBUG: error object:', JSON.stringify({
            type: error.type,
            message: error.message,
            target: {
              readyState: error.target?.readyState,
              url: error.target?.url
            }
          }));
          setError('Connection error occurred. Attempting to recover...');
          setIsConnected(false);
        };

        ws.onclose = (event) => {
          clearPingTimer();
          const reasonText = getCloseReasonText(event);
          console.log('🔴 WebSocket disconnected:', {
            code: event?.code,
            reason: event?.reason,
            reasonText,
            wasClean: event?.wasClean
          });
          console.log('🔴 DEBUG: ws.readyState CLOSED:', event?.code === 1000);
          setIsConnected(false);
          setIsSending(false);

          const isIntentional = intentionalCloseRef.current;
          intentionalCloseRef.current = false;

          if (isIntentional || event?.code === 1000) {
            setIsReconnecting(false);
            setIsLoading(false);
            return;
          }

          if (!isMountedRef.current) return;

          setError(`Chat disconnected (${reasonText}). Reconnecting...`);
          setIsLoading(false);
          scheduleReconnect(wsConfig);
        };

        webSocketRef.current = ws;
      } catch (err) {
        console.error('❌ Failed to establish WebSocket connection:', err);
        console.error('❌ DEBUG: Error details:', {
          message: err.message,
          stack: err.stack
        });
        setIsReconnecting(false);
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
          type: 'text',
          content: input,
          timestamp: new Date().toISOString(),
          sender: 'admin'
        };

        setMessages(prev => [...prev, userMessage]);

        // Send via WebSocket
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(JSON.stringify({
            type: 'message',
            content: input,
            role: 'admin'
          }));
          setIsSending(false);
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
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();
        const timeString = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        if (isToday) {
          return `Today, ${timeString}`;
        } else if (isYesterday) {
          return `Yesterday, ${timeString}`;
        } else {
          return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${timeString}`;
        }
      } catch {
        return '';
      }
    };

    const startVoiceRecording = async () => {
      if (isRecording || !sessionInfo?.human_mode) return;
      if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError('Voice recording is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recordingChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
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

            const messageId = `audio-${Date.now()}`;
            const audioStorageKey = storeAudioForMessage(messageId, audioBase64);

            setMessages((prev) => [
              ...prev,
              {
                id: messageId,
                role: 'admin',
                sender: 'admin',
                type: 'audio',
                mimeType: blob.type || 'audio/webm',
                audioStorageKey,
                timestamp: new Date().toISOString()
              }
            ]);

            if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
              webSocketRef.current.send(JSON.stringify({
                type: 'audio',
                role: 'admin',
                audio_base64: audioBase64,
                mime_type: blob.type || 'audio/webm',
                duration_seconds: null,
                timestamp: new Date().toISOString()
              }));
            }
          };
          reader.readAsDataURL(blob);
        };

        recorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        clearRecordingTimer();
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch {
        setError('Microphone access was denied.');
        setIsRecording(false);
        clearRecordingTimer();
      }
    };

    const stopVoiceRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };

    const handleRecordPressStart = (event) => {
      event.preventDefault();
      if (!isRecording) {
        startVoiceRecording();
      }
    };

    const handleRecordPressEnd = (event) => {
      event.preventDefault();
      if (isRecording) {
        stopVoiceRecording();
      }
    };


    const handleDeleteSession = async () => {
      if (!sessionId || isDeletingSession) return;
      setIsDeletingSession(true);
      setError(null);
      try {
        const response = await fetch(buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`), {
          method: 'DELETE',
          headers: withAuthHeaders(token)
        });
        if (!response.ok) {
          throw new Error('Failed to delete session.');
        }
        setShowDeleteModal(false);
        onClose();
      } catch (err) {
        setError(err.message || 'Unable to delete session.');
      } finally {
        setIsDeletingSession(false);
      }
    };

    return (
      <div className="admin-chat-container">
        <Card className="h-100 border-0 d-flex flex-column my-chat-card">
          
          <div className="card-header my-chat-header d-flex align-items-center justify-content-between py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <div className="my-chat-avatar">
                <i className="bi bi-person-workspace" />
              </div>
              <div>
                <h6 className="mb-0 fw-semibold">Live Support</h6>
                <div className="d-flex align-items-center gap-2">
                  <small className="my-connection-text">
                    {isConnected ? 'online' : isReconnecting ? 'reconnecting...' : 'disconnected'}
                  </small>
                  {isReconnecting && <span className="badge bg-warning text-dark">Reconnecting</span>}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="btn btn-sm my-close-btn p-0"
              aria-label="Close chat"
            >
              <BiX size={24} />
            </button>
          </div>

          {sessionInfo && (
            <div className="my-session-meta px-3 py-2 border-bottom">
              <small className="text-muted d-flex align-items-center gap-2 flex-wrap">
                <strong>Session:</strong> {sessionId}
                {sessionInfo.human_mode && (
                  <span className="badge bg-primary">HUMAN MODE</span>
                )}
                {sessionInfo.cleared_by_user && (
                  <span className="badge bg-warning text-dark">CLEARED BY USER</span>
                )}
              </small>
              {sessionInfo.cleared_by_user && (
                <>
                  <div className="mt-2 d-flex justify-content-end">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeletingSession}
                    >
                      {isDeletingSession ? <Spinner animation="border" size="sm" /> : <><BiTrash className="me-1" /> Delete Session</>}
                    </Button>
                  </div>
                  <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>Delete Chat Session</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      Are you sure you want to permanently delete this cleared chat session?
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeletingSession}>
                        Cancel
                      </Button>
                      <Button variant="danger" onClick={handleDeleteSession} disabled={isDeletingSession}>
                        {isDeletingSession ? <Spinner animation="border" size="sm" /> : 'Delete'}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              )}
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mb-0 rounded-0">
              <small>{error}</small>
            </Alert>
          )}

          <Card.Body className="chat-body my-chat-body p-3 overflow-auto flex-grow-1">
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
                  className={`d-flex mb-2 align-items-center ${msg.sender === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {/* Message bubble */}
                  <div 
                    className={`p-2 px-3 rounded-3 my-message-bubble ${
                      msg.sender === 'admin'
                        ? 'my-message-admin rounded-bottom-end-0'
                        : 'my-message-user rounded-bottom-start-0'
                    }`}
                    style={{ maxWidth: '78%', wordWrap: 'break-word' }}
                  >
                    {msg.type === 'audio' ? (
                      <audio
                        controls
                        preload="metadata"
                        style={{ width: '230px', maxWidth: '100%' }}
                        src={resolveAudioSource(msg)}
                      />
                    ) : (
                      <div className="my-chat-markdown" style={{ wordBreak: 'break-word' }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <p className="mb-1">{children}</p>,
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-secondary bg-opacity-25 px-2 py-1 rounded">{children}</code>
                              ) : (
                                <pre className="bg-secondary bg-opacity-25 p-2 rounded overflow-auto my-2">
                                  <code>{children}</code>
                                </pre>
                              ),
                            ul: ({ children }) => <ul className="ps-3 mb-1">{children}</ul>,
                            ol: ({ children }) => <ol className="ps-3 mb-1">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            )
                          }}
                        >
                          {msg.content || ''}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.timestamp && (
                      <small className="d-flex justify-content-end mt-1 my-message-time">
                        {formatTimestamp(msg.timestamp)}
                      </small>
                    )}
                  </div>
                  {/* Copy icon, only for text messages */}
                  {msg.type === 'text' && msg.content && (
                    <button
                      className="btn btn-sm btn-light my-copy-btn ms-2"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', boxShadow: 'none' }}
                      title="Copy message"
                      aria-label="Copy message"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                      }}
                    >
                      {/* WhatsApp style copy icon (Material Design) */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="d-flex mb-3 justify-content-end">
                <div className="p-3 rounded-3 my-message-admin rounded-bottom-end-0 d-flex align-items-center gap-2">
                  <Spinner animation="grow" size="sm" variant="light" />
                  <small style={{ fontSize: '0.9rem' }}>Sending...</small>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </Card.Body>

          <div className="card-footer my-input-wrap p-2 border-top">
            {isRecording ? (
              <div className="d-flex align-items-center justify-content-between">
                <div className="chat-recording-indicator d-flex align-items-center gap-2">
                  <span className="chat-recording-dot bg-danger rounded-circle me-2" style={{ width: 10, height: 10, animation: 'blink 1s infinite' }} />
                  <span className="fw-bold text-danger">{formatRecordingTime(recordingTime)}</span>
                </div>
                <Button
                  variant="danger"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48 }}
                  onClick={stopVoiceRecording}
                  aria-label="Stop recording"
                >
                  <BiStopCircle size={28} />
                </Button>
              </div>
            ) : (
              <Form onSubmit={handleSendMessage} className="d-flex gap-2 my-input-row">
                <Form.Control 
                  type="text" 
                  placeholder={isConnected ? 'Type a message' : 'Disconnected...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!isConnected || isLoading}
                  className="border-0 shadow-none my-chat-input my-mobile-input rounded-pill"
                  style={{ fontSize: '0.88rem', color: 'var(--text-main)', background: 'var(--section-bg)' }}
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={!sessionInfo?.human_mode}
                  className="rounded-circle d-flex align-items-center justify-content-center bg-navy"
                  style={{ width: 48, height: 48 }}
                  onPointerDown={handleRecordPressStart}
                  onPointerUp={handleRecordPressEnd}
                  onPointerCancel={handleRecordPressEnd}
                  onPointerLeave={handleRecordPressEnd}
                  onContextMenu={(event) => event.preventDefault()}
                  title={sessionInfo?.human_mode ? 'Hold to record voice message' : 'Voice is available in human mode'}
                  aria-label="Record voice"
                >
                  <BiMicrophone size={28} />
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={!isConnected || isLoading || isSending || !input.trim()}
                  className="rounded-circle d-flex align-items-center justify-content-center bg-navy"
                  style={{ width: 48, height: 48 }}
                >
                  {isSending ? <Spinner animation="border" size="sm" /> : <BiSend size={28} />}
                </Button>
              </Form>
            )}

            {isDeletingSession && (
              <div className="d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" />
                <small>Deleting session...</small>
              </div>
            )}
          </div>

        </Card>
      </div>
    );
  };

  export default AdminChat;
