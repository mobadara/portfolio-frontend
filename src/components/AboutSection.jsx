import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const AboutSection = () => (
  <section id="about" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
    <Container>
      <Row className="align-items-center">
        <Col md={5} className="mb-5 mb-md-0 text-center">
          <div className="profile-img-container">
            <img
              src="https://placehold.co/400x500/001f3f/FFF?text=MO"
              alt="Muyiwa J. Obadara"
              className="profile-img"
            />
            <div className="profile-img-bg"></div>
          </div>
        </Col>

        <Col md={7}>
          <h2 className="fw-bold mb-3 display-6" style={{ color: 'var(--navy-blue)' }}>
            The intersection of Math, Code & Harmony
          </h2>

          <p className="text-muted mb-4">
            I am a <strong>Data Scientist</strong> and <strong>AI Engineer</strong> who views the world through the lens of mathematics.
            My background in <strong>Physics</strong> has equipped me with a rigorous "First Principles" approach, allowing me to build
            systems that are not just functional, but foundational.
          </p>

          <Row className="g-4 mb-5 justify-content-center">
            {[{ num: '02+', lbl: 'Years Exp.', delay: '0s' }, { num: '10+', lbl: 'Projects', delay: '0.5s' }, { num: '05', lbl: 'Certifications', delay: '1s' }].map((item, index) => (
              <Col sm={4} key={index} className="d-flex justify-content-center">
                <div className="metric-circle-container">
                  <svg className="metric-svg" viewBox="0 0 120 120">
                    <circle className="metric-track" cx="60" cy="60" r="54" />
                    <circle className="metric-spinner" cx="60" cy="60" r="54" style={{ animationDelay: item.delay }} />
                  </svg>
                  <div className="metric-content text-center">
                    <h3 className="fw-bold mb-0 display-6">{item.num}</h3>
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                      {item.lbl}
                    </small>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <h6 className="fw-bold mb-3" style={{ color: 'var(--navy-blue)' }}>
            CORE COMPETENCIES
          </h6>

          <ul className="list-unstyled mb-4">
            <li className="d-flex align-items-start mb-2">
              <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
              <span><strong>Clean, Efficient Code:</strong> Writing highly documented, production-ready Python & SQL.</span>
            </li>
            <li className="d-flex align-items-start mb-2">
              <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
              <span><strong>Cloud & API Deployment:</strong> Shipping models to production using FastAPI, Docker, and Azure.</span>
            </li>
            <li className="d-flex align-items-start mb-2">
              <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
              <span><strong>Data Visualization:</strong> Translating complex statistics into clear insights with PowerBI & Matplotlib.</span>
            </li>
            <li className="d-flex align-items-start mb-2">
              <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
              <span><strong>Predictive Modelling:</strong> Building robust ML algorithms for real-world forecasting.</span>
            </li>
            <li className="d-flex align-items-start mb-2">
              <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
              <span><strong>AI Engineering:</strong> Automating workflows and integrating LLMs into business logic.</span>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <Button
              variant="primary"
              className="bg-navy border-navy px-4 fw-bold"
              href="/resume.pdf"
              target="_blank"
            >
              Download CV <i className="bi bi-download ms-2"></i>
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  </section>
);

export default AboutSection;
