import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { BiBarChartAlt2, BiBrain, BiBookOpen, BiChip, BiCog, BiBriefcaseAlt2 } from 'react-icons/bi';

const SERVICES = [
  {
    title: 'Data Analysis',
    description: 'Transforming raw datasets into clear insights, KPI dashboards, and decision-ready reports.',
    Icon: BiBarChartAlt2
  },
  {
    title: 'ML Model Development',
    description: 'Designing, training, and evaluating machine learning models from prototype to production.',
    Icon: BiBrain
  },
  {
    title: 'Mentorship',
    description: 'Guiding learners and junior professionals through practical projects, tools, and best practices.',
    Icon: BiBookOpen
  },
  {
    title: 'AI Engineering',
    description: 'Building scalable AI APIs and systems with robust deployment and monitoring workflows.',
    Icon: BiChip
  },
  {
    title: 'Automation Specialist',
    description: 'Automating repetitive processes and workflows to increase speed, consistency, and reliability.',
    Icon: BiCog
  },
  {
    title: 'Educational/Career Consultant',
    description: 'Supporting career transitions, portfolio strategy, and learning roadmaps in data and AI.',
    Icon: BiBriefcaseAlt2
  }
];

const ServicesSection = () => (
  <section id="services" className="section-padding bg-navy text-white position-relative">
    <Container className="pt-3 pb-3">
      <div className="section-shell section-shell-inverse">
        <div className="text-center mb-4">
          <h2 className="fw-bold display-6">My Services</h2>
          <p className="text-light opacity-75 mb-0">Solutions tailored for teams, founders, and learners.</p>
        </div>

        <Row className="g-4">
          {SERVICES.map(({ title, description, Icon }) => ( 
            <Col lg={4} md={6} key={title}>
              <div className="p-4 h-100 border border-secondary rounded-3 hover-scale bg-opacity-10 bg-white transition">
                <Icon className="fs-1 text-warning mb-3 d-block" />
                <h4 className="fw-bold h5 mb-2">{title}</h4>
                <p className="text-light opacity-75 mb-0">{description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  </section>
);

export default ServicesSection;
