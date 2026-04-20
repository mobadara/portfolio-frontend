import { useEffect, useMemo, useState } from 'react';
import { FaExternalLinkAlt, FaGraduationCap, FaBookOpen, FaOrcid } from 'react-icons/fa';
import './PublicationsPage.css';

const MEDIUM_RSS_URL = import.meta?.env?.VITE_MEDIUM_RSS_URL || 'https://medium.com/feed/@mobadara';
const MEDIUM_PROFILE_URL = import.meta?.env?.VITE_MEDIUM_PROFILE_URL || 'https://medium.com/@mobadara';
const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/citations?hl=en&user=Jx9f5gcAAAAJ';
const ORCID_URL = 'https://orcid.org/0009-0008-3470-1610';
const SCHOLAR_USER_ID = new URLSearchParams(GOOGLE_SCHOLAR_URL.split('?')[1] || '').get('user') || '';
const PREVIEW_ITEMS = 6;

const fallbackScholarPublications = [
  {
    title: 'Designing Explainable AI Pipelines for Production Teams',
    venue: 'AI Engineering Review',
    year: '2025',
    summary: 'A practical framework for explainability checkpoints across model development, deployment, and monitoring.',
    link: '#',
  },
  {
    title: 'From Notebook to API: Operationalizing ML for Real Business Outcomes',
    venue: 'Data Product Journal',
    year: '2024',
    summary: 'Patterns and anti-patterns for shipping machine learning systems that survive beyond proof-of-concept.',
    link: '#',
  },
  {
    title: 'Human-Centered AI Mentorship in Technical Teams',
    venue: 'Applied Leadership in Tech',
    year: '2023',
    summary: 'How mentorship structures can improve AI adoption, developer confidence, and delivery quality.',
    link: '#',
  },
  {
    title: 'Responsible AI Evaluation for Product Teams',
    venue: 'AI Governance Digest',
    year: '2023',
    summary: 'A lightweight evaluation rubric for fairness, explainability, and reliability before production release.',
    link: '#',
  },
  {
    title: 'Design Patterns for Data-Centric Machine Learning',
    venue: 'Modern ML Systems',
    year: '2022',
    summary: 'How data contracts, drift checks, and annotation loops improve long-term model performance.',
    link: '#',
  },
  {
    title: 'Operational Analytics for AI Product Decisions',
    venue: 'Engineering Analytics Quarterly',
    year: '2022',
    summary: 'Connecting product metrics and model behavior to guide roadmap prioritization and ROI.',
    link: '#',
  },
];

const fallbackMediumPosts = [
  {
    title: 'Building Reliable AI Products from Prototype to Production',
    pubDate: '2025-01-10T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'A practical breakdown of moving AI systems from prototype to stable production with testing and observability.',
  },
  {
    title: 'Practical MLOps for Fast-Moving Teams',
    pubDate: '2024-11-02T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'Delivery patterns for teams shipping machine learning models with dependable versioning, CI/CD, and governance.',
  },
  {
    title: 'Mentoring Engineers into AI Builders',
    pubDate: '2024-09-22T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'Frameworks for coaching engineers to think in AI product loops and deliver measurable value.',
  },
  {
    title: 'How to Design Prompts That Survive Production',
    pubDate: '2024-08-14T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'A practical checklist for prompt versioning, safety guardrails, and regression testing in live apps.',
  },
  {
    title: 'Building Dashboards for Model Reliability',
    pubDate: '2024-07-01T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'What to measure after deployment to catch drift early and keep stakeholders confident in AI outputs.',
  },
  {
    title: 'Teaching AI Fundamentals to Non-ML Teams',
    pubDate: '2024-05-19T00:00:00.000Z',
    link: MEDIUM_PROFILE_URL,
    thumbnail: '',
    content: 'A communication framework that helps cross-functional teams collaborate effectively on AI features.',
  },
];

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
  const [mediumPosts, setMediumPosts] = useState([]);
  const [isLoadingMedium, setIsLoadingMedium] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadScholarPublications = async () => {
      setIsLoadingScholar(true);

      if (!SCHOLAR_USER_ID) {
        if (isMounted) {
          setScholarPublications(fallbackScholarPublications.map(normalizeScholarItem));
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
        setScholarPublications(parsed.length ? parsed.slice(0, PREVIEW_ITEMS) : fallbackScholarPublications.map(normalizeScholarItem));
      } catch {
        if (!isMounted) return;
        setScholarPublications(fallbackScholarPublications.map(normalizeScholarItem));
      } finally {
        if (isMounted) setIsLoadingScholar(false);
      }
    };

    const loadMediumPosts = async () => {
      setIsLoadingMedium(true);
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
        setMediumPosts(items.length ? items : fallbackMediumPosts.map(normalizeMediumItem));
      } catch {
        if (!isMounted) return;
        setMediumPosts(fallbackMediumPosts.map(normalizeMediumItem));
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

  const mediumPreviewCards = useMemo(() => {
    const source = mediumPosts.length ? mediumPosts : fallbackMediumPosts.map(normalizeMediumItem);
    return source.slice(0, PREVIEW_ITEMS);
  }, [mediumPosts]);

  const scholarPreviewCards = useMemo(() => {
    const source = scholarPublications.length
      ? scholarPublications
      : fallbackScholarPublications.map(normalizeScholarItem);
    return source.slice(0, PREVIEW_ITEMS);
  }, [scholarPublications]);

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
                <div className="technical-writing-loading">Loading latest Google Scholar publications...</div>
              ) : null}

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
            </>
          ) : (
            <>
              <div className="publications-actions">
                <a className="publications-primary-link" href={MEDIUM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                  <FaBookOpen /> View all blogs on Medium
                </a>
              </div>

              {isLoadingMedium ? (
                <div className="technical-writing-loading">Loading latest Medium posts...</div>
              ) : null}

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
