import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BiArrowBack, BiEdit, BiPlus, BiRefresh, BiTrash } from 'react-icons/bi';
import { ADMIN_ROUTES, buildAdminUrl, getStoredAdminToken, withAuthHeaders } from '../utils/adminApi';
import './AdminSkills.css';

const SKILLS_ENDPOINT = ADMIN_ROUTES.skills;

const emptySkillForm = {
  name: '',
  level: 75,
  category: '',
  icon: 'star',
  order: 0
};

function AdminSkills() {
  const navigate = useNavigate();
  const token = getStoredAdminToken();

  const [skills, setSkills] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState(emptySkillForm);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
    }
  }, [navigate, token]);

  const requestWithAuth = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(buildAdminUrl(endpoint), {
      ...options,
      headers: {
        ...withAuthHeaders(token),
        ...options.headers
      }
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `${response.status} ${response.statusText}`);
    }

    return data;
  }, [token]);

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const payload = await requestWithAuth(SKILLS_ENDPOINT);
      const list = Array.isArray(payload) ? payload : Array.isArray(payload?.skills) ? payload.skills : [];
      setSkills(list);
    } catch (err) {
      setError(err.message || 'Failed to load skills.');
    } finally {
      setIsLoading(false);
    }
  }, [requestWithAuth]);

  useEffect(() => {
    if (token) {
      loadSkills();
    }
  }, [loadSkills, token]);

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;

    return skills.filter((skill) =>
      [skill.name, skill.category, skill.icon, String(skill.level), String(skill.order)]
        .some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [query, skills]);

  const getItemId = (item) => item?.id || item?._id;

  const openCreateModal = () => {
    setEditingSkill(null);
    setFormData(emptySkillForm);
    setShowModal(true);
    setError('');
  };

  const openEditModal = (skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name || '',
      level: skill.level ?? 75,
      category: skill.category || '',
      icon: skill.icon || 'star',
      order: skill.order ?? 0
    });
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSkill(null);
    setFormData(emptySkillForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'level' || name === 'order' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    const payload = {
      name: String(formData.name || '').trim(),
      level: Number(formData.level),
      category: String(formData.category || '').trim(),
      icon: String(formData.icon || 'star').trim(),
      order: Number(formData.order) || 0
    };

    if (!payload.name || !payload.category) {
      setError('Name and category are required.');
      return;
    }

    if (payload.level < 0 || payload.level > 100) {
      setError('Level must be between 0 and 100.');
      return;
    }

    const skillId = getItemId(editingSkill);
    const endpoint = editingSkill ? `${SKILLS_ENDPOINT}/${skillId}` : SKILLS_ENDPOINT;
    const method = editingSkill ? 'PUT' : 'POST';

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await requestWithAuth(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      setSuccess(`Skill ${editingSkill ? 'updated' : 'created'} successfully.`);
      closeModal();
      await loadSkills();
    } catch (err) {
      setError(err.message || 'Unable to save skill.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const skillId = getItemId(skill);
    if (!skillId) return;

    const confirmed = window.confirm(`Delete skill "${skill.name}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await requestWithAuth(`${SKILLS_ENDPOINT}/${skillId}`, { method: 'DELETE' });
      setSuccess('Skill deleted successfully.');
      await loadSkills();
    } catch (err) {
      setError(err.message || 'Unable to delete skill.');
    }
  };

  return (
    <div className="admin-skills-page py-4">
      <Container fluid="xl">
        <Card className="admin-skills-shell border-0 shadow-sm">
          <Card.Body className="p-3 p-md-4">
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between mb-3">
              <div>
                <h3 className="mb-1 admin-skills-title">Skills Management</h3>
                <p className="mb-0 text-muted">Corporate profile control panel for skills database updates.</p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="outline-secondary" onClick={() => navigate('/admin/dashboard')}>
                  <BiArrowBack className="me-1" /> Back to Dashboard
                </Button>
                <Button variant="outline-primary" onClick={loadSkills}>
                  <BiRefresh className="me-1" /> Refresh
                </Button>
                <Button variant="primary" onClick={openCreateModal}>
                  <BiPlus className="me-1" /> Add Skill
                </Button>
              </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Row className="g-2 mb-3">
              <Col lg={6}>
                <Form.Control
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, category, level, icon or order"
                />
              </Col>
              <Col lg={6}>
                <div className="d-flex justify-content-lg-end align-items-center h-100">
                  <Badge bg="light" text="dark" className="px-3 py-2 border">
                    Total Skills: {skills.length}
                  </Badge>
                </div>
              </Col>
            </Row>

            <div className="table-responsive">
              <Table hover className="align-middle admin-skills-table mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Icon</th>
                    <th>Order</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <Spinner animation="border" size="sm" className="me-2" /> Loading skills...
                      </td>
                    </tr>
                  ) : filteredSkills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No skills found.
                      </td>
                    </tr>
                  ) : (
                    filteredSkills.map((skill) => (
                      <tr key={getItemId(skill) || `${skill.name}-${skill.category}`}>
                        <td className="fw-semibold">{skill.name}</td>
                        <td>{skill.category}</td>
                        <td>
                          <Badge bg={skill.level >= 90 ? 'success' : skill.level >= 75 ? 'primary' : 'secondary'}>
                            {skill.level}%
                          </Badge>
                        </td>
                        <td>{skill.icon}</td>
                        <td>{skill.order ?? 0}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => openEditModal(skill)}>
                              <BiEdit />
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(skill)}>
                              <BiTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingSkill ? 'Edit Skill' : 'Create Skill'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Python"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                placeholder="e.g. Programming Languages"
              />
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Level (0 - 100)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={100}
                    name="level"
                    value={formData.level}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label>Icon Key</Form.Label>
              <Form.Control
                name="icon"
                value={formData.icon}
                onChange={handleFormChange}
                placeholder="e.g. python"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            {editingSkill ? 'Save Changes' : 'Create Skill'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminSkills;
