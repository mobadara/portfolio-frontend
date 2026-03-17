import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Link } from 'react-router-dom';
import {
  FaHome, FaUser, FaCode, FaBriefcase,
  FaPen, FaCogs, FaEnvelope,
  FaDownload, FaExternalLinkAlt
} from 'react-icons/fa';
import { contactDetails, socialLinks } from '../data/siteContact';
import './FooterSection.css';

const NAV_LINKS = [
  { to: '/',          label: 'Home',      Icon: FaHome },
  { to: '/about',     label: 'About',     Icon: FaUser },
  { to: '/skills',    label: 'Skills',    Icon: FaCode },
  { to: '/portfolio', label: 'Portfolio', Icon: FaBriefcase },
  { to: '/blog',      label: 'Blog',      Icon: FaPen },
  { to: '/services',  label: 'Services',  Icon: FaCogs },
  { to: '/contact',   label: 'Contact',   Icon: FaEnvelope },
];

const GithubIcon = socialLinks.find((item) => item.label === 'GitHub')?.Icon;
const MediumIcon = socialLinks.find((item) => item.label === 'Medium')?.Icon;
const LinkedInIcon = socialLinks.find((item) => item.label === 'LinkedIn')?.Icon;
const TwitterIcon = socialLinks.find((item) => item.label === 'Twitter')?.Icon;

const FooterSection = () => (
  <footer className="footer-root">
    <Container>
      <Row className="gy-5">
        <Col lg={3} md={6} sm={12}>
          <div className="footer-brand footer-column">
            <div className="footer-initials" aria-label="MO">
              <span>MO</span>
            </div>
            <h5 className="footer-name">Muyiwa Obadara</h5>
            <p className="footer-tagline">
              Data Scientist &amp; AI Engineer building intelligent systems
              at the intersection of data, code, and real-world impact.
            </p>
          </div>
        </Col>

        <Col lg={3} md={6} sm={12} className="footer-column">
          <h6 className="footer-heading">Navigation</h6>
          <ul className="footer-links">
            {NAV_LINKS.map((navItem) => (
              <li key={navItem.to}>
                <Link to={navItem.to} className="footer-link">
                  <navItem.Icon className="footer-link-icon" />
                  {navItem.label}
                </Link>
              </li>
            ))}
          </ul>
        </Col>

        <Col lg={3} md={6} sm={12} className="footer-column">
          <h6 className="footer-heading">Resources</h6>
          <ul className="footer-links">
            <li>
              <a href="/resume.pdf" download className="footer-link">
                <FaDownload className="footer-link-icon" /> Download Resume
              </a>
            </li>
            <li>
              <a href="https://github.com/mobadara" target="_blank" rel="noopener noreferrer" className="footer-link">
                {GithubIcon && <GithubIcon className="footer-link-icon" />} GitHub Profile
              </a>
            </li>
            <li>
              <a href="https://mobadara.medium.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                {MediumIcon && <MediumIcon className="footer-link-icon" />} Medium Articles
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/muyiwa-obadara" target="_blank" rel="noopener noreferrer" className="footer-link">
                {LinkedInIcon && <LinkedInIcon className="footer-link-icon" />} LinkedIn
              </a>
            </li>
            <li>
              <a href="https://twitter.com/mobadara" target="_blank" rel="noopener noreferrer" className="footer-link">
                {TwitterIcon && <TwitterIcon className="footer-link-icon" />} Twitter / X
              </a>
            </li>
            <li>
              <a href="mailto:contact@mobadara.dev" className="footer-link">
                <FaEnvelope className="footer-link-icon" /> Send an Email
              </a>
            </li>
            <li>
              <a href="https://mobadara.dev" target="_blank" rel="noopener noreferrer" className="footer-link">
                <FaExternalLinkAlt className="footer-link-icon" /> Live Portfolio
              </a>
            </li>
          </ul>
        </Col>

        <Col lg={3} md={6} sm={12} className="footer-column">
          <h6 className="footer-heading">Connect</h6>
          <p className="footer-connect-copy">
            Available for collaboration, consulting, mentoring, and AI product development.
          </p>
          <ul className="footer-links footer-links-compact">
            {contactDetails.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a href={item.href} target={item.href.startsWith('https') ? '_blank' : undefined} rel={item.href.startsWith('https') ? 'noopener noreferrer' : undefined} className="footer-link">
                    <item.Icon className="footer-link-icon" /> {item.value}
                  </a>
                ) : (
                  <span className="footer-link footer-link-static">
                    <item.Icon className="footer-link-icon" /> {item.value}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="footer-socials footer-socials-secondary">
            {socialLinks.map((social) => (
              <a
                key={`connect-${social.label}`}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`social-icon ${social.cls}`}
                title={social.label}
                aria-label={social.label}
              >
                <social.Icon />
              </a>
            ))}
          </div>
        </Col>
      </Row>

      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Muyiwa Obadara. All rights reserved.</span>
        <span>Built with React &amp; Python</span>
      </div>
    </Container>
  </footer>
);

export default FooterSection;
