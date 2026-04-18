import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Button, Dropdown, Modal } from 'react-bootstrap';
import { BiArrowBack, BiMoon, BiRefresh, BiSun, BiDotsVerticalRounded } from 'react-icons/bi';
import AdminChat from './AdminChat';
import { ADMIN_ROUTES, buildAdminUrl, buildAdminWebSocketUrl, getStoredAdminToken, withAuthHeaders } from '../utils/adminApi';
import './AdminChatPage.css';

/**
 * AdminChatPage - Admin Chat interface
 * Allows admins to manage and chat with users from active sessions
 */
const AdminChatPage = () => {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  const token = getStoredAdminToken();
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState({ show: false, sessionId: null, title: '', body: '' });
  const [openSessionActionsId, setOpenSessionActionsId] = useState(null);
  const [updatingSessionIds, setUpdatingSessionIds] = useState(new Set());
  const previewCacheRef = useRef({});
  const sessionTouchTimerRef = useRef(null);
  const sessionTouchLongPressRef = useRef(false);
  const websocketRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const wsReconnectCountRef = useRef(0);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 991.98px)').matches : false
  );

  const clearSessionTouchTimer = useCallback(() => {
    if (sessionTouchTimerRef.current) {
      clearTimeout(sessionTouchTimerRef.current);
      sessionTouchTimerRef.current = null;
    }
  }, []);

  const deriveLastMessagePreview = useCallback((messages = []) => {
    if (!Array.isArray(messages) || messages.length === 0) return 'No messages yet';

    const lastEntry = messages[messages.length - 1] || {};
    const rawContent = (typeof lastEntry.content === 'string' ? lastEntry.content : '').trim();
    if (!rawContent) return 'No messages yet';

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === 'object') {
        if (parsed.type === 'audio' && parsed.audio_base64) {
          return 'Voice message';
        }

        const content = (parsed.content || '').toString().trim();
        if (content) return content;
      }
    } catch {
      // Keep plain string content as-is when message is not JSON.
    }

    return rawContent;
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
    }
  }, [navigate, token]);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 991.98px)');
    const onChange = (event) => {
      setIsMobileView(event.matches);
    };

    setIsMobileView(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!openSessionActionsId) return;

    const handleOutsideSessionActions = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (
        target.closest('.my-session-actions-dropdown') ||
        target.closest('.my-session-actions-toggle')
      ) {
        return;
      }

      setOpenSessionActionsId(null);
    };

    document.addEventListener('mousedown', handleOutsideSessionActions);
    document.addEventListener('touchstart', handleOutsideSessionActions);

    return () => {
      document.removeEventListener('mousedown', handleOutsideSessionActions);
      document.removeEventListener('touchstart', handleOutsideSessionActions);
    };
  }, [openSessionActionsId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpenSessionActionsId(null);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const response = await fetch(buildAdminUrl(ADMIN_ROUTES.sessions), {
        headers: withAuthHeaders(token)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.sessions) {
        // Sort sessions by most recent activity first (new sessions appear at top)
        const sortedSessions = [...data.sessions].sort((a, b) => {
          const timeA = new Date(a.last_activity || a.created_at || 0);
          const timeB = new Date(b.last_activity || b.created_at || 0);
          return timeB - timeA; // Most recent first
        });

        const sessionsWithPreviews = await Promise.all(
          sortedSessions.map(async (session) => {
            const sessionId = session.session_id;
            const providedPreview = (session.last_message || '').toString().trim();
            const messageCount = Number(session.message_count || 0);

            if (providedPreview) {
              previewCacheRef.current[sessionId] = { messageCount, preview: providedPreview };
              return session;
            }

            const cached = previewCacheRef.current[sessionId];
            if (cached && cached.messageCount === messageCount && cached.preview) {
              return { ...session, last_message: cached.preview };
            }

            try {
              const detailResponse = await fetch(
                buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`),
                { headers: withAuthHeaders(token) }
              );

              if (!detailResponse.ok) {
                return { ...session, last_message: 'No messages yet' };
              }

              const detailData = await detailResponse.json();
              const preview = deriveLastMessagePreview(detailData.messages || []);
              previewCacheRef.current[sessionId] = { messageCount, preview };
              return { ...session, last_message: preview };
            } catch {
              return { ...session, last_message: 'No messages yet' };
            }
          })
        );

        setSessions(sessionsWithPreviews);
        setError(null);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [deriveLastMessagePreview, token]);

  // Fetch active sessions on component mount and set up polling
  useEffect(() => {
    fetchActiveSessions();
    // Poll for new sessions every 10 seconds (WebSocket handles real-time updates, polling is backup)
    pollingIntervalRef.current = setInterval(fetchActiveSessions, 10000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [fetchActiveSessions]);

  useEffect(() => {
    if (routeSessionId) {
      setActiveSession(routeSessionId);
    }
  }, [routeSessionId]);

  // WebSocket connection for real-time session list updates
  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = buildAdminWebSocketUrl('/ws/admin/sessions-list');
        const wsUrlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrlWithToken);

        ws.onopen = () => {
          console.log('✅ Connected to session list WebSocket');
          websocketRef.current = ws;
          wsReconnectCountRef.current = 0; // Reset on successful connection
          // Send ping to keep connection alive every 30 seconds
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
          ws.pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            
            if (update.type === 'pong') return;
            
            // Handle session updates
            if (update.type === 'session_marked_read' || 
                update.type === 'session_archived' || 
                update.type === 'session_deleted') {
              setSessions((prev) =>
                prev.map((session) =>
                  session.session_id === update.session_id
                    ? { ...session, ...update.session_data }
                    : session
                )
              );
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('⚠️ Disconnected from session list WebSocket');
          websocketRef.current = null;
          if (ws.pingInterval) clearInterval(ws.pingInterval);
          
          // Exponential backoff for reconnection (max 30 seconds)
          const delayMs = Math.min(1000 * Math.pow(2, wsReconnectCountRef.current), 30000);
          wsReconnectCountRef.current += 1;
          console.log(`🔄 Reconnecting WebSocket in ${delayMs}ms (attempt ${wsReconnectCountRef.current})`);
          setTimeout(connectWebSocket, delayMs);
        };
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        const delayMs = Math.min(1000 * Math.pow(2, wsReconnectCountRef.current), 30000);
        wsReconnectCountRef.current += 1;
        setTimeout(connectWebSocket, delayMs);
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (!activeSession || loading) return;

    const sessionStillExists = sessions.some((session) => session.session_id === activeSession);
    if (!sessionStillExists) {
      setActiveSession(null);
      navigate('/admin/chat');
    }
  }, [activeSession, loading, navigate, sessions]);

  const formatRelativeTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = Math.max(0, Math.floor((now - date) / 1000));

      if (diff < 60) return 'just now';

      const minutes = Math.floor(diff / 60);
      if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      }

      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      }

      const days = Math.floor(hours / 24);
      if (days < 7) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }

      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleCloseChat = () => {
    setActiveSession(null);
    navigate('/admin/chat');
    // Refresh sessions to show updated list
    setTimeout(() => fetchActiveSessions(), 500);
  };

  const handleOpenSession = (sessionId) => {
    if (sessionTouchLongPressRef.current) {
      sessionTouchLongPressRef.current = false;
      return;
    }
    setActiveSession(sessionId);
    navigate(`/admin/chat/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId || deletingSessionId) return;

    setDeleteSessionConfirm({
      show: true,
      sessionId,
      title: 'Delete session?',
      body: 'This chat session will be permanently deleted. The user will be notified by email if available.'
    });
  };

  const confirmDeleteSession = async () => {
    const sessionId = deleteSessionConfirm.sessionId;
    if (!sessionId || deletingSessionId) return;

    setDeletingSessionId(sessionId);
    setError(null);

    try {
      const response = await fetch(buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}`), {
        method: 'DELETE',
        headers: withAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to delete session.');
      }

      if (activeSession === sessionId) {
        setActiveSession(null);
        navigate('/admin/chat');
      }

      await fetchActiveSessions();
    } catch (err) {
      setError(err.message || 'Unable to delete session.');
    } finally {
      setDeletingSessionId(null);
      setOpenSessionActionsId(null);
      setDeleteSessionConfirm({ show: false, sessionId: null, title: '', body: '' });
    }
  };

  const handleMarkSessionRead = async (sessionId) => {
    if (!sessionId) return;
    
    setUpdatingSessionIds((prev) => new Set([...prev, sessionId]));
    try {
      const response = await fetch(
        buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}/mark-read`),
        {
          method: 'PATCH',
          headers: withAuthHeaders(token)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark session as read');
      }

      // Update local session state
      setSessions((prev) =>
        prev.map((session) =>
          session.session_id === sessionId ? { ...session, is_read: true } : session
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to mark session as read');
    } finally {
      setUpdatingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      setOpenSessionActionsId(null);
    }
  };

  const handleArchiveSession = async (sessionId) => {
    if (!sessionId) return;

    setUpdatingSessionIds((prev) => new Set([...prev, sessionId]));
    try {
      const response = await fetch(
        buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}/archive`),
        {
          method: 'PATCH',
          headers: withAuthHeaders(token)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to archive session');
      }

      // Update local session state
      setSessions((prev) =>
        prev.map((session) =>
          session.session_id === sessionId ? { ...session, is_archived: true } : session
        )
      );

      if (activeSession === sessionId) {
        handleCloseChat();
      }
    } catch (err) {
      setError(err.message || 'Failed to archive session');
    } finally {
      setUpdatingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      setOpenSessionActionsId(null);
    }
  };

  const handleSessionTouchStart = (sessionId) => {
    clearSessionTouchTimer();
    sessionTouchLongPressRef.current = false;
    sessionTouchTimerRef.current = setTimeout(() => {
      sessionTouchLongPressRef.current = true;
      setOpenSessionActionsId((prev) => (prev === sessionId ? null : sessionId));
    }, 420);
  };

  const handleSessionTouchEnd = () => {
    clearSessionTouchTimer();
  };

  const visibleSessions = sessions.filter((session) => !session.is_archived);
  const activeSessionData = visibleSessions.find((session) => session.session_id === activeSession) || null;
  const chatDisplayName = activeSessionData?.human_mode ? (activeSessionData?.user_name || 'Anonymous') : 'Bot';
  const chatUserName = activeSessionData?.user_name || 'User';
  const chatStatusLabel = activeSessionData?.human_mode ? 'Live support' : 'Bot mode';
  const isTransientConnectionIssue = /fetch|network|connect|load sessions|failed to/i.test(error || '');

  const renderSessionsList = () => (
    <>
      <Card.Header className="my-sidebar-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="link"
            className="p-0 my-icon-btn my-back-btn"
            onClick={() => navigate('/admin/dashboard')}
            aria-label="Back to admin dashboard"
          >
            <BiArrowBack />
          </Button>
          <h6 className="mb-0">Chats</h6>
          <Badge bg="light" text="dark" pill>{visibleSessions.length}</Badge>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="link" className="p-0 my-icon-btn" onClick={fetchActiveSessions} aria-label="Refresh chats">
            <BiRefresh />
          </Button>
          <Button
            variant="link"
            className="p-0 my-icon-btn"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <BiSun /> : <BiMoon />}
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="p-0 my-sidebar-body">
        {loading ? (
          <div className="p-3 text-center my-chat-list-status">
            <Spinner animation="border" size="sm" className="my-teal-spinner" />
            <p className="small text-muted mt-2 mb-0">Loading chats...</p>
          </div>
        ) : error ? (
          <div className="p-3 text-center my-chat-list-status">
            <Spinner animation="border" size="sm" className="my-teal-spinner" />
            <p className="small text-muted mt-2 mb-0">
              {isTransientConnectionIssue ? 'Reconnecting to chat service...' : error}
            </p>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="p-3 text-center text-muted">
            <i className="bi bi-chat-dots fs-1 d-block mb-2 opacity-25"></i>
            <small>No active chats</small>
          </div>
        ) : (
          <div className="list-group list-group-flush my-session-list">
            {visibleSessions.map((session) => {
              const isActive = activeSession === session.session_id;
              const isDeletingThis = deletingSessionId === session.session_id;
              const isUpdatingThis = updatingSessionIds.has(session.session_id);
              const isRead = session.is_read || false;
              const sessionDisplayName = session.user_name ? session.user_name : session.human_mode ? 'Anonymous' : 'Bot';
              const sessionAvatarInitial = (sessionDisplayName || '?').trim().charAt(0).toUpperCase() || '?';
              const lastMessagePreview = (session.last_message || '').toString().trim() || 'No messages yet';

              return (
                <button
                  key={session.session_id}
                  onClick={() => handleOpenSession(session.session_id)}
                  className={`list-group-item list-group-item-action text-start border-0 border-bottom my-session-item ${
                    isActive ? 'my-session-item-active' : ''
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                  onTouchStart={() => handleSessionTouchStart(session.session_id)}
                  onTouchMove={handleSessionTouchEnd}
                  onTouchEnd={handleSessionTouchEnd}
                  onTouchCancel={handleSessionTouchEnd}
                >
                  <div className="my-session-row">
                    <div className="my-session-avatar" aria-hidden="true">
                      {sessionAvatarInitial}
                      {!isRead && <span className="my-session-unread-dot"></span>}
                    </div>
                    <div className="my-session-main flex-grow-1">
                      <div className="my-session-header-row d-flex justify-content-between align-items-start mb-1">
                        <strong className={`small text-truncate me-2 ${isRead ? '' : 'my-session-unread'}`}>
                          {sessionDisplayName}
                        </strong>
                        <div className="d-flex align-items-center gap-2">
                          <Dropdown
                            align="end"
                            className="my-session-actions-dropdown"
                            autoClose={true}
                            show={openSessionActionsId === session.session_id}
                            onToggle={(isOpen) => setOpenSessionActionsId(isOpen ? session.session_id : null)}
                          >
                            <Dropdown.Toggle
                              as="button"
                              className="my-session-actions-toggle"
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Open actions for ${sessionDisplayName}`}
                            >
                              <BiDotsVerticalRounded size={16} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="my-session-actions-menu" onClick={(event) => event.stopPropagation()}>
                              <Dropdown.Item
                                className="my-session-action-item"
                                onClick={() => handleDeleteSession(session.session_id)}
                                disabled={isDeletingThis}
                              >
                                {isDeletingThis ? 'Deleting...' : 'Delete session'}
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="my-session-action-item"
                                onClick={() => handleMarkSessionRead(session.session_id)}
                                disabled={isUpdatingThis || isRead}
                              >
                                {isUpdatingThis ? 'Updating...' : isRead ? 'Already read' : 'Mark as read'}
                              </Dropdown.Item>
                              <Dropdown.Item
                                className="my-session-action-item"
                                onClick={() => handleArchiveSession(session.session_id)}
                              >
                                Archive
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">{session.message_count || 0} messages</small>
                        <small className="text-muted text-nowrap">
                          {formatRelativeTime(session.last_activity || session.created_at)}
                        </small>
                      </div>
                      <small className={`text-truncate d-block text-muted session-last-message ${isRead ? '' : 'my-session-unread'}`}>
                        {lastMessagePreview}
                      </small>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card.Body>
    </>
  );

  return (
    <Container
      fluid
      className={`admin-chat-page my-admin-layout ${isMobileView ? 'my-mobile-layout' : ''} ${
        isMobileView && activeSession ? 'my-mobile-chat-open' : ''
      }`}
    >
      {!isMobileView && (
        <header className="my-admin-chat-main-header d-flex align-items-center justify-content-between px-3 px-md-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-chat-left-text-fill" aria-hidden="true"></i>
            <h5 className="mb-0">My Chat Assistant</h5>
          </div>
        </header>
      )}

      <Row className={`g-0 h-100 my-admin-chat-workspace ${isMobileView ? 'my-mobile-workspace' : ''}`}>
        {!isMobileView || !activeSession ? (
          <Col lg={4} xl={3} className={`my-sidebar-col ${isMobileView ? 'my-mobile-sidebar' : ''}`}>
            <Card className="border-0 my-sidebar-card h-100">
              {renderSessionsList()}
            </Card>
          </Col>
        ) : null}

        {(!isMobileView || activeSession) && (
          <Col lg={8} xl={9} className={`my-chat-column ${isMobileView ? 'my-mobile-chat-panel' : ''}`}>
            {activeSession ? (
              <AdminChat
                sessionId={activeSession}
                onClose={handleCloseChat}
                displayName={chatDisplayName}
                chatUserName={chatUserName}
                statusLabel={chatStatusLabel}
                isMobileView={isMobileView}
                onRefreshSession={fetchActiveSessions}
              />
            ) : (
              <Card className="border-0 my-empty-chat h-100 d-flex align-items-center justify-content-center">
                <Card.Body className="text-center">
                  <i className="bi bi-chat-square-text display-1 text-muted mb-3 opacity-25"></i>
                  <h5 className="text-muted mb-2">Select a chat to start replying</h5>
                  <p className="text-muted small mb-0">
                    {loading
                      ? 'Loading chats...'
                      : sessions.length === 0
                      ? 'No active sessions right now. New requests appear automatically.'
                      : 'Pick a session in the left sidebar to open the chat conversation.'}
                  </p>
                </Card.Body>
              </Card>
            )}
          </Col>
        )}
      </Row>

      <Modal
        show={deleteSessionConfirm.show}
        onHide={() => setDeleteSessionConfirm({ show: false, sessionId: null, title: '', body: '' })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{deleteSessionConfirm.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{deleteSessionConfirm.body}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteSessionConfirm({ show: false, sessionId: null, title: '', body: '' })}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteSession} disabled={!deleteSessionConfirm.sessionId}>
            Delete session
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminChatPage;
