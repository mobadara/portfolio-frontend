import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';

const AIPlayground = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- MOCK BACKEND LOGIC (Replace with FastAPI call later) ---
  const analyzeSentiment = () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);

    // Simulate API delay
    setTimeout(() => {
      const text = input.toLowerCase();
      let label = "Neutral";
      let variant = "secondary";
      let score = 50;

      // Simple keyword logic for demonstration
      if (text.match(/rise|growth|surge|bull|profit|gain|record|high|success/)) {
        label = "Bullish (Positive)";
        variant = "success";
        score = 85 + Math.floor(Math.random() * 14); // Random 85-99%
      } else if (text.match(/fall|drop|crash|bear|loss|debt|crisis|risk|inflation|fail/)) {
        label = "Bearish (Negative)";
        variant = "danger";
        score = 90 + Math.floor(Math.random() * 9); // Random 90-99%
      } else {
        score = 45 + Math.floor(Math.random() * 10); // Random 45-55%
      }

      setResult({ label, variant, score });
      setLoading(false);
    }, 1500);
  };

  return (
    <section className="py-5 section-padding bg-light border-top border-bottom">
      <Container>
        <div className="text-center mb-5 py -3">
            <h2 className="fw-bold display-6 text-navy">Live Model Demo</h2>
            <p className="text-muted">
                Test a distilled version of my Financial Sentiment Analysis model.
                <br />
                <span className="small opacity-75">(Currently running in client-side simulation mode)</span>
            </p>
        </div>

        <Row className="justify-content-center">
          <Col md={8} lg={7}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <Card.Header className="bg-navy text-white p-3 d-flex align-items-center">
                <i className="bi bi-robot fs-4 me-2 text-warning"></i>
                <span className="fw-bold">FinBERT Sentiment Analyzer</span>
              </Card.Header>
              
              <Card.Body className="p-4 bg-white">
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-muted small">ENTER FINANCIAL NEWS HEADLINE</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="e.g., 'Tesla shares surge as quarterly profits exceed expectations.'"
                    className="bg-light border-0 p-3"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </Form.Group>

                <div className="d-grid mb-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="bg-navy border-navy fw-bold"
                    onClick={analyzeSentiment}
                    disabled={loading || !input}
                  >
                    {loading ? (
                        <>
                           <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                           Processing with PyTorch...
                        </>
                    ) : (
                        <>Analyze Sentiment <i className="bi bi-lightning-charge-fill ms-2 text-warning"></i></>
                    )}
                  </Button>
                </div>

                {/* RESULTS AREA */}
                {result && (
                  <div className="animate-fade-up bg-light p-3 rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-bold">PREDICTED SENTIMENT</span>
                        <Badge bg={result.variant} className="px-3 py-2 fs-6">{result.label}</Badge>
                    </div>
                    
                    <div className="mb-1 d-flex justify-content-between small">
                        <span>Confidence Score</span>
                        <span className="fw-bold">{result.score}%</span>
                    </div>
                    <ProgressBar 
                        variant={result.variant} 
                        now={result.score} 
                        style={{ height: '8px', borderRadius: '4px' }} 
                        animated 
                    />
                    
                    <div className="mt-3 pt-3 border-top small text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Backend architecture: <strong>FastAPI</strong> receiving JSON payload -&gt; <strong>Hugging Face Transformer</strong> -&gt; JSON Response.
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default AIPlayground;