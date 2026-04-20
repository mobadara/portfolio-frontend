import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { BiUser, BiCode, BiBriefcase, BiCog, BiEnvelope, BiBook } from 'react-icons/bi';
import './NavigationBar.css';

// Map section element IDs → route paths used for nav links
const SECTION_ROUTE_MAP = {
  home:      '/',
  about:     '/about',
  skills:    '/skills',
  portfolio: '/portfolio',
  services:  '/services',
  contact:   '/contact',
};

const HOME_SECTION_PATHS = new Set(Object.values(SECTION_ROUTE_MAP));

const NavigationBar = ({ theme, onToggleTheme }) => {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [hideForFooter, setHideForFooter] = useState(false);
  const location = useLocation();

  // Determine active section from location when navigating via links
  useEffect(() => {
    const matched = Object.entries(SECTION_ROUTE_MAP).find(([, path]) => path === location.pathname);
    if (matched && matched[0] !== activeSection) setActiveSection(matched[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // IntersectionObserver: update active section while scrolling through the home sections.
  useEffect(() => {
    if (!HOME_SECTION_PATHS.has(location.pathname)) {
      return undefined;
    }

    const sectionIds = Object.keys(SECTION_ROUTE_MAP);
    const navbarHeight = 88; // approximate fixed navbar height
    let frameId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);

        if (visible.length === 0) return;

        // Pick the most visible section, with a top-offset tie breaker.
        const [bestMatch] = visible.sort((a, b) => {
          if (b.intersectionRatio !== a.intersectionRatio) {
            return b.intersectionRatio - a.intersectionRatio;
          }
          return Math.abs(a.boundingClientRect.top - navbarHeight) - Math.abs(b.boundingClientRect.top - navbarHeight);
        });

        if (bestMatch?.target?.id) {
          setActiveSection(bestMatch.target.id);
        }
      },
      {
        rootMargin: `-${navbarHeight + 8}px 0px -50% 0px`,
        threshold: [0.1, 0.25, 0.4, 0.6],
      }
    );

    frameId = window.requestAnimationFrame(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      observer.disconnect();
    };
  }, [location.pathname]);

  const isActive = (path) => SECTION_ROUTE_MAP[activeSection] === path;
  const isHeroRoute = location.pathname === '/';
  const shouldUseTransparentHeader = isHeroRoute && !scrolled && !expanded;

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

  useEffect(() => {
    const footerElement = document.querySelector('.footer-root');
    if (!footerElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideForFooter(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(footerElement);

    return () => observer.disconnect();
  }, [location.pathname]);

  const closeMenu = () => {
    setExpanded(false);
    document.body.style.overflow = ''; // Force immediate restore to prevent scroll-lock bugs on navigation
  };

  return (
    <>
      <div className={`mobile-menu-backdrop ${expanded ? 'show' : ''}`} onClick={closeMenu}></div>
      <Navbar
        expand="lg"
        fixed="top"
        expanded={expanded}
        className={`navbar-custom navbar-modern ${shouldUseTransparentHeader ? 'navbar-transparent' : 'navbar-scrolled'} ${hideForFooter ? 'navbar-hidden' : ''}`}
        variant="dark"
      >
        <Container fluid className="px-3 px-md-4">
        <Navbar.Brand as={Link} to="/" className="p-0 m-0 d-flex align-items-center navbar-brand-custom" onClick={closeMenu}>
          <span className="navbar-brand-text">MO</span>
        </Navbar.Brand>

        <Navbar.Collapse id="basic-navbar-nav" className="navbar-collapse-custom">
          <Nav className="ms-lg-auto text-center custom-nav-items nav-pill-surface">
            <Nav.Link as={Link} to="/about" onClick={closeMenu} className={`nav-link-custom ${isActive('/about') ? 'active-route' : ''}`}>
              <BiUser className="nav-icon" /> About
            </Nav.Link>
            <Nav.Link as={Link} to="/skills" onClick={closeMenu} className={`nav-link-custom ${isActive('/skills') ? 'active-route' : ''}`}>
              <BiCode className="nav-icon" /> Skills
            </Nav.Link>
            <Nav.Link as={Link} to="/portfolio" onClick={closeMenu} className={`nav-link-custom ${isActive('/portfolio') ? 'active-route' : ''}`}>
              <BiBriefcase className="nav-icon" /> Portfolio
            </Nav.Link>
            <Nav.Link as={Link} to="/services" onClick={closeMenu} className={`nav-link-custom ${isActive('/services') ? 'active-route' : ''}`}>
              <BiCog className="nav-icon" /> Services
            </Nav.Link>
            <Nav.Link as={Link} to="/publications" onClick={closeMenu} className={`nav-link-custom ${location.pathname === '/publications' ? 'active-route' : ''}`}>
              <BiBook className="nav-icon" /> Publications
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" onClick={closeMenu} className={`nav-link-custom ${isActive('/contact') ? 'active-route' : ''}`}>
              <BiEnvelope className="nav-icon" /> Contact
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>

        <div className="navbar-right-controls ms-auto ms-lg-3 d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-icon-toggle"
            data-mode={theme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <span className="theme-icon-shell" aria-hidden="true">
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
            </span>
            <span className="theme-toggle-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(prev => !prev)}
          className="border-0 shadow-none navbar-toggle-custom"
        >
          <i className={`bi fs-4 text-white toggle-icon ${expanded ? 'bi-x-lg' : 'bi-list'}`}></i>
        </Navbar.Toggle>
        </div>

      </Container>
    </Navbar>
    </>
  );
};

export default NavigationBar;