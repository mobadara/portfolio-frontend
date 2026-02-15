import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { BiShieldLock, BiUser, BiLockAlt, BiShow, BiHide } from 'react-icons/bi';
import './AdminLogin.css';

const ADMIN_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${ADMIN_API_BASE}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth token
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        // Navigate to dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Background Effects */}
      <div className="admin-login-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-grid"></div>
      </div>

      <Container className="admin-login-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={10} md={8} lg={5} xl={4}>
            <Card className="admin-login-card shadow-lg border-0">
              {/* Header */}
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="admin-icon-wrapper mb-3">
                    <BiShieldLock className="admin-shield-icon" />
                  </div>
                  <h2 className="admin-title fw-bold mb-2">Admin Portal</h2>
                  <p className="admin-subtitle text-muted">
                    Secure access to your portfolio management
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      <span>{error}</span>
                    </div>
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Username Field */}
                  <Form.Group className="mb-3" controlId="username">
                    <Form.Label className="fw-semibold">
                      <BiUser className="me-2" />
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="admin-input"
                    />
                  </Form.Group>

                  {/* Password Field */}
                  <Form.Group className="mb-4" controlId="password">
                    <Form.Label className="fw-semibold">
                      <BiLockAlt className="me-2" />
                      Password
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="admin-input pe-5"
                      />
                      <Button
                        variant="link"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? <BiHide size={20} /> : <BiShow size={20} />}
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 admin-submit-btn py-2 fw-semibold"
                    disabled={isLoading || !formData.username || !formData.password}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <BiShieldLock className="me-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                {/* Footer */}
                <div className="text-center mt-4">
                  <p className="small text-muted mb-0">
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    Protected by secure authentication
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Back to Home Link */}
            <div className="text-center mt-3">
              <Button
                variant="link"
                className="text-decoration-none back-home-link"
                onClick={() => navigate('/')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Portfolio
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
