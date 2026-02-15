import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Logo from './Logo';
import { BiUser, BiCode, BiBriefcase, BiFile, BiGear, BiEnvelope } from 'react-icons/bi';
import './NavigationBar.css';

const NavigationBar = ({ theme, onToggleTheme }) => {
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setExpanded(false);

  return (
    <Navbar
      expand="lg"
      fixed="top"
      expanded={expanded}
      className={`navbar-custom ${scrolled || expanded ? 'navbar-scrolled' : 'navbar-transparent'}`}
      variant="dark"
    >
      <Container fluid className="px-3 px-md-4">
        <Navbar.Brand href="#home" className="p-0 m-0 d-flex align-items-center navbar-brand-custom">
          <Logo height="50" />
        </Navbar.Brand>

        <div className="navbar-name d-lg-none">
          <span>Muyiwa Obadara</span>
        </div>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(prev => !prev)}
          className="border-0 shadow-none navbar-toggle-custom"
        >
          <i className={`bi fs-1 text-white toggle-icon ${expanded ? 'bi-x-lg' : 'bi-list'}`}></i>
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto text-center custom-nav-items">
            <Nav.Link href="#about" onClick={closeMenu} className="nav-link-custom">
              <BiUser className="nav-icon" /> About
            </Nav.Link>
            <Nav.Link href="#skills" onClick={closeMenu} className="nav-link-custom">
              <BiCode className="nav-icon" /> Skills
            </Nav.Link>
            <Nav.Link href="#portfolio" onClick={closeMenu} className="nav-link-custom">
              <BiBriefcase className="nav-icon" /> Portfolio
            </Nav.Link>
            <Nav.Link href="#blog" onClick={closeMenu} className="nav-link-custom">
              <BiFile className="nav-icon" /> Blog
            </Nav.Link>
            <Nav.Link href="#services" onClick={closeMenu} className="nav-link-custom">
              <BiGear className="nav-icon" /> Services
            </Nav.Link>
            <Nav.Link href="#contact" onClick={closeMenu} className="nav-link-custom">
              <BiEnvelope className="nav-icon" /> Contact
            </Nav.Link>
          </Nav>

          <div className="d-flex justify-content-center align-items-center ms-lg-3 mt-4 mt-lg-0">
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
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
