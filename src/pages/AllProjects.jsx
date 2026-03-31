
import React, { useState } from 'react';
// import NavigationBar from '../components/NavigationBar';
// import FooterSection from '../components/FooterSection';
import Badge from 'react-bootstrap/Badge';
import { FaGithub, FaExternalLinkAlt, FaYoutube } from 'react-icons/fa';
import '../App.css';


const AllProjects = ({ projects = [] }) => {
  const [touchedCard, setTouchedCard] = useState(null);
  const handleCardTouchStart = (projectId) => {
    setTouchedCard(projectId);
  };
  // const handleInternalLinkClick = (e, href) => {
  //   if (setRouteLoading && href && href.startsWith('/')) {
  //     setRouteLoading(true);
  //   }
  // };
  return (
    <>
      {/* <NavigationBar theme={theme} onToggleTheme={onToggleTheme} /> */}
      <main className="bg-navy text-white" style={{ minHeight: '100vh', width: '100%', paddingTop: '90px' }}>
        <div className="container py-5" style={{ background: 'transparent' }}>
          <h2 className="mb-4 fw-bold text-center" style={{ background: 'transparent' }}>All Projects</h2>
          <div className="row g-4">
            {projects.map((project, idx) => (
              <div className="col-md-6 col-lg-4 mb-2 d-flex" key={project._id || idx}>
                <div
                  className={`project-card h-100 flex-fill d-flex flex-column ${touchedCard === project._id ? 'touched' : ''}`}
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
                  <div className="project-content p-4 d-flex flex-column flex-grow-1">
                    <h5 className="fw-bold text-navy mb-2">{project.title}</h5>
                    <p className="text-muted small mb-3 flex-grow-1">{project.description}</p>
                    {/* Technologies */}
                    <div className="d-flex flex-wrap gap-2 mt-auto">
                      {project.technologies && project.technologies.map((tech, i) => (
                        <Badge key={i} bg="light" text="dark" className="tech-badge">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        {projects.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted">No projects found.</p>
          </div>
        )}
        </div>
      </main>
      {/* <FooterSection /> */}

      {/* Portfolio Card Styles */}
      <style jsx>{`
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
          box-shadow: 0 12px 32px 0 rgba(0, 31, 63, 0.22), 0 2px 8px 0 rgba(0,0,0,0.10);
          transform: translateY(-8px);
          z-index: 2;
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
      `}</style>
    </>
  );
};

export default AllProjects;
