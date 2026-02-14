import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { skillsData } from '../data/skills';
import GithubActivity from './GithubActivity';

const AboutSection = ({ theme }) => (
  <section id="about" className="py-5 section-padding" style={{ backgroundColor: 'var(--body-bg)' }}>
    <Container>
      <Row className="align-items-start">
        <Col md={5} className="mb-5 mb-md-0">
          <h2 className="fw-bold mb-3 display-6" style={{ color: 'var(--navy-blue)' }}>
            The intersection of Math, Code & Harmony
          </h2>

          <p className="text-muted mb-4">
            I'm a <strong>Data Scientist</strong> and <strong>AI Engineer</strong> building intelligent systems at the intersection of 
            mathematics, machine learning, and software engineering. With a physics background and deep expertise in MLOps, I transform 
            complex problems into scalable, production-grade solutions. I specialize in designing end-to-end AI pipelines—from model 
            development to cloud deployment—and automating workflows with cutting-edge LLMs and AI technologies.
          </p>
          <div className="profile-img-container">
            <img
              src="https://placehold.co/400x500/001f3f/FFF?text=MO"
              alt="Muyiwa J. Obadara"
              className="profile-img"
            />
            <div className="profile-img-bg"></div>
          </div>
          <Row className="g-4 mb-5 mt-3 justify-content-center">
            {[{ num: '02+', lbl: 'Years Exp.', delay: '0s' }, { num: '10+', lbl: 'Projects', delay: '0.5s' }, { num: '05', lbl: 'Certifications', delay: '1s' }].map((item, index) => (
              <Col sm={4} key={index} className="d-flex justify-content-center">
                <div className="metric-circle-container">
                  <svg className="metric-svg" viewBox="0 0 120 120">
                    <circle className="metric-track" cx="60" cy="60" r="54" />
                    <circle className="metric-spinner" cx="60" cy="60" r="54" style={{ animationDelay: item.delay }} />
                  </svg>
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

        </Col>

        <Col md={7}>
          

          

          
          <h6 className="fw-bold mb-3" style={{ color: 'var(--navy-blue)' }}>
            TECHNICAL SKILLS
          </h6>

          <div className="mb-4">
            <Row className="g-4">
              {Array.from(
                skillsData.reduce((map, skill) => {
                  if (!map.has(skill.category)) {
                    map.set(skill.category, []);
                  }
                  map.get(skill.category).push(skill);
                  return map;
                }, new Map())
              ).map(([category, skills]) => (
                <Col key={category} md={6}>
                  <div className="h-100">
                    <p className="text-muted fw-bold mb-3">{category}</p>
                    {skills.map((skill, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-500">{skill.name}</span>
                          <small className="text-muted">{skill.level}%</small>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${skill.level}%`,
                              backgroundColor: 'var(--navy-blue)'
                            }}
                            aria-valuenow={skill.level}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <div className="justify-content-center d-flex align-items-center gap-3">
            <Button
              variant="primary"
              className="bg-navy border-navy px-4 fw-bold"
              href="/resume.pdf"
              target="_blank"
            >
              Download CV <i className="bi bi-download ms-2"></i>
            </Button>
          </div>
          <GithubActivity theme={theme}/>
        </Col>
      </Row>
    </Container>
  </section>
);

export default AboutSection;
