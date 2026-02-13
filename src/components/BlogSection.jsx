import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { SiMedium } from 'react-icons/si';

const BlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMediumPosts();
  }, []);

  const fetchMediumPosts = async () => {
    try {
      // Using RSS2JSON API to convert Medium RSS feed to JSON and handle CORS
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@mobadara'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();
      
      if (data.status === 'ok') {
        // Get latest 3 posts
        const latestPosts = data.items.slice(0, 3).map(post => ({
          title: post.title,
          link: post.link,
          pubDate: new Date(post.pubDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          description: stripHtml(post.description).substring(0, 150) + '...',
          thumbnail: extractThumbnail(post.description, post.thumbnail),
          author: post.author,
          categories: post.categories || []
        }));
        
        setPosts(latestPosts);
      } else {
        throw new Error('Invalid response from RSS feed');
      }
    } catch (err) {
      console.error('Error fetching Medium posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Strip HTML tags from description
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Extract thumbnail from content or use provided thumbnail
  const extractThumbnail = (description, fallbackThumbnail) => {
    // Try to extract image from description
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = description.match(imgRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return fallbackThumbnail || 'https://via.placeholder.com/400x200?text=Blog+Post';
  };

  return (
    <section id="blog" className="py-5 bg-light border-top border-bottom">
      <Container>
        <div className="text-center mb-5">
          <SiMedium className="display-3 mb-3" style={{ color: '#000' }} />
          <h2 className="fw-bold text-navy mb-3">Latest from My Blog</h2>
          <p className="text-muted fs-5 mb-4">
            Insights on <strong>AI Engineering</strong>, <strong>Data Science</strong>, and <strong>Tech Innovation</strong>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="text-muted mt-3">Fetching latest posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <p className="text-danger mb-3">Unable to load blog posts at the moment.</p>
            <Button
              variant="primary"
              href="https://mobadara.medium.com"
              target="_blank"
              rel="noreferrer"
            >
              Visit My Medium Blog
            </Button>
          </div>
        ) : (
          <>
            <Row className="g-4 mb-4">
              {posts.map((post, index) => (
                <Col key={index} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0 blog-card">
                    <div className="blog-card-img-wrapper">
                      <Card.Img
                        variant="top"
                        src={post.thumbnail}
                        alt={post.title}
                        className="blog-card-img"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200?text=Blog+Post';
                        }}
                      />
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          {post.pubDate}
                        </small>
                      </div>
                      <Card.Title className="fw-bold text-navy mb-3">
                        {post.title}
                      </Card.Title>
                      <Card.Text className="text-muted flex-grow-1">
                        {post.description}
                      </Card.Text>
                      {post.categories.length > 0 && (
                        <div className="mb-3">
                          {post.categories.slice(0, 2).map((category, idx) => (
                            <span
                              key={idx}
                              className="badge bg-secondary me-2"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline-primary"
                        href={post.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto"
                      >
                        Read More <i className="bi bi-arrow-right ms-2"></i>
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="text-center mt-4">
              <Button
                variant="dark"
                size="lg"
                href="https://mobadara.medium.com"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 fw-bold shadow"
              >
                <SiMedium className="me-2" />
                View All Articles on Medium
                <i className="bi bi-arrow-right-short ms-2 fs-4 align-middle"></i>
              </Button>
              <p className="small text-muted mt-3">
                Join thousands of readers following my tech journey
              </p>
            </div>
          </>
        )}
      </Container>

      <style jsx>{`
        .blog-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }

        .blog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
        }

        .blog-card-img-wrapper {
          overflow: hidden;
          height: 200px;
          background: #f8f9fa;
        }

        .blog-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .blog-card:hover .blog-card-img {
          transform: scale(1.05);
        }

        .blog-card .card-title {
          font-size: 1.1rem;
          line-height: 1.4;
          max-height: 2.8rem;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .blog-card .card-text {
          font-size: 0.9rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .blog-card-img-wrapper {
            height: 180px;
          }
        }
      `}</style>
    </section>
  );
};

export default BlogSection;
