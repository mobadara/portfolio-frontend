import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ParticlesBackground from './ParticlesBackground';

const TITLES = ['Data Scientist', 'AI Engineer', 'Fullstack Software Developer'];

const HeroSection = () => {
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % TITLES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero-section position-relative">
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <ParticlesBackground />
      </div>

      <Container style={{ position: 'relative', zIndex: 2 }}>
        <Row className="justify-content-center text-center">
          <Col md={11} lg={9}>
            <h5 className="text-warning fw-bold mb-3 animate-fade-up">HELLO, WORLD.</h5>
            <h1 className="display-3 fw-bold mb-4 animate-fade-up delay-100">I'm Muyiwa J. Obadara</h1>
            <h2 className="h2 mb-4 text-light opacity-75 animate-fade-up delay-200 hero-rotating-title">
              <span key={TITLES[titleIndex]} className="title-slide">
                {TITLES[titleIndex]}
              </span>
            </h2>
            <p className="lead mb-5 mx-auto animate-fade-up delay-300" style={{ maxWidth: '800px' }}>
              Turning complex data into intelligent action. Grounded in <strong>Mathematics</strong> and <strong>Linear Algebra</strong>,
              I specialize in Data Science, Machine Learning, and AI Engineering—building robust models and scalable backends for any domain.
            </p>
            <div className="animate-fade-up delay-300 hero-buttons">
              <Button variant="light" size="lg" className="fw-bold text-navy px-4 py-2" href="#portfolio">
                View My Work
              </Button>
              <Button variant="outline-light" size="lg" className="px-4 py-2" href="#contact">
                Let's Connect
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;
