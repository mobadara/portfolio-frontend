import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AdminSettings.css';

/**
 * AdminSettings - Admin settings and preferences management
 * Allows configuration of system preferences and admin account settings
 */
function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    autoResponseEnabled: true,
    autoResponseMessage: 'Thanks for your message! I will get back to you soon.',
    notificationsEnabled: true,
    emailNotifications: true,
    chatNotifications: true,
    darkMode: true,
    businessEmail: 'contact@muyiwaobadara.com',
    phoneNumber: '+234 (555) 123-4567',
    timezone: 'UTC',
    sessionTimeout: 30
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Fetch settings from backend
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual backend API call
        // const response = await fetch('/admin/settings', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });

        // Mock data for development - settings already set in state
        setSettings(formData);
        setLoading(false);
      } catch (err) {
        setMessage({ type: 'danger', text: 'Failed to load settings' });
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Send to backend API
      // await fetch('/admin/settings', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(formData)
      // });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to save settings' });
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    // TODO: Implement password change modal
    setMessage({ type: 'info', text: 'Password change feature coming soon' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (loading) {
    return (
      <Container className="admin-settings py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-settings py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Settings</h1>
          <p className="text-muted">Manage admin preferences and system configuration</p>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      {/* Account Settings */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="settings-card">
            <Card.Header>
              <Card.Title className="mb-0">Account Settings</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Business Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Timezone</Form.Label>
                <Form.Select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="GMT">GMT (London)</option>
                  <option value="CET">CET (Europe)</option>
                  <option value="WAT">WAT (West Africa)</option>
                  <option value="IST">IST (India)</option>
                  <option value="SGT">SGT (Singapore)</option>
                </Form.Select>
              </Form.Group>

              <Button 
                variant="outline-primary" 
                onClick={handleChangePassword}
                className="w-100"
              >
                Change Password
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Session Settings */}
        <Col lg={6}>
          <Card className="settings-card">
            <Card.Header>
              <Card.Title className="mb-0">Session Settings</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Session Timeout (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min="5"
                  max="240"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                />
                <small className="text-muted">
                  Auto-logout after inactivity
                </small>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="darkMode"
                  label="Dark Mode"
                  checked={formData.darkMode}
                  onChange={(e) => handleInputChange('darkMode', e.target.checked)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Auto Response Settings */}
      <Row className="mb-4">
        <Col>
          <Card className="settings-card">
            <Card.Header>
              <Card.Title className="mb-0">Auto Response Settings</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="autoResponse"
                  label="Enable Auto Response"
                  checked={formData.autoResponseEnabled}
                  onChange={(e) => handleInputChange('autoResponseEnabled', e.target.checked)}
                />
              </Form.Group>

              {formData.autoResponseEnabled && (
                <Form.Group className="mb-3">
                  <Form.Label>Auto Response Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.autoResponseMessage}
                    onChange={(e) => handleInputChange('autoResponseMessage', e.target.value)}
                  />
                  <small className="text-muted">
                    This message will be sent automatically when you're unavailable
                  </small>
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Notification Settings */}
      <Row className="mb-4">
        <Col>
          <Card className="settings-card">
            <Card.Header>
              <Card.Title className="mb-0">Notification Preferences</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="notificationsEnabled"
                  label="Enable All Notifications"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                />
              </Form.Group>

              {formData.notificationsEnabled && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="emailNotifications"
                      label="Email Notifications"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Check
                      type="checkbox"
                      id="chatNotifications"
                      label="Chat Notifications"
                      checked={formData.chatNotifications}
                      onChange={(e) => handleInputChange('chatNotifications', e.target.checked)}
                    />
                  </Form.Group>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col className="d-flex gap-2 justify-content-end">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/dashboard')}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminSettings;
