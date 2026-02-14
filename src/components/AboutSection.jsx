import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import GithubActivity from './GithubActivity';
import './AboutSection.css';

const AboutSection = ({ theme }) => {
  const [showGithubModal, setShowGithubModal] = useState(false);

  return (
    <section id="about" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
      <Container>
        <Row className="align-items-center g-5">
          {/* Profile Image */}
          <Col lg={5} className="d-flex justify-content-center">
            <div className="profile-card animate-slide-in-left">
              <div className="profile-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop"
                  alt="Muyiwa J. Obadara sitting with Mac"
                  className="profile-image"
                />
                <div className="profile-image-overlay"></div>
              </div>
            </div>
          </Col>

          {/* About Content */}
          <Col lg={7} className="animate-slide-in-right">
            <div className="about-content">
              <span className="badge-label">ABOUT ME</span>
              
              <h1 className="about-title">
                Data Scientist & AI Engineer
              </h1>

              <p className="about-description">
                I'm <strong>Muyiwa J. Obadara</strong>, a passionate Data Scientist and AI Engineer building intelligent systems that transform 
                complex problems into scalable, production-grade solutions. With expertise in machine learning, cloud deployment, and 
                automation, I specialize in designing end-to-end AI pipelines that create meaningful impact.
              </p>

              <p className="about-description">
                I believe in clean, efficient code and believe that great software is born from clarity of thought. When I'm not building 
                models or deploying APIs, you'll find me exploring cutting-edge AI technologies or optimizing workflows with LLMs.
              </p>

              {/* Social Links */}
              <div className="social-links mb-4 d-flex gap-3 justify-content-center justify-content-lg-start">
                <a 
                  href="https://github.com/mobadara" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link github-link"
                  title="GitHub"
                >
                  <i className="bi bi-github"></i>
                </a>
                <a 
                  href="https://linkedin.com/in/muyiwa-obadara" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link linkedin-link"
                  title="LinkedIn"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a 
                  href="https://twitter.com/mobadara" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link twitter-link"
                  title="Twitter"
                >
                  <i className="bi bi-twitter"></i>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <a 
                  href="/resume.pdf" 
                  download
                  className="btn btn-primary btn-download"
                >
                  <i className="bi bi-download me-2"></i>
                  Download Resume
                </a>
                <button 
                  className="btn btn-outline-primary btn-github-activity"
                  onClick={() => setShowGithubModal(true)}
                >
                  <i className="bi bi-github me-2"></i>
                  View GitHub Activity
                </button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* GitHub Activity Modal */}
      <Modal 
        show={showGithubModal} 
        onHide={() => setShowGithubModal(false)}
        size="lg"
        className="github-modal"
        centered
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-github me-2"></i>GitHub Contributions
          </Modal.Title>
          <button 
            type="button" 
            className="btn-close"
            onClick={() => setShowGithubModal(false)}
            aria-label="Close"
          ></button>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <GithubActivity theme={theme} isModal={true} />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default AboutSection;
