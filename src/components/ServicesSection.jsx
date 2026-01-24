import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const ServicesSection = () => (
  <section id="services" className="section-padding bg-navy text-white position-relative">
    <Container className="pt-3 pb-3">
      <div className="text-center mb-3">
        <h2 className="fw-bold display-6">My Services</h2>
      </div>

      <Row className="g-4">
        <Col md={4}>
          <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
            <i className="bi bi-cpu-fill fs-1 text-warning mb-3 d-block"></i>
            <h4 className="fw-bold">AI Engineering</h4>
            <p className="text-light opacity-75">
              I don't just build models; I deploy them. Using <strong>FastAPI</strong>, Docker, and Cloud platforms (Azure), I turn
              experimental code into scalable, production-ready APIs.
            </p>
          </div>
        </Col>

        <Col md={4}>
          <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
            <i className="bi bi-graph-up-arrow fs-1 text-warning mb-3 d-block"></i>
            <h4 className="fw-bold">Data Science & Analytics</h4>
            <p className="text-light opacity-75">
              Extracting actionable signals from noise. I use classical Machine Learning and statistical analysis to build predictive models for Finance and Healthcare.
            </p>
          </div>
        </Col>

        <Col md={4}>
          <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
            <i className="bi bi-chat-square-text-fill fs-1 text-warning mb-3 d-block"></i>
            <h4 className="fw-bold">NLP & Computer Vision</h4>
            <p className="text-light opacity-75">
              Leveraging <strong>Hugging Face</strong> transformers and CNNs to process unstructured data—whether it's analyzing financial sentiment or detecting patterns in images.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  </section>
);

export default ServicesSection;
