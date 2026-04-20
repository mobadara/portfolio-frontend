import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { BiShield, BiUser, BiLockAlt, BiShow, BiHide } from 'react-icons/bi';
import {
  ADMIN_ROUTES,
  buildAdminUrl,
  clearAdminAuth,
  getStoredAdminToken,
  saveAdminAuth,
} from '../utils/adminApi';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = getStoredAdminToken();

    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

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
      const possibleRoutes = [
        ADMIN_ROUTES.login,
        '/admin/auth/login'
      ];

      let loginError = 'Invalid credentials. Please try again.';
      let loginSuccessful = false;

      for (const route of possibleRoutes) {
        const response = await fetch(buildAdminUrl(route), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.ok) {
          saveAdminAuth({
            token: data?.token || data?.access_token,
            user: data?.user || data?.admin || { username: formData.username, role: 'admin' }
          });
          loginSuccessful = true;
          break;
        }

        if (response.status !== 404) {
          loginError = data?.detail || data?.message || loginError;
          break;
        }
      }

      if (loginSuccessful) {
        navigate('/admin/dashboard');
      } else {
        setError(loginError);
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
      <div className="admin-login-my-strip" />
      <div className="admin-login-bg-pattern" />

      <Container className="admin-login-container">
        <div className="admin-login-theme-toggle-wrap">
          <Form.Check
            type="switch"
            id="admin-login-theme-switch"
            className="admin-theme-switch"
            checked={theme === 'dark'}
            onChange={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
          />
        </div>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={10} md={8} lg={5} xl={4}>
            <Card className="admin-login-card shadow-lg border-0">
              <Card.Body className="p-4 p-md-5">
                {isCheckingSession ? (
                  <div className="py-5 d-flex justify-content-center">
                    <Spinner animation="border" role="status" />
                  </div>
                ) : (
                <>
                <div className="text-center mb-4">
                  <div className="admin-icon-wrapper mb-3">
                    <BiShield className="admin-shield-icon" />
                  </div>
                  <h2 className="admin-title fw-bold mb-2">My Admin</h2>
                  <p className="admin-subtitle mb-0">
                    Sign in to manage chats, users, and projects
                  </p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      <span>{error}</span>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
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
                        <BiShield className="me-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="small admin-login-security-note mb-0">
                    <i className="bi bi-shield-lock-fill me-1" />
                    Secure backend authentication is enabled
                  </p>
                </div>
                </>
                )}
              </Card.Body>
            </Card>

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
