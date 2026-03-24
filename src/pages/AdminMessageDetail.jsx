import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useEffect, useState } from 'react';

function AdminMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to get message from location state (if navigated from list)
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      setLoading(false);
      return;
    }
    // Otherwise, fetch from backend (mock for now)
    // TODO: Replace with real API call
    setTimeout(() => {
      setError('Message not found.');
      setLoading(false);
    }, 500);
  }, [id, location.state]);

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'responded': 'success',
      'archived': 'secondary'
    };
    return variants[status] || 'light';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReply = () => {
    if (!message) return;
    const mailto = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(message.visitorEmail)}&su=Re: ${encodeURIComponent(message.subject)}`;
    window.open(mailto, '_blank', 'noopener');
  };

  const handleDelete = () => {
    // TODO: Implement delete logic (API call)
    alert('Delete not implemented.');
  };

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;

  // Theme detection
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  return (
    <Card className="message-detail mt-4" style={{ maxWidth: 700, margin: '0 auto', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
      <Card.Header className={isDark ? 'bg-dark text-white' : 'bg-primary text-white'}>
        <h5 className="mb-0">Message Details</h5>
      </Card.Header>
      <Card.Body style={{ padding: '2rem' }}>
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Badge
              bg={getStatusBadge(message.status)}
              className={`me-2 text-capitalize ${isDark ? 'bg-opacity-75' : ''}`}
              style={isDark ? { backgroundColor: 'rgba(108,117,125,0.85)', color: '#fff' } : {}}
            >
              {message.status}
            </Badge>
            <span className="text-muted small">Received: {message.created_at ? formatTime(message.created_at) : 'N/A'}</span>
          </div>
          <h4 className="mb-2">{message.subject || <span className="text-muted">No subject</span>}</h4>
        </div>
        <div className="mb-3">
          <div className="mb-1"><strong>From:</strong> {message.visitorName || message.name || 'Unknown'}</div>
          <div className="mb-1"><strong>Email:</strong> {message.visitorEmail || message.email || 'N/A'}</div>
        </div>
        <div className="mb-4">
          <strong>Message Content:</strong>
          <div
            className={isDark ? 'p-3 bg-dark-subtle rounded mt-2' : 'p-3 bg-light rounded mt-2'}
            style={{ minHeight: 80, whiteSpace: 'pre-line', fontSize: '1.08rem', color: isDark ? '#e9ecef' : undefined }}
          >
            {message.message || (Array.isArray(message.messages) && message.messages.length > 0 && message.messages[0].text) || <span className="text-muted">No message content</span>}
          </div>
        </div>
        {Array.isArray(message.messages) && message.messages.length > 1 && (
          <div className="mb-2">
            <strong>Thread:</strong>
            <div className="messages-thread mt-2">
              {message.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-bubble ${msg.type === 'admin' ? 'admin' : 'visitor'}`}
                  style={isDark ? { marginBottom: 10, background: '#23272b', color: '#e9ecef' } : { marginBottom: 10 }}
                >
                  <div className="message-content">
                    <p className="mb-1">{msg.text}</p>
                    <small className="text-muted d-block mt-1">
                      {formatTime(msg.time)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
      <Card.Footer className={isDark ? 'bg-dark-subtle d-flex gap-2 justify-content-end' : 'bg-light d-flex gap-2 justify-content-end'}>
        <Button variant={isDark ? 'outline-danger' : 'danger'} size="sm" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant={isDark ? 'outline-primary' : 'primary'} size="sm" onClick={handleReply}>
          Reply
        </Button>
        <Button variant={isDark ? 'outline-secondary' : 'outline-secondary'} size="sm" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Card.Footer>
    </Card>
  );
}

export default AdminMessageDetail;
