import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useEffect, useMemo, useState } from 'react';
import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, withAuthHeaders } from '../utils/adminApi';
import './AdminMessageDetail.css';

function AdminMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Try to get message from location state (if navigated from list)
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      setLoading(false);
      return;
    }

    const token = getStoredAdminToken();
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchMessage = async () => {
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
          throw new Error(payload?.detail || payload?.message || 'Failed to load messages.');
        }

        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.messages) ? payload.messages : [];
        const found = list.find((item) => String(item.id || item._id) === String(id));

        if (!found) {
          setError('Message not found.');
          setMessage(null);
        } else {
          setMessage(found);
          setError(null);
        }
      } catch (err) {
        setError(err.message || 'Unable to fetch message details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [id, location.state, navigate]);

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
    const recipient = message.email || message.visitorEmail;
    if (!recipient) return;
    const mailto = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=Re: ${encodeURIComponent(message.subject || 'Your message from my portfolio')}`;
    window.open(mailto, '_blank', 'noopener');
  };

  const handleDelete = async () => {
    if (!message) return;

    const messageId = String(message.id || message._id || id || '');
    if (!messageId) return;

    const confirmed = window.confirm('Delete this message? This cannot be undone.');
    if (!confirmed) return;

    const token = getStoredAdminToken();
    if (!token) {
      navigate('/admin');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(buildAdminUrl(`${ADMIN_ROUTES.messages}/${messageId}`), {
        method: 'DELETE',
        headers: withAuthHeaders(token)
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.detail || payload?.message || 'Failed to delete message.');
      }

      navigate('/admin/messages', { replace: true, state: { flash: payload?.message || 'Message deleted.' } });
    } catch (err) {
      setError(err.message || 'Failed to delete message.');
    } finally {
      setIsDeleting(false);
    }
  };

  const avatarLabel = useMemo(() => {
    const senderName = message?.visitorName || message?.name || 'Unknown';
    const parts = String(senderName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }, [message]);

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;

  return (
    <div className="admin-message-detail-page">
      <div className="container-fluid" style={{ maxWidth: 1180 }}>
        <Card className="admin-message-detail-shell border-0">
          <Card.Body className="p-3 p-md-4 p-lg-5">
            <div className="admin-message-detail-topbar">
              <div>
                <div className="admin-message-detail-chip-row mb-2">
                  <Badge bg={getStatusBadge(message.status)} className="text-capitalize">{message.status || 'unknown'}</Badge>
                  <Badge bg="light" text="dark" className="border">Message #{message.id || message._id || id}</Badge>
                </div>
                <h1 className="admin-message-detail-subject">{message.subject || 'No subject'}</h1>
              </div>

              <div className="admin-message-detail-toolbar">
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                  Back
                </Button>
                <Button variant="outline-primary" onClick={handleReply} disabled={!message?.email && !message?.visitorEmail}>
                  Reply
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>

            <div className="admin-message-detail-meta">
              <div className="admin-message-detail-avatar" aria-hidden="true">{avatarLabel}</div>
              <div>
                <div className="admin-message-detail-sender mb-1">
                  <strong>{message.visitorName || message.name || 'Unknown Sender'}</strong>
                  <span className="text-muted small">{message.created_at ? formatTime(message.created_at) : 'Received unknown time'}</span>
                </div>
                <div className="admin-message-detail-sender small">
                  <span className="text-muted">From</span>
                  <a href={`mailto:${message.visitorEmail || message.email || ''}`}>{message.visitorEmail || message.email || 'No email provided'}</a>
                </div>
              </div>
            </div>

            <div className="admin-message-detail-body mt-3">
              {message.message || (Array.isArray(message.messages) && message.messages.length > 0 && message.messages[0].text) || 'No message content.'}
            </div>

            {Array.isArray(message.messages) && message.messages.length > 1 && (
              <div className="admin-message-detail-panel mt-4">
                <div className="admin-message-detail-panel-header">
                  <strong>Conversation Thread</strong>
                </div>
                <div className="admin-message-detail-panel-body">
                  <div className="d-flex flex-column gap-3">
                    {message.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-4"
                        style={{
                          background: msg.type === 'admin' ? 'rgba(13,110,253,0.08)' : 'rgba(15,23,42,0.04)',
                          border: '1px solid rgba(15,23,42,0.08)'
                        }}
                      >
                        <div className="d-flex justify-content-between gap-2 mb-2">
                          <strong className="text-capitalize">{msg.type || 'message'}</strong>
                          <small className="text-muted">{formatTime(msg.time)}</small>
                        </div>
                        <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="admin-message-detail-toolbar mt-4">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button variant="outline-primary" onClick={handleReply} disabled={!message?.email && !message?.visitorEmail}>
                Reply
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default AdminMessageDetail;
