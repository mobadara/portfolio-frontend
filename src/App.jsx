import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import { SiMedium, SiSubstack } from 'react-icons/si';

import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ParticlesBackground from './components/backgrounds/ParticlesBackground';
import Chatbot from './components/chatbot/Chatbot';
import AIPlayground from './components/ai_playground/AIPlayground';
import Logo from './components/Logo';
import './App.css';

function App() {

  // 2. PROJECT DATA (Edit this with your real titles later)
  const projects = [
    {
      title: "Sentiment Analysis with BERT",
      category: "Deep Learning",
      description: "Fine-tuning transformer models to classify sentiment in financial news with 94% accuracy.",
      tech: ["PyTorch", "Hugging Face", "NLP"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=NLP+Model",
      github: "#",
      demo: "#"
    },
    {
      title: "Credit Risk Prediction",
      category: "Data Science",
      description: "Classical ML pipeline using Random Forest and XGBoost to predict loan defaults for a fintech client.",
      tech: ["Scikit-Learn", "Pandas", "XGBoost"],
      image: "https://placehold.co/600x400/e0e0e0/333?text=Risk+Model",
      github: "#",
      demo: null 
    },
    {
      title: "Healthcare Dashboard",
      category: "Visualization",
      description: "Interactive PowerBI dashboard visualizing patient demographics and resource allocation trends.",
      tech: ["PowerBI", "SQL", "DAX"],
      image: "https://placehold.co/600x400/FFD700/000?text=PowerBI",
      github: "#",
      demo: "#"
    },
    {
      title: "AI-Powered API",
      category: "AI Engineering",
      description: "Scalable REST API built with FastAPI to serve real-time predictions from a trained PyTorch model.",
      tech: ["FastAPI", "Docker", "Azure"],
      image: "https://placehold.co/600x400/003366/FFF?text=FastAPI+Backend",
      github: "#",
      demo: "#"
    },
    {
      title: "Pneumonia Detection (CNN)",
      category: "Deep Learning",
      description: "Computer Vision model trained on X-ray datasets to detect early signs of pneumonia.",
      tech: ["CNN", "TensorFlow/Keras", "OpenCV"],
      image: "https://placehold.co/600x400/555/FFF?text=Computer+Vision",
      github: "#",
      demo: null
    },
    {
      title: "Customer Churn Analysis",
      category: "Data Science",
      description: "Exploratory Data Analysis (EDA) and predictive modeling to identify at-risk customers.",
      tech: ["Python", "Seaborn", "Logistic Reg"],
      image: "https://placehold.co/600x400/001f3f/FFF?text=Data+Analysis",
      github: "#",
      demo: "#"
    }
  ];

  const [theme, setTheme] = useState('light');
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // 1. Theme Logic
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  // 2. Scroll Logic (Detects if user has scrolled down)
  useEffect(() => {
    const handleScroll = () => {
      // If user scrolls down more than 50px, switch to "scrolled" mode
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const closeMenu = () => setExpanded(false);

  return (
    <>
      {/* --- NAVBAR --- */}
      <Navbar 
        expand="lg" 
        fixed="top" 
        expanded={expanded}
        className={`navbar-custom ${scrolled || expanded ? 'navbar-scrolled' : 'navbar-transparent'}`}
        variant="dark"
      >
        <Container>
          <Navbar.Brand href="#home" className="p-0 m-0 d-flex align-items-center">
            {/* We pass height=50 to make it nice and prominent in the nav */}
            <Logo height="50" />
          </Navbar.Brand>

          <Navbar.Toggle 
            aria-controls="basic-navbar-nav" 
            onClick={() => setExpanded(!expanded)} 
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
            
            {/* THEME SWITCH */}
            <div className="d-flex justify-content-center align-items-center ms-lg-3 mt-4 mt-lg-0">
               <div className="d-flex align-items-center gap-2">
                 {/* Moon Icon (Left) */}
                 <i className={`bi bi-moon-fill ${theme === 'dark' ? 'text-white' : 'text-white-50'}`}></i>
                 
                 {/* The Switch Input */}
                 <Form.Check 
                   type="switch"
                   id="theme-switch"
                   label=""
                   checked={theme === 'dark' ? false : true} // Checked = Light Mode (Sun)
                   onChange={toggleTheme}
                   className="theme-switch-custom"
                 />
                 
                 {/* Sun Icon (Right) */}
                 <i className={`bi bi-sun-fill ${theme === 'light' ? 'text-warning' : 'text-white-50'}`}></i>
               </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- HERO SECTION --- */}
      <section id="home" className="hero-section position-relative">
        
        {/* THE PARTICLES BACKGROUND */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <ParticlesBackground />
        </div>

        {/* THE CONTENT (Z-Index ensures text is clickable and visible over particles) */}
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col md={10} lg={8}>
              
              <h5 className="text-warning fw-bold mb-3 animate-fade-up">
                HELLO, WORLD.
              </h5>
              
              <h1 className="display-3 fw-bold mb-4 animate-fade-up delay-100">
                I'm Muyiwa J. Obadara
              </h1>
              
              <h2 className="h2 mb-4 text-light opacity-75 animate-fade-up delay-200">
                Data Scientist | AI Engineer | Software Developer
              </h2>
              
              <p className="lead mb-5 mx-auto animate-fade-up delay-300" style={{ maxWidth: '800px' }}>
                Turning complex data into intelligent action. Grounded in <strong>Mathematics</strong> and <strong>Linear Algebra</strong>, 
                I specialize in Data Science, Machine Learning, and AI Engineering—building robust models and scalable backends for any domain.
              </p>

              <div className="animate-fade-up delay-300">
                <Button variant="light" size="lg" className="me-3 fw-bold text-navy px-4 py-2" href="#portfolio">
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

    {/* --- ABOUT ME SECTION --- */}
      <section id="about" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
        <Container>
          <Row className="align-items-center">
            
            {/* COLUMN 1: IMAGE */}
            <Col md={5} className="mb-5 mb-md-0 text-center">
              <div className="profile-img-container">
                <img 
                  src="https://placehold.co/400x500/001f3f/FFF?text=MO" 
                  alt="Muyiwa J. Obadara" 
                  className="profile-img" 
                />
                <div className="profile-img-bg"></div>
              </div>
            </Col>

            {/* COLUMN 2: BIO, STATS & STRENGTHS */}
            <Col md={7}>
              <h2 className="fw-bold mb-3 display-6" style={{ color: 'var(--navy-blue)' }}>
                 The intersection of Math, Code & Harmony
              </h2>
              
              <p className="text-muted mb-4">
                I am a <strong>Data Scientist</strong> and <strong>AI Engineer</strong> who views the world through the lens of mathematics. 
                My background in <strong>Physics</strong> has equipped me with a rigorous "First Principles" approach, allowing me to build systems that are not just functional, but foundational.
              </p>

              {/* --- NEW: STATS GRID --- */}
              {/* --- NEW: ANIMATED CIRCULAR STATS GRID --- */}
              <Row className="g-4 mb-5 justify-content-center">
                {/* Helper function to define the circular structure once */}
                {[
                  { num: "02+", lbl: "Years Exp.", delay: "0s" },
                  { num: "10+", lbl: "Projects", delay: "0.5s" }, // Staggered start
                  { num: "05", lbl: "Certifications", delay: "1s" } // Staggered start
                ].map((item, index) => (
                  <Col sm={4} key={index} className="d-flex justify-content-center">
                    
                    <div className="metric-circle-container">
                      {/* The SVG Animated Ring */}
                      <svg className="metric-svg" viewBox="0 0 120 120">
                        {/* The static background track ring */}
                        <circle className="metric-track" cx="60" cy="60" r="54" />
                        {/* The spinning gold ring */}
                        <circle 
                          className="metric-spinner" 
                          cx="60" cy="60" r="54" 
                          style={{ animationDelay: item.delay }} 
                        />
                      </svg>
                      
                      {/* The Text Content centered inside */}
                      <div className="metric-content text-center">
                        <h3 className="fw-bold mb-0 display-6">{item.num}</h3>
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                          {item.lbl}
                        </small>
                      </div>
                    </div>

                  </Col>
                ))}
              </Row>

              {/* --- NEW: STRENGTHS LIST --- */}
              <h6 className="fw-bold mb-3" style={{ color: 'var(--navy-blue)' }}>
                CORE COMPETENCIES
              </h6>
              
              <ul className="list-unstyled mb-4">
                <li className="d-flex align-items-start mb-2">
                  <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
                  <span><strong>Clean, Efficient Code:</strong> Writing highly documented, production-ready Python & SQL.</span>
                </li>
                <li className="d-flex align-items-start mb-2">
                  <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
                  <span><strong>Cloud & API Deployment:</strong> Shipping models to production using FastAPI, Docker, and Azure.</span>
                </li>
                <li className="d-flex align-items-start mb-2">
                  <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
                  <span><strong>Data Visualization:</strong> Translating complex statistics into clear insights with PowerBI & Matplotlib.</span>
                </li>
                <li className="d-flex align-items-start mb-2">
                  <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
                  <span><strong>Predictive Modelling:</strong> Building robust ML algorithms for real-world forecasting.</span>
                </li>
                <li className="d-flex align-items-start mb-2">
                  <i className="bi bi-check-circle-fill text-warning mt-1 me-3"></i>
                  <span><strong>AI Engineering:</strong> Automating workflows and integrating LLMs into business logic.</span>
                </li>
              </ul>

              {/* BUTTONS */}
              <div className="d-flex align-items-center gap-3">
                <Button 
                    variant="primary" 
                    className="bg-navy border-navy px-4 fw-bold"
                    href="/resume.pdf" 
                    target="_blank"
                >
                    Download CV <i className="bi bi-download ms-2"></i>
                </Button>
              </div>

            </Col>
          </Row>
        </Container>
      </section>
      

      {/* --- PORTFOLIO SECTION --- */}
      <section id="portfolio" className="mt-5 section-padding">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold display-6 text-navy">
              Featured Projects
            </h2>
          </div>

          {/* FILTER BUTTONS */}
          <div className="d-flex justify-content-center flex-wrap gap-2 mb-5">
            {['All', 'Deep Learning', 'Data Science', 'AI Engineering', 'Visualization'].map((category) => (
              <Button 
                key={category}
                variant={activeCategory === category ? "primary" : "outline-primary"}
                className={`rounded-pill px-4 ${activeCategory === category ? "bg-navy border-navy" : "text-navy border-navy"}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* PROJECT GRID */}
          <Row>
            {projects
              .filter(project => activeCategory === 'All' || project.category === activeCategory)
              .map((project, index) => (
                <Col md={4} className="mb-4" key={index}>
                  <Card className="h-100 shadow-sm border-0 card-custom">
                    {/* Placeholder Image */}
                    <div className="position-relative overflow-hidden">
                       <Card.Img 
                         variant="top" 
                         src={project.image} 
                         style={{ height: '200px', objectFit: 'cover' }} 
                       />
                       {/* Overlay Badge */}
                       <div className="position-absolute top-0 end-0 m-2">
                         <Badge bg="warning" text="dark" className="fw-bold">{project.category}</Badge>
                       </div>
                    </div>
                    
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="fw-bold text-navy">{project.title}</Card.Title>
                      <Card.Text className="text-muted small flex-grow-1">
                        {project.description}
                      </Card.Text>
                      
                      <div className="mb-3">
                        {project.tech.map((t, i) => (
                          <Badge bg="light" text="dark" className="me-1 border" key={i}>{t}</Badge>
                        ))}
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Button variant="outline-dark" size="sm" className="w-100" href={project.github} target="_blank">
                          <FaGithub className="me-2" /> Code
                        </Button>
                        {project.demo && (
                          <Button variant="primary" size="sm" className="w-100 bg-navy border-navy" href={project.demo} target="_blank">
                            <i className="bi bi-box-arrow-up-right me-2"></i> Live
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
            ))}
          </Row>
        </Container>
      </section>

        {/* --- AI PLAYGROUND SECTION --- */}
      <AIPlayground />

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="m-5 section-padding bg-navy text-white position-relative">
        {/* Optional: Add a subtle overlay or pattern here if desired */}
        <Container className="p-5">
          <div className="text-center mb-3">
            <h2 className="fw-bold display-6">Engineering Intelligence</h2>
          </div>

          <Row className="g-4">
            {/* Service 1: AI Engineering */}
            <Col md={4}>
              <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
                <i className="bi bi-cpu-fill fs-1 text-warning mb-3 d-block"></i>
                <h4 className="fw-bold">AI Engineering</h4>
                <p className="text-light opacity-75">
                  I don't just build models; I deploy them. Using <strong>FastAPI</strong>, Docker, and Cloud platforms (Azure), I turn experimental code into scalable, production-ready APIs.
                </p>
              </div>
            </Col>

            {/* Service 2: Data Science */}
            <Col md={4}>
              <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
                <i className="bi bi-graph-up-arrow fs-1 text-warning mb-3 d-block"></i>
                <h4 className="fw-bold">Data Science & Analytics</h4>
                <p className="text-light opacity-75">
                  Extracting actionable signals from noise. I use classical Machine Learning and statistical analysis to build predictive models for Finance and Healthcare.
                </p>
              </div>
            </Col>

            

            {/* Service 3: NLP & Deep Learning */}
            <Col md={4}>
              <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
                <i className="bi bi-chat-square-text-fill fs-1 text-warning mb-3 d-block"></i>
                <h4 className="fw-bold">NLP & Computer Vision</h4>
                <p className="text-light opacity-75">
                  Leveraging <strong>Hugging Face</strong> transformers and CNNs to process unstructured data—whether it's analyzing financial sentiment or detecting patterns in images.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* --- NEWSLETTER SECTION --- */}
      <section className="py-5 bg-light border-top border-bottom">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} className="text-center">
              
              {/* Icon & Heading */}
              <div className="mb-3">
                {/* Inline style used to override theme colors for brand accuracy */}
                <SiSubstack className="display-4 mb-3" style={{ color: '#FF6719' }} />
              </div>
              <h3 className="fw-bold text-navy">Join "The Algorithmic Pulse"</h3>
              
              <p className="text-muted mb-4 fs-5">
                Get my latest articles on <strong>AI Engineering</strong>, <strong>Financial Modeling</strong>, and <strong>Tech Career Growth</strong> delivered straight to your inbox. No spam, just signal.
              </p>
              
              {/* Call to Action Button */}
              <Button 
                variant="primary" 
                size="lg" 
                href="https://yourname.substack.com" // REPLACE THIS with your actual URL
                target="_blank"
                className="px-5 py-3 fw-bold shadow-sm newsletter-btn"
                style={{ backgroundColor: '#FF6719', borderColor: '#FF6719' }}
              >
                Subscribe for Free <i className="bi bi-arrow-right-short ms-2 fs-4 align-middle"></i>
              </Button>
              
              <p className="small text-muted mt-3">
                Read by data scientists and engineers from top companies.
              </p>

            </Col>
          </Row>
        </Container>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <div className="text-center mb-5">

                <h2 className="fw-bold display-6 text-navy">Let's Solve a Problem</h2>
                <p className="text-muted mt-3">
                  Whether you have a question about a project, a collaboration idea, or just want to discuss the latest in AI, I'd love to hear from you.
                </p>
              </div>

              <Card className="border-0 shadow-lg card-custom p-4">
                <Card.Body>
                  <Form>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold small text-muted">YOUR NAME</Form.Label>
                          <Form.Control type="text" placeholder="John Doe" className="bg-light border-0 py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-bold small text-muted">YOUR EMAIL</Form.Label>
                          <Form.Control type="email" placeholder="name@example.com" className="bg-light border-0 py-2" />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold small text-muted">MESSAGE</Form.Label>
                      <Form.Control as="textarea" rows={5} placeholder="How can I help you?" className="bg-light border-0 py-2" />
                    </Form.Group>

                    <div className="text-center">
                      <Button variant="primary" size="lg" className="bg-navy border-navy px-5 fw-bold w-100">
                        Send Message <i className="bi bi-send-fill ms-2"></i>
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      

      {/* --- FOOTER --- */}
      <footer id="blog" className="bg-navy text-white text-center py-5 border-top border-secondary">
        <Container>
          <div className="mb-4">
            <h6 className="text-warning fw-bold small text-uppercase mb-3">Connect & Read</h6>
            
            <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
                
                {/* GROUP 1: SOCIALS & CODE */}
                <div className="d-flex gap-4">
                    <a href="https://linkedin.com/in/obadara-m" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="LinkedIn">
                        <FaLinkedin />
                    </a>
                    <a href="https://twitter.com/m_obadara" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="X (Twitter)">
                        <FaTwitter />
                    </a>
                    <a href="https://github.com/mobadara" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="GitHub">
                        <FaGithub />
                    </a>
                </div>

                {/* DIVIDER (Visible on larger screens) */}
                <div className="vr bg-secondary opacity-50 mx-2 d-none d-md-block" style={{ height: '30px' }}></div>

                {/* GROUP 2: WRITING (Blog & Newsletter) */}
                <div className="d-flex gap-4">
                    {/* Replace '#' with your actual Medium URL */}
                    <a href="#" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="Medium Blog">
                        <SiMedium />
                    </a>
                    {/* Replace '#' with your actual Substack URL */}
                    <a href="#" target="_blank" rel="noreferrer" className="text-white fs-4 hover-warning" title="Substack Newsletter">
                        <SiSubstack />
                    </a>
                </div>

            </div>
          </div>

          <p className="mb-0 small opacity-50">
            &copy; {new Date().getFullYear()} Muyiwa J. Obadara. Built with React & FastAPI.
          </p>
        </Container>
      </footer>

      <Chatbot />
    </>
  );
}

export default App;