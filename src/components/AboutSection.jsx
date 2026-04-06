import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import GithubActivity from './GithubActivity';
import './AboutSection.css';
import portrait from '../assets/portrait.png';


const AboutSection = ({ theme }) => {
  const [showGithubModal, setShowGithubModal] = useState(false);

  return (
    <section id="about" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
      <Container>
        <div className="section-shell">
        <Row className="align-items-center g-5">
          {/* Profile Image */}
          <Col lg={5} className="d-flex justify-content-center">
            <div className="profile-card animate-slide-in-left">
              <div className="profile-image-wrapper">
                <img
                  src={portrait}
                  alt="Muyiwa J. Obadara Portrait"
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
                I'm <strong>Muyiwa J. Obadara</strong>, a curious researcher, Data Scientist, and AI Engineer building intelligent systems that transform complex problems into scalable, production-grade solutions. With a foundational background in Physics from the University of Ibadan, I specialize in designing end-to-end AI pipelines, cloud architecture, and automation that drive meaningful, real-world impact.
              </p>

              <p className="about-description">
                Beyond writing clean, efficient code, I am deeply committed to tech leadership and community growth. Drawing from my roots as a Mathematics and Physics educator, I actively guide the next generation of tech professionals. I currently serve as an AI/ML Fellow at the Tech4Dev Developers Foundry and a Volunteer Data Science Mentor and Research Assistant at MedicsInTech.
              </p>

              <p className="about-description">
                I believe that great software is born from clarity of thought. When I'm not building machine learning models or deploying APIs, you'll find me exploring cutting-edge AI technologies, optimizing workflows with LLMs, or unwinding by playing the piano.
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
        </div>
      </Container>

      {/* GitHub Activity Modal */}
      <Modal
        show={showGithubModal} 
        onHide={() => setShowGithubModal(false)}
        size="lg"
        className="github-modal"
        centered
        data-bs-theme={theme === 'dark' ? 'dark' : 'light'}
      >
        <Modal.Header className="border-0 pb-0" style={{ backgroundColor: 'var(--body-bg)', color: 'var(--text-color)' }}>
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
        <Modal.Body className="pt-0" style={{ backgroundColor: 'var(--body-bg)', color: 'var(--text-color)' }}>
          <GithubActivity theme={theme} isModal={true} />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default AboutSection;
