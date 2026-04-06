import React from 'react';
import { GitHubCalendar } from 'react-github-calendar'; // Changed to default import
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Added CSS import

/**
 * Displays GitHub contribution activity with a calendar visualization.
 * * Renders either a full-page section or a modal view of GitHub contributions
 * depending on the `isModal` prop. Uses the GitHubCalendar component to display
 * a contribution graph for the specified GitHub user.
 * * @component
 * @param {Object} props - Component props
 * @param {string} props.theme - The current theme ('dark' or 'light') that determines the calendar color scheme
 * @param {boolean} [props.isModal=false] - If true, renders a modal/compact version; if false, renders a full section
 * @returns {JSX.Element} A React component displaying GitHub contributions
 * * @example
 * // Full page section view
 * <GithubActivity theme="light" />
 * * @example
 * // Modal view
 * <GithubActivity theme="dark" isModal={true} />
 */
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
                    renderBlock={(block, activity) => 
                      React.cloneElement(block, {
                        'data-tooltip-id': 'react-tooltip',
                        'data-tooltip-content': activity.count ? `${activity.count} contributions on ${activity.date}` : 'No contributions',
                        style: { ...block.props.style, cursor: 'pointer' }
                      })
                    }
                  />
                  <Tooltip id="react-tooltip" />
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}
      
      {isModal && (
        <div className="github-calendar-modal-scroll">
          <div style={{ paddingBottom: '1rem' }}>
            <p className="text-muted text-center">
              My daily commitment to shipping code.
            </p>
          </div>
          <div className="github-calendar-modal-inner">
            <GitHubCalendar 
              username="mobadara" 
              colorScheme={theme === 'dark' ? 'dark' : 'light'}
              blockSize={14}
              blockMargin={4}
              fontSize={14}
              showWeekdayLabels
              renderBlock={(block, activity) => 
                React.cloneElement(block, {
                  'data-tooltip-id': 'react-tooltip',
                  'data-tooltip-content': activity.count ? `${activity.count} contributions on ${activity.date}` : 'No contributions',
                  style: { ...block.props.style, cursor: 'pointer' }
                })
              }
            />
            <Tooltip id="react-tooltip" />
          </div>
        </div>
      )}
    </>
  );
};

export default GithubActivity;