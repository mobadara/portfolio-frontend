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

  return (
    <Card className="message-detail mt-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">{message.subject}</h5>
            <small className="text-muted">
              From: {message.visitorName} ({message.visitorEmail})
            </small>
          </div>
          <Badge bg={getStatusBadge(message.status)}>
            {message.status}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="messages-thread">
          {(Array.isArray(message.messages) ? message.messages : []).map((msg, idx) => (
            <div
              key={idx}
              className={`message-bubble ${msg.type === 'admin' ? 'admin' : 'visitor'}`}
            >
              <div className="message-content">
                <p>{msg.text}</p>
                <small className="text-muted d-block mt-2">
                  {formatTime(msg.time)}
                </small>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
      <Card.Footer className="bg-light d-flex gap-2 justify-content-end">
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="primary" size="sm" onClick={handleReply}>
          Reply
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Card.Footer>
    </Card>
  );
}

export default AdminMessageDetail;
