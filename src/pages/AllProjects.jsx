import React from 'react';
import NavigationBar from '../components/NavigationBar';
import FooterSection from '../components/FooterSection';
import Badge from 'react-bootstrap/Badge';
import { FaGithub, FaExternalLinkAlt, FaYoutube } from 'react-icons/fa';
import '../App.css';

const AllProjects = ({ projects = [] }) => {
  return (
    <>
      <NavigationBar />
      <div className="container py-5" style={{ minHeight: '60vh' }}>
        <h2 className="mb-4 fw-bold text-center">All Projects</h2>
        <div className="row g-4">
          {projects.map((project, idx) => (
            <div className="col-md-6 col-lg-4 d-flex" key={project._id || idx}>
              <div className="project-card flex-fill shadow-sm h-100 d-flex flex-column" style={{ background: 'var(--section-bg, #fff)', color: 'var(--text-main, #212529)' }}>
                <div className="project-image-wrapper position-relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="project-image"
                    style={{ width: '100%', height: '220px', objectFit: 'cover', background: '#f5f5f5' }}
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
                <div className="project-content p-4 d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold text-navy mb-2">{project.title}</h5>
                  <p className="text-muted small mb-3 flex-grow-1">{project.description}</p>
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
      <FooterSection />
    </>
  );
};

export default AllProjects;
