import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { SiSubstack } from 'react-icons/si';

const NewsletterSection = () => (
  <section className="py-5 bg-light border-top border-bottom">
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6} className="text-center">
          <div className="mb-3">
            <SiSubstack className="display-4 mb-3" style={{ color: '#FF6719' }} />
          </div>

          <h3 className="fw-bold text-navy">Join "The Algorithmic Pulse"</h3>
          <p className="text-muted mb-4 fs-5">
            Get my latest articles on <strong>AI Engineering</strong>, <strong>Financial Modeling</strong>, and <strong>Tech Career Growth</strong> delivered straight to your inbox. No spam, just signal.
          </p>

          <Button
            variant="primary"
            size="lg"
            href="https://yourname.substack.com"
            target="_blank"
            className="px-5 py-3 fw-bold shadow-sm newsletter-btn"
            style={{ backgroundColor: '#FF6719', borderColor: '#FF6719' }}
            rel="noreferrer"
          >
            Subscribe for Free <i className="bi bi-arrow-right-short ms-2 fs-4 align-middle"></i>
          </Button>

          <p className="small text-muted mt-3">Read by data scientists and engineers from top companies.</p>
        </Col>
      </Row>
    </Container>
  </section>
);

export default NewsletterSection;
