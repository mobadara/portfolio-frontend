import { useEffect, useMemo, useState } from 'react';
import { FaExternalLinkAlt, FaGraduationCap, FaBookOpen, FaOrcid } from 'react-icons/fa';
import LoadingAnimation from '../components/LoadingAnimation';
import './PublicationsPage.css';

const MEDIUM_RSS_URL = import.meta?.env?.VITE_MEDIUM_RSS_URL || 'https://medium.com/feed/@mobadara';
const MEDIUM_PROFILE_URL = import.meta?.env?.VITE_MEDIUM_PROFILE_URL || 'https://medium.com/@mobadara';
const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/citations?hl=en&user=Jx9f5gcAAAAJ';
const ORCID_URL = 'https://orcid.org/0009-0008-3470-1610';
const SCHOLAR_USER_ID = new URLSearchParams(GOOGLE_SCHOLAR_URL.split('?')[1] || '').get('user') || '';
const PREVIEW_ITEMS = 6;
const SCHOLAR_MIN_LOADING_MS = 4500;

const formatDate = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 'Recent post';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const extractDescription = (value, maxLength = 180) => {
  if (!value) return '';
  const plainText = String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
};

const extractFirstImage = (item = {}) => {
  if (item.thumbnail) return item.thumbnail;

  const html = String(item.content || item.description || '');
  if (!html) return '';

  const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imageMatch?.[1] || '';
};

const normalizeMediumItem = (item = {}) => ({
  title: item.title || 'Untitled post',
  pubDate: item.pubDate || item.published || '',
  link: item.link || MEDIUM_PROFILE_URL,
  thumbnail: extractFirstImage(item),
  content: extractDescription(item.content || item.description || '', 190),
});

const normalizeScholarItem = (item = {}) => ({
  title: String(item.title || '').trim() || 'Untitled publication',
  venue: String(item.venue || '').trim() || 'Google Scholar',
  year: String(item.year || '').trim() || 'Recent',
  summary: String(item.summary || '').trim() || 'Open on Google Scholar to view details and citation data.',
  link: String(item.link || '').trim() || GOOGLE_SCHOLAR_URL,
});

const parseScholarPublications = (html = '') => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = Array.from(doc.querySelectorAll('#gsc_a_b .gsc_a_tr')).slice(0, 6);

  return rows
    .map((row) => {
      const titleAnchor = row.querySelector('.gsc_a_t .gsc_a_at');
      const metaRows = row.querySelectorAll('.gsc_a_t .gs_gray');
      const authors = metaRows[0]?.textContent?.trim() || '';
      const venue = metaRows[1]?.textContent?.trim() || 'Google Scholar';
      const year = row.querySelector('.gsc_a_y span')?.textContent?.trim() || 'Recent';
      const href = titleAnchor?.getAttribute('href') || '';
      const absoluteHref = href.startsWith('http')
        ? href
        : href
          ? `https://scholar.google.com${href}`
          : GOOGLE_SCHOLAR_URL;

      return normalizeScholarItem({
        title: titleAnchor?.textContent || '',
        venue,
        year,
        summary: authors ? `Authors: ${authors}` : '',
        link: absoluteHref,
      });
    })
    .filter((item) => item.title && item.title !== 'Untitled publication');
};

