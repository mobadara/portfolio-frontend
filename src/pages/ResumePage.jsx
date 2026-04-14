import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import './ResumePage.css';
import { ADMIN_ROUTES, buildAdminUrl } from '../utils/adminApi';

const ResumePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState('');
  const [isResumeAvailable, setIsResumeAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resolveAssetUrl = (url = '') => {
      const normalized = String(url || '').trim();
      if (!normalized) return '';
      if (/^https?:\/\//i.test(normalized)) return normalized;
      return buildAdminUrl(normalized.startsWith('/') ? normalized : `/${normalized}`);
    };

    const loadResume = async () => {
      try {
        const response = await fetch(buildAdminUrl(ADMIN_ROUTES.resumeAsset));

        if (response.status === 404) {
          if (!isMounted) return;
          setResumeUrl('');
          setIsResumeAvailable(false);
          setIsLoading(false);
          return;
        }

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (!isMounted) return;
          setResumeUrl('');
          setIsResumeAvailable(false);
          setIsLoading(false);
          return;
        }

        const resolvedUrl = resolveAssetUrl(data?.url);
        if (!isMounted) return;
        setResumeUrl(resolvedUrl);
        setIsResumeAvailable(Boolean(resolvedUrl));
        setIsLoading(Boolean(resolvedUrl));
      } catch {
        if (!isMounted) return;
        setResumeUrl('');
        setIsResumeAvailable(false);
        setIsLoading(false);
      }
    };

    loadResume();

    return () => {
      isMounted = false;
    };
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
            {isResumeAvailable ? (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary resume-download-btn">
                <i className="bi bi-download me-2"></i>
                Download Resume
              </a>
            ) : (
              <button type="button" className="btn btn-secondary resume-download-btn" disabled>
                <i className="bi bi-file-earmark-x me-2"></i>
                Resume not Available
              </button>
            )}
          </div>

          {isResumeAvailable ? (
            <div className={`resume-frame ${isLoading ? 'is-loading' : ''}`}>
              {isLoading && (
                <div className="resume-loader" aria-live="polite" aria-busy="true">
                  <div className="resume-loader-spinner" />
                  <span>Loading resume preview...</span>
                </div>
              )}

              <iframe
                src={resumeUrl}
                title="Muyiwa J. Obadara Resume"
                className="resume-iframe"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          ) : (
            <div className="resume-frame resume-frame-empty d-flex flex-column align-items-center justify-content-center">
              <i className="bi bi-file-earmark-x resume-empty-icon" aria-hidden="true"></i>
              <h5 className="mb-2">Resume not uploaded yet</h5>
              <p className="mb-0">Please upload a resume from the Admin Dashboard.</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ResumePage;
