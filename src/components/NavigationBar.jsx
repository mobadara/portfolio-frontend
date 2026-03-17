import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Logo from './Logo';
import { BiUser, BiCode, BiBriefcase, BiFile, BiCog, BiEnvelope } from 'react-icons/bi';
import './NavigationBar.css';

// Map section element IDs → route paths used for nav links
const SECTION_ROUTE_MAP = {
  home:      '/',
  about:     '/about',
  skills:    '/skills',
  portfolio: '/portfolio',
  blog:      '/blog',
  services:  '/services',
  contact:   '/contact',
};

const NavigationBar = ({ theme, onToggleTheme }) => {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();

  // Determine active section from location when navigating via links
  useEffect(() => {
    const matched = Object.entries(SECTION_ROUTE_MAP).find(([, path]) => path === location.pathname);
    if (matched) setActiveSection(matched[0]);
  }, [location.pathname]);

  // IntersectionObserver: update activeSection as sections scroll in/out
  useEffect(() => {
    const sectionIds = Object.keys(SECTION_ROUTE_MAP);
    const navbarHeight = 88; // approximate fixed navbar height

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top of the viewport (most "in view")
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${navbarHeight}px 0px -45% 0px`,
        threshold: 0,
      }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const isActive = (path) => SECTION_ROUTE_MAP[activeSection] === path;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    if (expanded && window.innerWidth < 992) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
  }, [expanded]);

  const closeMenu = () => setExpanded(false);

  return (
    <>
      <div className={`mobile-menu-backdrop ${expanded ? 'show' : ''}`} onClick={closeMenu}></div>
      <Navbar
        expand="lg"
        fixed="top"
        expanded={expanded}
        className={`navbar-custom ${scrolled || expanded ? 'navbar-scrolled' : 'navbar-transparent'}`}
        variant="dark"
      >
        <Container fluid className="px-3 px-md-4">
        <Navbar.Brand as={Link} to="/" className="p-0 m-0 d-flex align-items-center navbar-brand-custom" onClick={closeMenu}>
          <Logo height="50" />
        </Navbar.Brand>

        <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-custom">
          <Nav className="ms-lg-auto text-center custom-nav-items">
            <Nav.Link as={Link} to="/about" onClick={closeMenu} className={`nav-link-custom ${isActive('/about') ? 'active-route' : ''}`}>
              <BiUser className="nav-icon" /> About
            </Nav.Link>
            <Nav.Link as={Link} to="/skills" onClick={closeMenu} className={`nav-link-custom ${isActive('/skills') ? 'active-route' : ''}`}>
              <BiCode className="nav-icon" /> Skills
            </Nav.Link>
            <Nav.Link as={Link} to="/portfolio" onClick={closeMenu} className={`nav-link-custom ${isActive('/portfolio') ? 'active-route' : ''}`}>
              <BiBriefcase className="nav-icon" /> Portfolio
            </Nav.Link>
            <Nav.Link as={Link} to="/blog" onClick={closeMenu} className={`nav-link-custom ${isActive('/blog') ? 'active-route' : ''}`}>
              <BiFile className="nav-icon" /> Blog
            </Nav.Link>
            <Nav.Link as={Link} to="/services" onClick={closeMenu} className={`nav-link-custom ${isActive('/services') ? 'active-route' : ''}`}>
              <BiCog className="nav-icon" /> Services
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" onClick={closeMenu} className={`nav-link-custom ${isActive('/contact') ? 'active-route' : ''}`}>
              <BiEnvelope className="nav-icon" /> Contact
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>

        <div className="navbar-right-controls ms-auto ms-lg-3 d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 theme-switch-container">
            <i className={`bi bi-moon-fill theme-icon moon-icon ${theme === 'dark' ? 'active' : ''}`}></i>
            <Form.Check
              type="switch"
              id="theme-switch"
              label=""
              checked={theme === 'light'}
              onChange={onToggleTheme}
              className="theme-switch-custom"
            />
            <i className={`bi bi-sun-fill theme-icon sun-icon ${theme === 'light' ? 'active' : ''}`}></i>
          </div>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(prev => !prev)}
          className="border-0 shadow-none navbar-toggle-custom"
        >
          <i className={`bi fs-1 text-white toggle-icon ${expanded ? 'bi-x-lg' : 'bi-list'}`}></i>
        </Navbar.Toggle>
        </div>

      </Container>
    </Navbar>
    </>
  );
};

export default NavigationBar;
