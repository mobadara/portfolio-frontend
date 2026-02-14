import { GitHubCalendar } from 'react-github-calendar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const GithubActivity = ({ theme, isModal = false }) => {
  return (
    <>
      {!isModal && (
        <section className="py-5" style={{ backgroundColor: 'var(--body-bg)' }}>
          <Container>
            <div className="text-center mb-4">
              <h5 className="text-warning fw-bold">CODE CONSISTENCY</h5>
              <h2 className="fw-bold mb-3" style={{ color: 'var(--navy-blue)' }}>
                <i className="bi bi-github me-2"></i> GitHub Contributions
              </h2>
              <p className="text-muted">
                My daily commitment to shipping code.
              </p>
            </div>

            <Row className="justify-content-center">
              <Col lg={10} className="d-flex justify-content-center">
                <div className="border p-4 rounded-3 shadow-sm bg-white" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <GitHubCalendar 
                    username="mobadara" 
                    colorScheme={theme === 'dark' ? 'dark' : 'light'}
                    blockSize={14}
                    blockMargin={4}
                    fontSize={14}
                    showWeekdayLabels
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}
      
      {isModal && (
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <div style={{ paddingBottom: '1rem' }}>
            <p className="text-muted text-center">
              My daily commitment to shipping code.
            </p>
          </div>
          <GitHubCalendar 
            username="mobadara" 
            colorScheme={theme === 'dark' ? 'dark' : 'light'}
            blockSize={14}
            blockMargin={4}
            fontSize={14}
            showWeekdayLabels
          />
        </div>
      )}
    </>
  );
};

export default GithubActivity;