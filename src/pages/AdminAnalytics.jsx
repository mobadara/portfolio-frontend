import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AdminAnalytics.css';

/**
 * AdminAnalytics - Portfolio analytics and performance dashboard
 * Displays visitor statistics, engagement metrics, and portfolio performance
 */
function AdminAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Fetch analytics data (placeholder for now)
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual backend API call
        // const response = await fetch('/admin/analytics', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        
        // Mock data for development
        setAnalytics({
          totalVisitors: 1247,
          uniqueVisitors: 856,
          pageViews: 3421,
          avgSessionDuration: '3m 42s',
          bounceRate: '42.3%',
          topSections: [
            { name: 'Portfolio', views: 892 },
            { name: 'About', views: 654 },
            { name: 'Skills', views: 543 },
            { name: 'Contact', views: 432 }
          ],
          chatMetrics: {
            totalSessions: 89,
            humanHandoffs: 23,
            avgResponseTime: '2m 15s',
            satisfactionRate: '87%'
          },
          deviceStats: {
            desktop: '68%',
            mobile: '28%',
            tablet: '4%'
          }
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  if (loading) {
    return (
      <Container className="admin-analytics py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-analytics py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Portfolio Analytics</h1>
          <p className="text-muted">Performance metrics and visitor insights</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-label">Total Visitors</div>
              <div className="metric-value">{analytics?.totalVisitors}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-label">Unique Visitors</div>
              <div className="metric-value">{analytics?.uniqueVisitors}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-label">Page Views</div>
              <div className="metric-value">{analytics?.pageViews}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="metric-card">
            <Card.Body>
              <div className="metric-label">Bounce Rate</div>
              <div className="metric-value">{analytics?.bounceRate}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Sections */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="analytics-card">
            <Card.Header>
              <Card.Title className="mb-0">Top Sections</Card.Title>
            </Card.Header>
            <Card.Body>
              {analytics?.topSections.map((section, idx) => (
                <div key={idx} className="section-stat mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{section.name}</span>
                    <strong>{section.views}</strong>
                  </div>
                  <div className="progress mt-2">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${(section.views / 892) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Device Stats */}
        <Col lg={6}>
          <Card className="analytics-card">
            <Card.Header>
              <Card.Title className="mb-0">Device Breakdown</Card.Title>
            </Card.Header>
            <Card.Body>
              {Object.entries(analytics?.deviceStats || {}).map(([device, percentage], idx) => (
                <div key={idx} className="device-stat mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{device.charAt(0).toUpperCase() + device.slice(1)}</span>
                    <strong>{percentage}</strong>
                  </div>
                  <div className="progress mt-2">
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: percentage }}
                    />
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Chat Metrics */}
      <Row>
        <Col>
          <Card className="analytics-card">
            <Card.Header>
              <Card.Title className="mb-0">Chat & Support Metrics</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} lg={3} className="mb-3">
                  <div className="chat-metric">
                    <div className="chat-metric-label">Chat Sessions</div>
                    <div className="chat-metric-value">{analytics?.chatMetrics.totalSessions}</div>
                  </div>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <div className="chat-metric">
                    <div className="chat-metric-label">Human Handoffs</div>
                    <div className="chat-metric-value">{analytics?.chatMetrics.humanHandoffs}</div>
                  </div>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <div className="chat-metric">
                    <div className="chat-metric-label">Avg Response Time</div>
                    <div className="chat-metric-value">{analytics?.chatMetrics.avgResponseTime}</div>
                  </div>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <div className="chat-metric">
                    <div className="chat-metric-label">Satisfaction</div>
                    <div className="chat-metric-value">{analytics?.chatMetrics.satisfactionRate}</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
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

export default AdminAnalytics;