const PublicationsPage = () => {
  const [activeTab, setActiveTab] = useState('publications');
  const [scholarPublications, setScholarPublications] = useState([]);
  const [isLoadingScholar, setIsLoadingScholar] = useState(true);
  const [scholarError, setScholarError] = useState(false);
  const [mediumPosts, setMediumPosts] = useState([]);
  const [isLoadingMedium, setIsLoadingMedium] = useState(true);
  const [mediumError, setMediumError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const waitForMinimumLoading = async (startedAt) => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, SCHOLAR_MIN_LOADING_MS - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    };

    const loadScholarPublications = async () => {
      const startedAt = Date.now();
      setIsLoadingScholar(true);
      setScholarError(false);

      if (!SCHOLAR_USER_ID) {
        if (isMounted) {
          await waitForMinimumLoading(startedAt);
          setScholarError(true);
          setIsLoadingScholar(false);
        }
        return;
      }

      const scholarSource = `https://scholar.google.com/citations?hl=en&user=${SCHOLAR_USER_ID}&view_op=list_works&sortby=pubdate`;
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(scholarSource)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(scholarSource)}`,
      ];

      try {
        let html = '';

        for (const endpoint of proxies) {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) continue;

            if (endpoint.includes('/get?')) {
              const payload = await response.json();
              html = String(payload?.contents || '');
            } else {
              html = await response.text();
            }

            if (html.includes('gsc_a_tr')) {
              break;
            }
          } catch {
            html = '';
          }
        }

        const parsed = parseScholarPublications(html);
        if (!isMounted) return;
        
        if (parsed.length > 0) {
          setScholarPublications(parsed.slice(0, PREVIEW_ITEMS));
          await waitForMinimumLoading(startedAt);
          if (isMounted) setIsLoadingScholar(false);
        } else {
          await waitForMinimumLoading(startedAt);
          if (isMounted) {
            setScholarError(true);
            setIsLoadingScholar(false);
          }
        }
      } catch {
        if (!isMounted) return;
        await waitForMinimumLoading(startedAt);
        if (isMounted) {
          setScholarError(true);
          setIsLoadingScholar(false);
        }
      }
    };

    const loadMediumPosts = async () => {
      setIsLoadingMedium(true);
      setMediumError(false);
      try {
        const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(MEDIUM_RSS_URL)}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        const items = Array.isArray(data?.items)
          ? data.items
              .slice()
              .sort((a, b) => new Date(b.pubDate || b.published || 0) - new Date(a.pubDate || a.published || 0))
              .slice(0, PREVIEW_ITEMS)
              .map(normalizeMediumItem)
          : [];

        if (!isMounted) return;
        
        if (items.length > 0) {
          setMediumPosts(items);
        } else {
          setMediumError(true);
        }
      } catch {
        if (!isMounted) return;
        setMediumError(true);
      } finally {
        if (isMounted) setIsLoadingMedium(false);
      }
    };

    loadScholarPublications();
    loadMediumPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const mediumPreviewCards = useMemo(() => mediumPosts, [mediumPosts]);

  const scholarPreviewCards = useMemo(() => scholarPublications, [scholarPublications]);

  return (
    <section className="publications-page section-padding">
      <div className="container">
        <div className="publications-shell section-shell">
          <header className="publications-header">
            <p className="publications-kicker">Research & Writing</p>
            <h1 className="publications-title">Publications & Technical Writing</h1>
            <p className="publications-subtitle">
              Browse research publications and preview the latest Medium articles in one place.
            </p>

            <div className="publications-tab-bar" role="tablist" aria-label="Publication content tabs">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'publications'}
                className={`publications-tab-btn ${activeTab === 'publications' ? 'active' : ''}`}
                onClick={() => setActiveTab('publications')}
              >
                Publications
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'technical'}
                className={`publications-tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveTab('technical')}
              >
                Technical Writing
              </button>
            </div>
          </header>

          {activeTab === 'publications' ? (
            <>
              <div className="publications-actions">
                <a className="publications-primary-link" href={GOOGLE_SCHOLAR_URL} target="_blank" rel="noopener noreferrer">
                  <FaGraduationCap /> Visit Google Scholar
                </a>
              </div>

              {isLoadingScholar ? (
                <div className="publications-loading-container">
                  <LoadingAnimation isLoading={true} />
                </div>
              ) : scholarError || scholarPreviewCards.length === 0 ? (
                <div className="publications-error-container">
                  <p className="publications-error-message">Error loading articles</p>
                  <p className="publications-error-subtitle">
                    Unable to fetch articles from Google Scholar. 
                    <a href={GOOGLE_SCHOLAR_URL} target="_blank" rel="noopener noreferrer" className="publications-error-link">
                      {' '}Visit Google Scholar directly
                    </a>
                  </p>
                </div>
              ) : (
                <div className="publications-grid">
                  {scholarPreviewCards.map((item) => (
                    <article key={`${item.title}-${item.year}`} className="publication-card">
                      <div className="publication-meta">
                        <span>{item.venue}</span>
                        <span>{item.year}</span>
                      </div>
                      <h2>{item.title}</h2>
                      <p>{item.summary}</p>
                      <div className="publication-card-actions">
                        <a href={item.link || GOOGLE_SCHOLAR_URL} target="_blank" rel="noopener noreferrer" className="publication-card-button" aria-label={`View ${item.title} on Google Scholar`}>
                          <FaGraduationCap /> View on Google Scholar
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="publications-actions">
                <a className="publications-primary-link" href={MEDIUM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                  <FaBookOpen /> View all blogs on Medium
                </a>
              </div>

              {isLoadingMedium ? (
                <div className="publications-loading-container">
                  <LoadingAnimation isLoading={true} />
                </div>
              ) : mediumError || mediumPreviewCards.length === 0 ? (
                <div className="publications-error-container">
                  <p className="publications-error-message">Error loading articles</p>
                  <p className="publications-error-subtitle">
                    Unable to fetch posts from Medium. 
                    <a href={MEDIUM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="publications-error-link">
                      {' '}Visit Medium profile directly
                    </a>
                  </p>
                </div>
              ) : (
                <div className="publications-grid technical-writing-grid">
                  {mediumPreviewCards.map((post, idx) => (
                    <article key={`${post.link}-${idx}`} className="publication-card technical-card">
                      {post.thumbnail ? <img src={post.thumbnail} alt="Medium article" className="technical-thumbnail" loading="lazy" /> : null}
                      <div className="publication-meta">
                        <span>Medium</span>
                        <span>{formatDate(post.pubDate)}</span>
                      </div>
                      <h2>{post.title}</h2>
                      <p>{post.content || 'Read this latest technical writing piece on Medium.'}</p>
                      <div className="publication-card-actions">
                        <a href={post.link || MEDIUM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="publication-card-button">
                          <FaExternalLinkAlt /> Read on Medium
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="publications-profile-links publications-profile-links-bottom">
            <a className="publications-profile-link" href={ORCID_URL} target="_blank" rel="noopener noreferrer">
              <FaOrcid /> ORCID
            </a>
            <a className="publications-profile-link" href={MEDIUM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
              <FaBookOpen /> Medium
            </a>
            <a className="publications-profile-link" href={GOOGLE_SCHOLAR_URL} target="_blank" rel="noopener noreferrer">
              <FaGraduationCap /> Google Scholar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicationsPage;
