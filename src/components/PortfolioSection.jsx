import { useMemo, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { FaGithub, FaExternalLinkAlt, FaYoutube } from 'react-icons/fa';

const PortfolioSection = ({ projects = [] }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [touchedCard, setTouchedCard] = useState(null);

  // Get unique categories from projects
  const categories = useMemo(() => {
    const uniq = ['All', ...new Set(projects.map(p => p.category))];
    return uniq;
  }, [projects]);

  const filteredProjects = useMemo(
    () => projects.filter(project => activeCategory === 'All' || project.category === activeCategory),
    [activeCategory, projects]
  );

  const handleCardTouchStart = (projectId) => {
    setTouchedCard(projectId);
  };

  return (
    <section id="portfolio" className="mt-5 section-padding">
      <Container>
        <div className="section-shell">
        {/* Section Header */}
        <div className="text-center mb-5">
          <h2 className="fw-bold display-6 text-navy mb-2">Featured Projects</h2>
          <p className="text-muted">Selection of recent work across machine learning, data science, and full-stack AI</p>
        </div>

        {/* Mobile Tooltip */}
        <div className="mobile-tooltip d-md-none text-center mb-4">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Hold down on a project card to view links
          </small>
        </div>

        {/* Category Filter */}
        <div className="d-flex justify-content-center flex-wrap gap-2 mb-5">
          {categories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'primary' : 'outline-secondary'}
              className={`rounded-pill px-4 fw-500 ${activeCategory === category ? 'bg-navy border-navy' : 'text-navy'}`}
              onClick={() => setActiveCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Projects Grid */}
        <Row className="g-4">
          {filteredProjects.map((project) => (
            <Col lg={4} md={6} className="mb-2" key={project._id || project.title}>
              <div 
                className={`project-card h-100 ${touchedCard === project._id ? 'touched' : ''}`}
                onTouchStart={() => handleCardTouchStart(project._id)}
                onTouchEnd={() => setTouchedCard(null)}
                style={{ background: 'var(--section-bg, #fff)', color: 'var(--text-main, #212529)' }}
              >
                {/* Image Container with Floating Links */}
                <div className="project-image-wrapper position-relative overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="project-image"
                  />
                  <div className="project-overlay d-flex gap-3 align-items-center justify-content-center">
                    {project.links?.github && (
                      <a 
                        href={project.links.github} 
                        target="_blank" 
                        rel="noreferrer"
                        className="project-link-icon"
                        title="View on GitHub"
                      >
                        <FaGithub size={28} />
                      </a>
                    )}
                    {project.links?.demo && (
                      <a 
                        href={project.links.demo} 
                        target="_blank" 
                        rel="noreferrer"
                        className="project-link-icon"
                        title="View Live"
                      >
                        <FaExternalLinkAlt size={24} />
                      </a>
                    )}
                    {project.links?.youtube && (
                      <a 
                        href={project.links.youtube} 
                        target="_blank" 
                        rel="noreferrer"
                        className="project-link-icon"
                        title="Watch on YouTube"
                      >
                        <FaYoutube size={28} />
                      </a>
                    )}
                  </div>
                  <Badge bg="secondary" className="position-absolute top-0 end-0 m-3 fw-normal">
                    {project.category}
                  </Badge>
                </div>

                {/* Content Section */}
                <div className="project-content p-4">
                  <h5 className="fw-bold text-navy mb-2">{project.title}</h5>
                  <p className="text-muted small mb-3 flex-grow-1">{project.description}</p>

                  {/* Technologies */}
                  <div className="d-flex flex-wrap gap-2">
                    {project.technologies && project.technologies.map((tech, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="tech-badge">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>


        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted">No projects found in this category.</p>
          </div>
        )}

        {/* View All Projects Link */}
        <div className="text-center mt-5">
          <a href="/projects" className="btn btn-primary btn-lg px-4 shadow-sm" style={{ fontWeight: 500 }}>
            View all projects
          </a>
        </div>
        </div>
      </Container>

      <style jsx>{`
        .mobile-tooltip {
          padding: 0.75rem 1rem;
          background: rgba(102, 126, 234, 0.05);
          border-left: 3px solid #667eea;
          border-radius: 4px;
        }

        .project-card {
          border: 1px solid rgba(0, 31, 63, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          background: var(--section-bg);
        }

        .project-card:hover,
        .project-card.touched {
          border-color: rgba(0, 31, 63, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .project-image-wrapper {
          position: relative;
          height: 220px;
          background: #f5f5f5;
        }

        .project-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .project-card:hover .project-image,
        .project-card.touched .project-image {
          transform: scale(1.05);
        }

        .project-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(2px);
        }

        .project-card:hover .project-overlay,
        .project-card.touched .project-overlay {
          opacity: 1;
        }

        .project-link-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.3);
          text-decoration: none;
        }

        .project-link-icon:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
          transform: scale(1.1);
        }

        .project-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--section-bg);
        }

        .tech-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }

        [data-bs-theme="dark"] .project-card {
          background: #1a2d4d;
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-bs-theme="dark"] .project-card:hover,
        [data-bs-theme="dark"] .project-card.touched {
          border-color: rgba(255, 255, 255, 0.2);
        }

        [data-bs-theme="dark"] .tech-badge {
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgb(255, 255, 255) !important;
        }

        [data-bs-theme="dark"] .mobile-tooltip {
          background: rgba(102, 126, 234, 0.1);
        }
      `}</style>
    </section>
  );
};

export default PortfolioSection;
