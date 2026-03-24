import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import './AdminMessages.css';

/**
 * AdminMessages - Message history and management
 * Displays past conversations and allows message searching and filtering
 */
function AdminMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // No local detail view, navigation only

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Fetch messages from backend
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual backend API call
        // const response = await fetch('/admin/messages', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });

        // Mock data for development
        setMessages([
          {
            id: 1,
            sessionId: '1234567890123456',
            visitorName: 'John Doe',
            visitorEmail: 'john@example.com',
            subject: 'Project Inquiry',
            status: 'responded',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            preview: 'Hi Muyiwa, I am interested in your services for a machine learning project...',
            messages: [
              { type: 'visitor', text: 'Hi Muyiwa, I am interested in your services for a machine learning project', time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
              { type: 'admin', text: 'Hello! Thanks for your interest. Let me discuss the details with you.', time: new Date(Date.now() - 1.5 * 60 * 60 * 1000) }
            ]
          },
          {
            id: 2,
            sessionId: '1234567890123457',
            visitorName: 'Jane Smith',
            visitorEmail: 'jane@example.com',
            subject: 'Freelance Opportunity',
            status: 'pending',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            preview: 'Do you take on freelance projects? I have an interesting AI project...',
            messages: [
              { type: 'visitor', text: 'Do you take on freelance projects? I have an interesting AI project...', time: new Date(Date.now() - 30 * 60 * 1000) }
            ]
          },
          {
            id: 3,
            sessionId: '1234567890123458',
            visitorName: 'Mike Johnson',
            visitorEmail: 'mike@example.com',
            subject: 'Collaboration Interest',
            status: 'responded',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            preview: 'I saw your portfolio and would like to collaborate on a data science project...',
            messages: [
              { type: 'visitor', text: 'I saw your portfolio and would like to collaborate on a data science project', time: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              { type: 'admin', text: 'That sounds great! I am always open to collaboration. Tell me more about your project.', time: new Date(Date.now() - 23.5 * 60 * 60 * 1000) }
            ]
          },
          {
            id: 4,
            sessionId: '1234567890123459',
            visitorName: 'Sarah Williams',
            visitorEmail: 'sarah@example.com',
            subject: 'Technical Question',
            status: 'archived',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
            preview: 'What technologies did you use for your portfolio website?',
            messages: [
              { type: 'visitor', text: 'What technologies did you use for your portfolio website?', time: new Date(Date.now() - 48 * 60 * 60 * 1000) },
              { type: 'admin', text: 'I built it with React, FastAPI, and other modern technologies. Happy to discuss in detail!', time: new Date(Date.now() - 47.8 * 60 * 60 * 1000) }
            ]
          }
        ]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load messages');
        setLoading(false);
      }
    };

    fetchMessages();
  }, [navigate]);

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.visitorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    return date.toLocaleString('en-US', {
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
                  <Link
                    key={msg.id}
                    to={`/admin/messages/${msg.id}`}
                    state={{ message: msg }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <ListGroup.Item className="message-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-0">{msg.visitorName}</h6>
                          <small className="text-muted">{msg.visitorEmail}</small>
                        </div>
                        <Badge bg={getStatusBadge(msg.status)}>
                          {msg.status}
                        </Badge>
                      </div>
                      <p className="mb-1 small">{msg.subject}</p>
                      <p className="mb-0 text-muted text-truncate small">{msg.preview}</p>
                      <small className="text-muted mt-2 d-block">
                        {formatTime(msg.timestamp)}
                      </small>
                    </ListGroup.Item>
                  </Link>
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
