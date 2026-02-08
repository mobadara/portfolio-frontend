import { useState } from 'react';
import { Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import AdminChat from './AdminChat';
import './AdminChatPage.css';

/**
 * AdminChatPage - Demo page for the Admin Chat interface
 * Allows admins to manage and chat with users from active sessions
 */
const AdminChatPage = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions] = useState([
    {
      id: 'session_1770560465255_fd0jqhg7r',
      userId: 'user_123',
      userName: 'John Doe',
      status: 'active',
      lastMessage: 'I want to chat with him directly',
      messageCount: 4,
      humanMode: true,
      startTime: '2026-02-08T15:21:45'
    }
  ]);

  const handleCloseChat = () => {
    setActiveSession(null);
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
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Active Sessions</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {sessions.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <small>No active sessions</small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleOpenSession(session.id)}
                      className={`list-group-item list-group-item-action text-start border-0 border-bottom ${
                        activeSession === session.id ? 'bg-light' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong className="small">{session.userName}</strong>
                        <Badge bg="success" pill>Active</Badge>
                      </div>
                      <small className="text-muted d-block mb-2">
                        {session.messageCount} messages
                      </small>
                      <small className="text-truncate d-block" style={{ fontSize: '0.75rem' }}>
                        {session.lastMessage}
                      </small>
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
                <h5 className="text-muted mb-3">Select a Session to Start Chatting</h5>
                <p className="text-muted small">
                  {sessions.length === 0 
                    ? 'No active chat sessions at the moment' 
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
