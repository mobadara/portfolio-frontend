import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import './ResumePage.css';
import resumePdf from '../assets/resume.pdf';

const ResumePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="resume-page section-padding" style={{ backgroundColor: 'var(--navy-blue)' }}>
      <Container>
        <div className="section-shell resume-shell text-center">
          <div className="resume-page-header">
            <h1 className="badge-label">RESUME</h1>
            <p className="resume-page-copy">
              View the PDF directly here with the browser controls, then use the download button below if you want a copy.
            </p>
            <a href={resumePdf} download className="btn btn-primary resume-download-btn">
              <i className="bi bi-download me-2"></i>
              Download Resume
            </a>
          </div>

          <div className={`resume-frame ${isLoading ? 'is-loading' : ''}`}>
            {isLoading && (
              <div className="resume-loader" aria-live="polite" aria-busy="true">
                <div className="resume-loader-spinner" />
                <span>Loading resume preview...</span>
              </div>
            )}

            <iframe
              src={resumePdf}
              title="Muyiwa J. Obadara Resume"
              className="resume-iframe"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ResumePage;
