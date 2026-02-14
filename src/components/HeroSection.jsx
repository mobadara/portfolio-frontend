import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ParticlesBackground from './ParticlesBackground';
import './HeroSection.css';

const TITLES = ['Data Scientist', 'AI Engineer', 'Full-Stack Developer'];

const HeroSection = () => {
  const [titleIndex, setTitleIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % TITLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero-section position-relative overflow-hidden">
      {/* Animated Background */}
      <div className="hero-background">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <ParticlesBackground />
        </div>
        
        {/* Gradient Orbs */}
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Content */}
      <Container fluid className="hero-content position-relative d-flex align-items-center" style={{ zIndex: 2, height: '100%', minHeight: 'calc(100vh - 80px)' }}>
        <div className="w-100">
          <Row className="justify-content-center text-center">
            <Col md={11} lg={9}>
              {/* Greeting */}
              <div className={`hero-greeting ${showContent ? 'visible' : ''}`}>
              <h5 className="text-warning fw-bold mb-3">
                <span className="greeting-icon">👋</span> HELLO, WORLD.
              </h5>
            </div>

            {/* Main Name */}
            <div className={`hero-name-container ${showContent ? 'visible' : ''}`}>
              <h1 className="hero-title">I'm Muyiwa J. Obadara</h1>
              <div className="title-underline"></div>
            </div>

            {/* Rotating Titles */}
            <div className={`hero-subtitle-container ${showContent ? 'visible' : ''}`}>
              <h2 className="hero-subtitle">
                <span className="subtitle-prefix">Building intelligent systems as a </span>
                <span className="rotating-text" key={titleIndex}>
                  <span className="title-text">{TITLES[titleIndex]}</span>
                </span>
              </h2>
            </div>

            {/* Description */}
            <div className={`hero-description ${showContent ? 'visible' : ''}`}>
              <p className="hero-text">
                Turning complex data into intelligent action. Grounded in <strong>Mathematics</strong> and <strong>Linear Algebra</strong>,
                I specialize in Data Science, Machine Learning, and AI Engineering—building robust models and scalable backends with Python, FastAPI, and cloud deployment.
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className={`hero-buttons-container ${showContent ? 'visible' : ''}`}>
              <Button 
                className="btn-hero btn-primary-hero" 
                size="lg" 
                href="#portfolio"
              >
                <span className="btn-content">
                  <i className="bi bi-arrow-right me-2"></i>
                  View My Work
                </span>
              </Button>
              <Button 
                className="btn-hero btn-secondary-hero" 
                size="lg" 
                href="#contact"
              >
                <span className="btn-content">
                  <i className="bi bi-chat-dots me-2"></i>
                  Let's Connect
                </span>
              </Button>
            </div>

            {/* Scroll Indicator */}
            <div className="scroll-indicator">
              <div className="scroll-dot"></div>
              <div className="scroll-text">Scroll to explore</div>
            </div>
          </Col>
        </Row>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
