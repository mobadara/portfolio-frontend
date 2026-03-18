import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import { BiArrowBack, BiMoon, BiRefresh, BiSun } from 'react-icons/bi';
import AdminChat from './AdminChat';
import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, withAuthHeaders } from '../utils/adminApi';
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

  useEffect(() => {
    if (!token) {
      navigate('/admin');
    }
  }, [navigate, token]);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  // Fetch active sessions on component mount
  useEffect(() => {
    fetchActiveSessions();
    // Poll for new sessions every 3 seconds (faster for better UX)
    const interval = setInterval(fetchActiveSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
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
        setSessions(sortedSessions);
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
  };

  useEffect(() => {
    if (routeSessionId) {
      setActiveSession(routeSessionId);
    }
  }, [routeSessionId]);

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
    fetchActiveSessions(); // Refresh sessions after closing
  };

  const handleOpenSession = (sessionId) => {
    setActiveSession(sessionId);
    navigate(`/admin/chat/${sessionId}`);
  };

  return (
    <Container fluid className="admin-chat-page my-admin-layout py-2 py-md-3">
      <Row className="g-3 g-md-2 h-100">
        <Col lg={4} xl={3} className="mb-2 mb-lg-0">
          <Card className="border-0 my-sidebar-card h-100">
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
                <Badge bg="light" text="dark" pill>{sessions.length}</Badge>
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
                <div className="p-3 text-center">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="small text-muted mt-2 mb-0">Loading chats...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">
                  <small>{error}</small>
                </Alert>
              ) : sessions.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-2 opacity-25"></i>
                  <small>No active chats</small>
                </div>
              ) : (
                <div className="list-group list-group-flush my-session-list">
                  {sessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => handleOpenSession(session.session_id)}
                      className={`list-group-item list-group-item-action text-start border-0 border-bottom my-session-item ${
                        activeSession === session.session_id ? 'active' : ''
                      }`}
                      aria-current={activeSession === session.session_id ? 'true' : undefined}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong className="small text-truncate me-2">
                          {session.user_name ? session.user_name : 'Anonymous'}
                        </strong>
                        <div className="d-flex align-items-center gap-2">
                          {activeSession === session.session_id && (
                            <Badge bg="success" pill>Selected</Badge>
                          )}
                          {session.cleared_by_user && (
                            <Badge bg="warning" text="dark" pill>Cleared</Badge>
                          )}
                          {session.human_mode ? (
                            <Badge bg="primary" pill>Live</Badge>
                          ) : (
                            <Badge bg="secondary" pill>Bot</Badge>
                          )}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted">{session.message_count || 0} messages</small>
                        <small className="text-muted text-nowrap">
                          {formatRelativeTime(session.last_activity || session.created_at)}
                        </small>
                      </div>
                      {session.last_message && (
                        <small className="text-truncate d-block text-muted session-last-message">
                          {session.last_message}
                        </small>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} xl={9}>
          {activeSession ? (
            <AdminChat
              sessionId={activeSession}
              onClose={handleCloseChat}
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
      </Row>
    </Container>
  );
};

export default AdminChatPage;
