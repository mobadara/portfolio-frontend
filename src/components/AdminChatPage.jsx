import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import AdminChat from './AdminChat';
import './AdminChatPage.css';

const API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'http://localhost:8000').replace(/\/$/, '');

/**
 * AdminChatPage - Admin Chat interface
 * Allows admins to manage and chat with users from active sessions
 */
const AdminChatPage = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch active sessions on component mount
  useEffect(() => {
    fetchActiveSessions();
    // Poll for new sessions every 10 seconds
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sessions`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'ok' && data.sessions) {
        setSessions(data.sessions);
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

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000); // seconds

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleCloseChat = () => {
    setActiveSession(null);
    fetchActiveSessions(); // Refresh sessions after closing
  };

  const handleOpenSession = (sessionId) => {
    setActiveSession(sessionId);
  };

  return (
    <Container fluid className="admin-chat-page py-4">
      <Row className="h-100">
        {/* Sidebar - Session List */}
        <Col md={3} className="mb-4 mb-md-0">
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Active Sessions</h6>
              <Badge bg="light" text="dark">{sessions.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {loading ? (
                <div className="p-3 text-center">
                  <Spinner animation="border" size="sm" variant="primary" />
                  <p className="small text-muted mt-2 mb-0">Loading sessions...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3 mb-0">
                  <small>{error}</small>
                </Alert>
              ) : sessions.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-2 opacity-25"></i>
                  <small>No active sessions</small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {sessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => handleOpenSession(session.session_id)}
                      className={`list-group-item list-group-item-action text-start border-0 border-bottom ${
                        activeSession === session.session_id ? 'bg-light active' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong className="small">
                          {session.user_id ? `User ${session.user_id.slice(0, 8)}...` : 'Anonymous'}
                        </strong>
                        {session.human_mode ? (
                          <Badge bg="success" pill>Human</Badge>
                        ) : (
                          <Badge bg="secondary" pill>Bot</Badge>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          <i className="bi bi-chat-fill me-1"></i>
                          {session.message_count || 0} messages
                        </small>
                        <small className="text-muted">
                          {formatTimestamp(session.last_activity || session.created_at)}
                        </small>
                      </div>
                      {session.last_message && (
                        <small className="text-truncate d-block text-muted" style={{ fontSize: '0.75rem' }}>
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

        {/* Main Chat Area */}
        <Col md={9}>
          {activeSession ? (
            <AdminChat 
              sessionId={activeSession} 
              onClose={handleCloseChat}
            />
          ) : (
            <Card className="border-0 shadow-sm h-100 d-flex align-items-center justify-content-center" style={{ minHeight: '600px' }}>
              <Card.Body className="text-center">
                <i className="bi bi-chat-square-text display-1 text-muted mb-3 opacity-25"></i>
                <h5 className="text-muted mb-3">Select a Session to Start Chatting</h5>
                <p className="text-muted small mb-0">
                  {loading 
                    ? 'Loading sessions...' 
                    : sessions.length === 0 
                    ? 'No active chat sessions at the moment. Sessions will appear here when users request human support.' 
                    : 'Choose a session from the list on the left to begin chatting with the user'}
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
