import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const TITLES = ['Data Scientist', 'AI Engineer', 'Software Developer', 'Mentor'];
const HIRE_TYPES = ['Contract', 'Full-Time', 'Part-Time', 'Freelance', 'Remote', 'On-site'];

const HeroSection = () => {
  const [titleIndex, setTitleIndex] = useState(0);
  const isVisible = true;

  useEffect(() => {
    const timer = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % TITLES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero-section">
      <div className="hero-container">
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <div className="hero-main-grid">
            <div className="hero-copy">
              <h1 className="hero-title">Muyiwa Obadara</h1>
              <div className="hero-divider"></div>

              <div className="role-container">
                <p className="role-text">
                  <span className="role-highlight" key={titleIndex}>{TITLES[titleIndex]}</span>
                </p>
              </div>

              <div className="role-chip-row">
                {TITLES.map((role) => (
                  <span key={role} className="role-chip">{role}</span>
                ))}
              </div>

              <p className="hero-description">
                I design and deploy intelligent systems across analytics, machine learning, APIs, and product-ready software. I also mentor aspiring professionals and teams building practical AI solutions.
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
                <Link className="btn-secondary-cta" to="/contact">Get In Touch</Link>
              </div>
            </div>

            <div className="hero-right-column">
              <div className="pipeline-cartoon" aria-hidden="true">
                <div className="pipeline-title">Data Pipeline</div>
                <div className="pipeline-track">
                  <div className="pipeline-node pipeline-animated-node source">Data</div>
                  <div className="pipeline-arrow">→</div>
                  <div className="pipeline-node pipeline-animated-node process">Clean</div>
                  <div className="pipeline-arrow">→</div>
                  <div className="pipeline-node pipeline-animated-node model">Model</div>
                  <div className="pipeline-arrow">→</div>
                  <div className="pipeline-node pipeline-animated-node deploy">Deploy</div>
                  <span className="data-dot dot-1"></span>
                  <span className="data-dot dot-2"></span>
                  <span className="data-dot dot-3"></span>
                </div>
              </div>

              <div className="leadership-strip" aria-label="AI Leadership and Educator">
                <h6 className="leadership-title">AI Leadership &amp; Educator</h6>
                <p className="leadership-text mb-0">
                  Leading teams, mentoring talent, and translating AI strategy into practical learning and business outcomes.
                </p>
              </div>

              <div className="hero-stats hero-stats-right">
                <div className="stat-item">
                  <div className="stat-number">5+</div>
                  <div className="stat-label">Years Experience</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">20+</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10+</div>
                  <div className="stat-label">Technologies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
