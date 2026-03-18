import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AdminContent.css';

/**
 * AdminContent - Content management system for portfolio sections
 * Allows editing and updating portfolio content dynamically
 */
function AdminContent() {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', section: '', description: '' });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Fetch content from backend
    const fetchContent = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual backend API call
        // const response = await fetch('/admin/content', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });

        // Mock data for development
        setContent([
          { id: 1, section: 'Hero', title: 'Welcome to Portfolio', description: 'Main hero section headline' },
          { id: 2, section: 'About', title: 'About Me', description: 'Biography and professional summary' },
          { id: 3, section: 'Skills', title: 'Technical Skills', description: 'List of technical competencies' },
          { id: 4, section: 'Portfolio', title: 'Featured Projects', description: 'Showcase of completed projects' },
          { id: 5, section: 'Services', title: 'Services Offered', description: 'Professional services and offerings' }
        ]);
        setLoading(false);
      } catch (err) {
        setError('Failed to load content');
        setLoading(false);
      }
    };

    fetchContent();
  }, [navigate]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      section: item.section,
      description: item.description
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', section: '', description: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // TODO: Send to backend API
      if (editingItem) {
        setContent(content.map(item =>
          item.id === editingItem.id
            ? { ...item, ...formData }
            : item
        ));
      } else {
        setContent([...content, { id: Date.now(), ...formData }]);
      }
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to save content');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        // TODO: Send delete request to backend
        setContent(content.filter(item => item.id !== id));
        setError(null);
      } catch (err) {
        setError('Failed to delete content');
      }
    }
  };

  if (loading) {
    return (
      <Container className="admin-content py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-content py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Content Management</h1>
          <p className="text-muted">Edit and manage portfolio content</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg"></i> Add Content
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Content List */}
      <Row>
        <Col>
          <Card className="content-card">
            <Card.Header>
              <Card.Title className="mb-0">Portfolio Content</Card.Title>
            </Card.Header>
            <ListGroup variant="flush">
              {content.map((item) => (
                <ListGroup.Item key={item.id} className="content-item">
                  <Row className="align-items-center">
                    <Col md={3}>
                      <div className="section-badge">{item.section}</div>
                    </Col>
                    <Col md={5}>
                      <div>
                        <h6 className="mb-1">{item.title}</h6>
                        <small className="text-muted">{item.description}</small>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(item)}
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Edit/Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Content' : 'Add New Content'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Section</Form.Label>
              <Form.Select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              >
                <option value="">Select a section...</option>
                <option value="Hero">Hero</option>
                <option value="About">About</option>
                <option value="Skills">Skills</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Services">Services</option>
                <option value="Blog">Blog</option>
                <option value="Contact">Contact</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Content title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Content description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="mt-4">
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminContent;
