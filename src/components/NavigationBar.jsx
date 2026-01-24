import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Logo from './Logo';

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
        <Navbar.Brand href="#home" className="p-0 m-0 d-flex align-items-center">
          <Logo height="50" />
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(prev => !prev)}
          className="border-0 shadow-none"
        >
          {expanded ? <i className="bi bi-x-lg fs-1 text-white"></i> : <i className="bi bi-list fs-1 text-white"></i>}
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto text-center custom-nav-items">
            <Nav.Link href="#home" onClick={closeMenu} className="fs-5 mx-2 text-white">Home</Nav.Link>
            <Nav.Link href="#about" onClick={closeMenu} className="fs-5 mx-2 text-white">About</Nav.Link>
            <Nav.Link href="#portfolio" onClick={closeMenu} className="fs-5 mx-2 text-white">Portfolio</Nav.Link>
            <Nav.Link href="https://medium.com/@mobadara" onClick={closeMenu} className="fs-5 mx-2 text-white">Blog</Nav.Link>
            <Nav.Link href="#services" onClick={closeMenu} className="fs-5 mx-2 text-white">Services</Nav.Link>
            <Nav.Link href="#contact" onClick={closeMenu} className="fs-5 mx-2 text-white">Contact</Nav.Link>
          </Nav>

          <div className="d-flex justify-content-center align-items-center ms-lg-3 mt-4 mt-lg-0">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi bi-moon-fill ${theme === 'dark' ? 'text-white' : 'text-white-50'}`}></i>
              <Form.Check
                type="switch"
                id="theme-switch"
                label=""
                checked={theme === 'light'}
                onChange={onToggleTheme}
                className="theme-switch-custom"
              />
              <i className={`bi bi-sun-fill ${theme === 'light' ? 'text-warning' : 'text-white-50'}`}></i>
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
