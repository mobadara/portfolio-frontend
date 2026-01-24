import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

const ContactSection = () => (
  <section id="contact" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6 text-navy">Let's Solve a Problem</h2>
            <p className="text-muted mt-3">
              Whether you have a question about a project, a collaboration idea, or just want to discuss the latest in AI, I'd love to hear from you.
            </p>
          </div>

          <Card className="border-0 shadow-lg card-custom p-4">
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="contact-name">
                      <Form.Label className="fw-bold small text-muted">YOUR NAME</Form.Label>
                      <Form.Control type="text" placeholder="John Doe" className="bg-light border-0 py-2" />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group controlId="contact-email">
                      <Form.Label className="fw-bold small text-muted">YOUR EMAIL</Form.Label>
                      <Form.Control type="email" placeholder="name@example.com" className="bg-light border-0 py-2" />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4" controlId="contact-message">
                  <Form.Label className="fw-bold small text-muted">MESSAGE</Form.Label>
                  <Form.Control as="textarea" rows={5} placeholder="How can I help you?" className="bg-light border-0 py-2" />
                </Form.Group>

                <div className="text-center">
                  <Button variant="primary" size="lg" className="bg-navy border-navy px-5 fw-bold w-100">
                    Send Message <i className="bi bi-send-fill ms-2"></i>
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </section>
);

export default ContactSection;
