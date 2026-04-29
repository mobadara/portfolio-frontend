import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const TITLES = ['Data Scientist', 'AI Engineer', 'Software Developer', 'Mentor'];
const HIRE_TYPES = ['Contract', 'Full-Time', 'Part-Time', 'Freelance', 'Remote', 'On-site'];
const FOCUS_AREAS = ['Applied AI', 'MLOps', 'Data Products', 'Technical Mentorship'];
const YEARS_OF_EXPERIENCE = new Date().getFullYear() - 2023;
const AI_PLANETS = [
  { key: 'ml', label: 'Machine Learning', orbit: 'outer', position: 'top' },
  { key: 'se', label: 'Software Engineering', orbit: 'outer', position: 'bottom' },
  { key: 'automation', label: 'Automation', orbit: 'middle', position: 'left' },
  { key: 'statistics', label: 'Statistics', orbit: 'middle', position: 'right' },
  { key: 'linear-algebra', label: 'Linear Algebra', orbit: 'inner', position: 'top-right' },
  { key: 'data-science', label: 'Data Science', orbit: 'inner', position: 'bottom-left' },
];

const HeroSection = () => {
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % TITLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero-section">
      <div className="hero-atmosphere" aria-hidden="true">
        <span className="hero-glow hero-glow--one" />
        <span className="hero-glow hero-glow--two" />
      </div>

      <div className="hero-container">
        <div className="hero-content fade-in">
          <div className="hero-copy single-column">
            <div className="hero-badge">
              <span className="badge-text">Building production-ready AI experiences</span>
            </div>

            <h1 className="hero-title">Muyiwa Obadara</h1>
            <div className="hero-divider"></div>

            <div className="role-container">
              <p className="role-text">
                <span className="role-prefix">I work as a </span>
                <span className="role-highlight" key={titleIndex}>{TITLES[titleIndex]}</span>
              </p>
            </div>

            <div className="hero-center-animation" aria-hidden="true">
              <div className="orbit orbit-outer">
                {AI_PLANETS.filter((item) => item.orbit === 'outer').map((item) => (
                  <span key={item.key} className={`ai-planet ai-planet--${item.position}`}>
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="orbit orbit-middle">
                {AI_PLANETS.filter((item) => item.orbit === 'middle').map((item) => (
                  <span key={item.key} className={`ai-planet ai-planet--${item.position}`}>
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="orbit orbit-inner">
                {AI_PLANETS.filter((item) => item.orbit === 'inner').map((item) => (
                  <span key={item.key} className={`ai-planet ai-planet--${item.position}`}>
                    {item.label}
                  </span>
                ))}
              </div>
              <span className="node node-a" />
              <span className="node node-b" />
              <span className="node node-c" />
              <div className="hero-core">AI</div>
            </div>

            <div className="role-chip-row">
              {FOCUS_AREAS.map((area) => (
                <span key={area} className="role-chip">{area}</span>
              ))}
            </div>

            <p className="hero-description">
              I design and deploy intelligent systems across analytics, machine learning, APIs, and product-ready software. I help teams go from idea to deployment with practical architecture, measurable impact, and clear communication.
            </p>

            <div className="hire-block">
              <h6 className="hire-title">Available for hire</h6>
              <div className="hire-chip-row">
                {HIRE_TYPES.map((type) => (
                  <span key={type} className="hire-chip">{type}</span>
                ))}
                <span className="hire-chip">and more</span>
              </div>
            </div>

            <div className="hero-buttons">
              <Link className="btn-primary-cta" to="/portfolio">View Projects</Link>
              <Link className="btn-accent-cta" to="/publications">Publications</Link>
              <Link className="btn-secondary-cta" to="/contact">Get In Touch</Link>
            </div>

            <div className="hero-stats centered-stats">
              <div className="stat-item">
                <div className="stat-number">{YEARS_OF_EXPERIENCE}+</div>
                <div className="stat-label">Years Experience</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10+</div>
                <div className="stat-label">Projects Delivered</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10+</div>
                <div className="stat-label">Core Technologies</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
