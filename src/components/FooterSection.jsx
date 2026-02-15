import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import { SiMedium } from 'react-icons/si';
import Logo from './Logo';
import './FooterSection.css';

const FooterSection = () => (
  <footer className="bg-navy text-white py-5 border-top border-secondary">
    <Container>
      {/* Main Footer Content */}
      <Row className="mb-5 g-4">
        {/* Brand Section */}
        <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-lg-start">
          <div className="footer-brand mb-4">
            <Logo height="50" className="mb-3" />
            <h5 className="fw-bold mb-3">Muyiwa J. Obadara</h5>
            <p className="small text-light opacity-75 mb-0">
              Building intelligent systems at the intersection of data, code, and innovation.
            </p>
          </div>
        </Col>

        {/* Navigation Links */}
        <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-lg-start">
          <h6 className="text-warning fw-bold small text-uppercase mb-3">Navigation</h6>
          <ul className="list-unstyled footer-links">
            <li><a href="https://portfolio-frontend-livid.vercel.app/#home" className="text-light text-decoration-none small opacity-75 hover-link">Home</a></li>
            <li><a href="https://portfolio-frontend-livid.vercel.app/#about" className="text-light text-decoration-none small opacity-75 hover-link">About</a></li>
            <li><a href="https://portfolio-frontend-livid.vercel.app/#skills" className="text-light text-decoration-none small opacity-75 hover-link">Skills</a></li>
            <li><a href="https://portfolio-frontend-livid.vercel.app/#portfolio" className="text-light text-decoration-none small opacity-75 hover-link">Portfolio</a></li>
            <li><a href="https://portfolio-frontend-livid.vercel.app/#services" className="text-light text-decoration-none small opacity-75 hover-link">Services</a></li>
            <li><a href="https://portfolio-frontend-livid.vercel.app/#contact" className="text-light text-decoration-none small opacity-75 hover-link">Contact</a></li>
          </ul>
        </Col>

        {/* Resources */}
        <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-lg-start">
          <h6 className="text-warning fw-bold small text-uppercase mb-3">Resources</h6>
          <ul className="list-unstyled footer-links">
            <li><a href="/resume.pdf" className="text-light text-decoration-none small opacity-75 hover-link" download>Download Resume</a></li>
            <li><a href="https://github.com/mobadara" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small opacity-75 hover-link">GitHub Profile</a></li>
            <li><a href="https://mobadara.medium.com" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small opacity-75 hover-link">Medium Articles</a></li>
            <li><a href="https://linkedin.com/in/muyiwa-obadara" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small opacity-75 hover-link">LinkedIn</a></li>
            <li><a href="https://twitter.com/mobadara" target="_blank" rel="noopener noreferrer" className="text-light text-decoration-none small opacity-75 hover-link">Twitter / X</a></li>
          </ul>
        </Col>

        {/* Connect */}
        <Col lg={3} md={6} className="mb-4 mb-md-0 text-center text-lg-start">
          <h6 className="text-warning fw-bold small text-uppercase mb-3">Connect</h6>
          <p className="small opacity-75 mb-3">
            Let's collaborate on exciting projects.
          </p>
          <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
            <a 
              href="https://linkedin.com/in/muyiwa-obadara" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon linkedin" 
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </a>
            <a 
              href="https://twitter.com/mobadara" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon twitter" 
              title="Twitter"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
            <a 
              href="https://github.com/mobadara" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon github" 
              title="GitHub"
              aria-label="GitHub"
            >
              <FaGithub />
            </a>
            <a 
              href="https://mobadara.medium.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-icon medium" 
              title="Medium"
              aria-label="Medium"
            >
              <SiMedium />
            </a>
          </div>
        </Col>
      </Row>

      {/* Divider */}
      <hr className="bg-secondary opacity-25 my-4" />

      {/* Bottom Section */}
      <Row className="align-items-center">
        <Col md={6} className="text-center mb-3 mb-md-0">
          <p className="small opacity-50 mb-0">
            &copy; {new Date().getFullYear()} Muyiwa J. Obadara. All rights reserved.
          </p>
        </Col>
        <Col md={6} className="text-center">
          <p className="small opacity-50 mb-0">
            Built with <span className="text-danger">❤️</span> using React, FastAPI & Python
          </p>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default FooterSection;
