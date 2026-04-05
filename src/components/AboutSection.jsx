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
                My name is <strong>Muyiwa J. Obadara</strong>. I am a research-oriented Data Scientist and AI Engineer with expertise in crafting intelligent algorithms that convert difficult challenges into robust, production-ready solutions. My professional career began with a solid foundation in physics at the University of Ibadan, Nigeria.
              </p>

              <p className="about-description">
                Apart from crafting concise code, I am passionate about tech leadership and community building. Leveraging my background in teaching Mathematics and Physics, I mentor the future leaders of technology. I currently hold positions as a Fellow in AI/ML at the Tech4Dev Developers Foundry and a Data Science Mentor and Research Assistant at MedicsInTech.
              </p>

              <p className="about-description">
                To my mind, amazing software comes from clear thinking. In my downtime from creating machine learning models or APIs, I’m constantly researching novel AI techniques, improving processes using LLMs, or simply relaxing by playing the piano.
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
                  href="https://linkedin.com/in/obadara-m" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link linkedin-link"
                  title="LinkedIn"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a 
                  href="https://twitter.com/m_obadara" 
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
