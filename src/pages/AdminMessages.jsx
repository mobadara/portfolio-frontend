import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Spinner, Alert, ListGroup, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES, buildAdminUrl, withAuthHeaders } from '../utils/adminApi';
import './AdminMessages.css';

/**
 * AdminMessages - Message history and management
 * Displays past conversations and allows message searching and filtering
 */
function AdminMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  // No local detail view, navigation only

  useEffect(() => {
    if (location.state?.flash) {
      setToastMessage(location.state.flash);
      setShowToast(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildAdminUrl(ADMIN_ROUTES.messages), {
          headers: withAuthHeaders(token)
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(payload?.detail || payload?.message || 'Failed to load messages');
        }

        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.messages) ? payload.messages : [];
        setMessages(list);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        setLoading(false);
      }
    };

    fetchMessages();
  }, [navigate]);

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      String(msg.name || msg.visitorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(msg.email || msg.visitorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || msg.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'responded': 'success',
      'archived': 'secondary'
    };
    return variants[status] || 'light';
  };

  const formatTime = (date) => {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (!parsed || Number.isNaN(parsed.getTime?.())) return 'N/A';
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="admin-messages py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-messages py-4">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg="success" show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Messages</h1>
          <p className="text-muted">View and manage message history</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending Response</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </Form.Select>
        </Col>
      </Row>

      <Row>
        <Col lg={{ span: 8, offset: 2 }}>
          {/* Messages List */}
          <Card className="messages-list">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  Messages ({filteredMessages.length})
                </Card.Title>
              </div>
            </Card.Header>
            <ListGroup variant="flush">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <ListGroup.Item
                    key={msg.id}
                    className="message-item"
                    action
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/messages/${msg.id}`, { state: { message: msg } })}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-0">{msg.name || msg.visitorName || 'Unknown Sender'}</h6>
                        <small className="text-muted">{msg.email || msg.visitorEmail || 'No email'}</small>
                      </div>
                      <Badge bg={getStatusBadge(msg.status)}>
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="mb-1 small">{msg.subject}</p>
                    <p className="mb-0 text-muted text-truncate small">{msg.preview || msg.message || ''}</p>
                    <small className="text-muted mt-2 d-block">
                      {formatTime(msg.created_at || msg.timestamp)}
                    </small>
                  </ListGroup.Item>
                ))
              ) : (
                <div className="p-4 text-center text-muted">
                  <p>No messages found</p>
                </div>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminMessages;
