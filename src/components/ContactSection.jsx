import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { ADMIN_ROUTES, buildAdminUrl } from '../utils/adminApi';

const initialFormState = {
  name: '',
  email: '',
  subject: '',
  message: ''
};

const ContactSection = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(buildAdminUrl(ADMIN_ROUTES.contactCreate), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          status: 'new'
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to submit your message. Please try again.');
      }

      setFormData(initialFormState);
      setShowSuccessToast(true);
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
      <Container>
        <div className="section-shell position-relative">
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
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group controlId="contact-name">
                        <Form.Label className="fw-bold small text-muted">YOUR NAME</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="contact-form-control border-0 py-2"
                          required
                          disabled={isSubmitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group controlId="contact-email">
                        <Form.Label className="fw-bold small text-muted">YOUR EMAIL</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          className="contact-form-control border-0 py-2"
                          required
                          disabled={isSubmitting}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3" controlId="contact-subject">
                    <Form.Label className="fw-bold small text-muted">SUBJECT</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Subject"
                      className="contact-form-control border-0 py-2"
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="contact-message">
                    <Form.Label className="fw-bold small text-muted">MESSAGE</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can I help you?"
                      className="contact-form-control border-0 py-2"
                      required
                      disabled={isSubmitting}
                    />
                  </Form.Group>

                  {error && <Alert variant="danger">{error}</Alert>}

                  <div className="text-center">
                    <Button type="submit" variant="primary" size="lg" className="bg-navy border-navy px-5 fw-bold w-100" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message <i className="bi bi-send-fill ms-2"></i>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <ToastContainer position="bottom-end" className="p-3">
          <Toast bg="success" onClose={() => setShowSuccessToast(false)} show={showSuccessToast} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Message sent</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              Your message was submitted successfully. Expect a reply in your provided email shortly.
            </Toast.Body>
          </Toast>
        </ToastContainer>
        </div>
      </Container>
    </section>
  );
};

export default ContactSection;
