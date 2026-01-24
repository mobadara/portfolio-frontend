import { useMemo, useState } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { FaGithub } from 'react-icons/fa';

const categories = ['All', 'Deep Learning', 'Data Science', 'AI Engineering', 'Visualization'];

const PortfolioSection = ({ projects = [] }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProjects = useMemo(
    () => projects.filter(project => activeCategory === 'All' || project.category === activeCategory),
    [activeCategory, projects]
  );

  return (
    <section id="portfolio" className="mt-5 section-padding">
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold display-6 text-navy">Featured Projects</h2>
        </div>

        <div className="d-flex justify-content-center flex-wrap gap-2 mb-5">
          {categories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'primary' : 'outline-primary'}
              className={`rounded-pill px-4 ${activeCategory === category ? 'bg-navy border-navy' : 'text-navy border-navy'}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <Row>
          {filteredProjects.map((project, index) => (
            <Col md={4} className="mb-4" key={`${project.title}-${index}`}>
              <Card className="h-100 shadow-sm border-0 card-custom">
                <div className="position-relative overflow-hidden">
                  <Card.Img variant="top" src={project.image} style={{ height: '200px', objectFit: 'cover' }} />
                  <div className="position-absolute top-0 end-0 m-2">
                    <Badge bg="warning" text="dark" className="fw-bold">{project.category}</Badge>
                  </div>
                </div>

                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold text-navy">{project.title}</Card.Title>
                  <Card.Text className="text-muted small flex-grow-1">{project.description}</Card.Text>

                  <div className="mb-3">
                    {project.tech.map((tech, techIndex) => (
                      <Badge bg="light" text="dark" className="me-1 border" key={`${tech}-${techIndex}`}>
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="d-flex gap-2">
                    <Button variant="outline-dark" size="sm" className="w-100" href={project.github} target="_blank" rel="noreferrer">
                      <FaGithub className="me-2" /> Code
                    </Button>
                    {project.demo && (
                      <Button variant="primary" size="sm" className="w-100 bg-navy border-navy" href={project.demo} target="_blank" rel="noreferrer">
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
  );
};

export default PortfolioSection;
