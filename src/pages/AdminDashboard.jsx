import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Nav,
  Row,
  Spinner,
  Tab,
  Table
} from 'react-bootstrap';
import {
  BiEnvelope,
  BiFolder,
  BiLogOut,
  BiPlus,
  BiRefresh,
  BiSearch,
  BiShield,
  BiTrash,
  BiUser,
  BiUserCheck
} from 'react-icons/bi';
import './AdminDashboard.css';

const ADMIN_API_BASE = (import.meta?.env?.VITE_CHAT_API_BASE || 'https://portfolio-backend-tjq3.onrender.com').replace(/\/$/, '');
const USERS_ENDPOINT = import.meta?.env?.VITE_ADMIN_USERS_ENDPOINT || '/admin/users';
const MESSAGES_ENDPOINT = import.meta?.env?.VITE_ADMIN_MESSAGES_ENDPOINT || '/admin/contact-messages';
const MESSAGES_CREATE_PUBLIC_ENDPOINT = import.meta?.env?.VITE_CONTACT_CREATE_ENDPOINT || '/contact';
const PROJECTS_ENDPOINT = import.meta?.env?.VITE_ADMIN_PROJECTS_ENDPOINT || '/admin/projects';

const emptyForms = {
  user: { username: '', email: '', role: 'assistant', password: '' },
  message: { name: '', email: '', subject: '', message: '', status: 'new' },
  project: { title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', featured: false }
};

const getAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem('adminUser') || '{}');
  } catch {
    return {};
  }
};

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const authUser = getAuthUser();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForms.message);
  const [isSaving, setIsSaving] = useState(false);

  const currentRole = String(authUser?.role || 'assistant').toLowerCase();
  const canManageMessages = true;
  const canManageUsersAndProjects = ['owner', 'admin', 'superadmin'].includes(currentRole);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    setIsBootstrapping(false);
  }, [navigate, token]);

  const requestWithAuth = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `${response.status} ${response.statusText}`);
    }

    return data;
  }, [token]);

  const normalizeList = (data, preferredKey) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[preferredKey])) return data[preferredKey];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersRes, messagesRes, projectsRes] = await Promise.all([
        canManageUsersAndProjects ? requestWithAuth(USERS_ENDPOINT) : Promise.resolve([]),
        requestWithAuth(MESSAGES_ENDPOINT),
        canManageUsersAndProjects ? requestWithAuth(PROJECTS_ENDPOINT) : Promise.resolve([])
      ]);

      setUsers(normalizeList(usersRes, 'users'));
      setMessages(normalizeList(messagesRes, 'messages'));
      setProjects(normalizeList(projectsRes, 'projects'));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [canManageUsersAndProjects, requestWithAuth]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadDashboardData();
    }
  }, [isBootstrapping, loadDashboardData]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((item) =>
      [item.username, item.email, item.role].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [query, users]);

  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((item) =>
      [item.name, item.email, item.subject, item.message, item.status].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [messages, query]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((item) =>
      [item.title, item.description, item.techStack].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [projects, query]);

  const openCreateModal = (type) => {
    setModalType(type);
    setEditingItem(null);
    setFormData(emptyForms[type]);
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({
      ...emptyForms[type],
      ...item,
      techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(emptyForms.message);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getItemId = (item) => item.id || item._id || item.userId || item.messageId || item.projectId;

  const createMessagePublic = async (payload) => {
    const response = await fetch(`${ADMIN_API_BASE}${MESSAGES_CREATE_PUBLIC_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to create contact message.');
    }

    return data;
  };

  const handleSave = async () => {
    const isEdit = Boolean(editingItem);
    const itemId = getItemId(editingItem || {});

    let endpoint = '';
    let method = isEdit ? 'PUT' : 'POST';
    let payload = { ...formData };

    if (modalType === 'project') {
      payload = {
        ...payload,
        techStack: String(payload.techStack || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      };
      endpoint = isEdit ? `${PROJECTS_ENDPOINT}/${itemId}` : PROJECTS_ENDPOINT;
    } else if (modalType === 'user') {
      endpoint = isEdit ? `${USERS_ENDPOINT}/${itemId}` : USERS_ENDPOINT;
      if (isEdit && !payload.password) {
        delete payload.password;
      }
    } else {
      endpoint = isEdit ? `${MESSAGES_ENDPOINT}/${itemId}` : MESSAGES_ENDPOINT;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (modalType === 'message' && !isEdit) {
        await createMessagePublic(payload);
      } else {
        await requestWithAuth(endpoint, {
          method,
          body: JSON.stringify(payload)
        });
      }

      setSuccess(`${modalType[0].toUpperCase()}${modalType.slice(1)} ${isEdit ? 'updated' : 'created'} successfully.`);
      closeModal();
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Unable to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type, item) => {
    const itemId = getItemId(item);
    if (!itemId) return;

    const confirmText = type === 'message'
      ? 'Delete this contact message?'
      : `Delete this ${type} record?`;
    const shouldDelete = window.confirm(confirmText);
    if (!shouldDelete) return;

    const base = type === 'user' ? USERS_ENDPOINT : type === 'message' ? MESSAGES_ENDPOINT : PROJECTS_ENDPOINT;

    setError('');
    setSuccess('');
    try {
      await requestWithAuth(`${base}/${itemId}`, { method: 'DELETE' });
      setSuccess(`${type[0].toUpperCase()}${type.slice(1)} deleted successfully.`);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || `Unable to delete ${type}.`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  if (isBootstrapping) {
    return (
      <div className="admin-dash-loading d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <Container fluid className="py-3 py-md-4 admin-dashboard-wrap">
        <Card className="admin-dashboard-shell border-0 shadow-lg">
          <Card.Body className="p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between mb-4">
              <div>
                <h3 className="mb-1 text-white fw-bold d-flex align-items-center gap-2">
                  <BiShield /> Admin Dashboard
                </h3>
                <p className="mb-0 text-white-50 small">
                  Signed in as <strong>{authUser?.username || 'admin'}</strong> • Role: <Badge bg="info">{currentRole}</Badge>
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="light" size="sm" onClick={loadDashboardData} disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : <BiRefresh className="me-1" />} Refresh
                </Button>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  <BiLogOut className="me-1" /> Logout
                </Button>
              </div>
            </div>

            <Row className="g-3 mb-4">
              <Col xs={12} sm={6} xl={4}>
                <Card className="metric-card border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <small className="text-muted">Users</small>
                        <h4 className="mb-0">{users.length}</h4>
                      </div>
                      <BiUserCheck className="metric-icon" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} xl={4}>
                <Card className="metric-card border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <small className="text-muted">Contact Messages</small>
                        <h4 className="mb-0">{messages.length}</h4>
                      </div>
                      <BiEnvelope className="metric-icon" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} xl={4}>
                <Card className="metric-card border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <small className="text-muted">Projects</small>
                        <h4 className="mb-0">{projects.length}</h4>
                      </div>
                      <BiFolder className="metric-icon" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Card className="border-0 admin-panel-card">
              <Card.Body className="p-3">
                <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between mb-3">
                  <Form.Group className="admin-search-group">
                    <BiSearch className="admin-search-icon" />
                    <Form.Control
                      placeholder="Search by name, email, role, status or title"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    {activeTab === 'users' && canManageUsersAndProjects && (
                      <Button size="sm" variant="primary" onClick={() => openCreateModal('user')}>
                        <BiPlus className="me-1" /> Add User
                      </Button>
                    )}
                    {activeTab === 'messages' && canManageMessages && (
                      <Button size="sm" variant="primary" onClick={() => openCreateModal('message')}>
                        <BiPlus className="me-1" /> Add Message
                      </Button>
                    )}
                    {activeTab === 'projects' && canManageUsersAndProjects && (
                      <Button size="sm" variant="primary" onClick={() => openCreateModal('project')}>
                        <BiPlus className="me-1" /> Add Project
                      </Button>
                    )}
                  </div>
                </div>

                {!canManageUsersAndProjects && (
                  <Alert variant="info" className="small mb-3">
                    You have assistant access. You can fully manage contact messages. User and project management is restricted.
                  </Alert>
                )}

                <Tab.Container activeKey={activeTab} onSelect={(tabKey) => setActiveTab(tabKey || 'messages')}>
                  <Nav variant="pills" className="admin-tabs mb-3">
                    <Nav.Item><Nav.Link eventKey="messages">Messages ({filteredMessages.length})</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="users">Users ({filteredUsers.length})</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="projects">Projects ({filteredProjects.length})</Nav.Link></Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="messages">
                      <ResourceTable
                        type="message"
                        items={filteredMessages}
                        onEdit={canManageMessages ? openEditModal : null}
                        onDelete={canManageMessages ? handleDelete : null}
                        emptyText="No contact messages found."
                      />
                    </Tab.Pane>

                    <Tab.Pane eventKey="users">
                      {canManageUsersAndProjects ? (
                        <ResourceTable
                          type="user"
                          items={filteredUsers}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          emptyText="No users found."
                        />
                      ) : (
                        <Alert variant="warning" className="mb-0">Only owners/admins can manage users.</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="projects">
                      {canManageUsersAndProjects ? (
                        <ResourceTable
                          type="project"
                          items={filteredProjects}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          emptyText="No projects found."
                        />
                      ) : (
                        <Alert variant="warning" className="mb-0">Only owners/admins can manage projects.</Alert>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Card.Body>
        </Card>
      </Container>

      <EditorModal
        show={showModal}
        type={modalType}
        formData={formData}
        isSaving={isSaving}
        isEdit={Boolean(editingItem)}
        onChange={handleFormChange}
        onHide={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}

const ResourceTable = ({ type, items, onEdit, onDelete, emptyText }) => {
  if (items.length === 0) {
    return <Alert variant="secondary" className="mb-0">{emptyText}</Alert>;
  }

  const getItemId = (item) => item.id || item._id || item.userId || item.messageId || item.projectId;

  return (
    <>
      <div className="d-none d-md-block">
        <Table responsive hover className="align-middle mb-0 admin-table">
          <thead>
            <tr>
              {type === 'user' && <><th>User</th><th>Email</th><th>Role</th></>}
              {type === 'message' && <><th>Sender</th><th>Subject</th><th>Status</th></>}
              {type === 'project' && <><th>Title</th><th>Tech Stack</th><th>Featured</th></>}
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={getItemId(item)}>
                {type === 'user' && (
                  <>
                    <td>{item.username || item.name || 'N/A'}</td>
                    <td>{item.email || 'N/A'}</td>
                    <td><Badge bg="secondary">{item.role || 'assistant'}</Badge></td>
                  </>
                )}
                {type === 'message' && (
                  <>
                    <td>
                      <strong>{item.name || 'Unknown'}</strong>
                      <div className="small text-muted">{item.email || 'No email'}</div>
                    </td>
                    <td>{item.subject || String(item.message || '').slice(0, 56)}</td>
                    <td><Badge bg={item.status === 'resolved' ? 'success' : 'warning'}>{item.status || 'new'}</Badge></td>
                  </>
                )}
                {type === 'project' && (
                  <>
                    <td>{item.title || 'Untitled'}</td>
                    <td>{Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || '—'}</td>
                    <td>{item.featured ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</td>
                  </>
                )}
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    {onEdit && <Button size="sm" variant="outline-primary" onClick={() => onEdit(type, item)}>Edit</Button>}
                    {onDelete && (
                      <Button size="sm" variant="outline-danger" onClick={() => onDelete(type, item)}>
                        <BiTrash />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-md-none d-grid gap-2">
        {items.map((item) => (
          <Card key={getItemId(item)} className="border-0 admin-mobile-card">
            <Card.Body className="p-3">
              {type === 'user' && (
                <>
                  <h6 className="mb-1">{item.username || item.name || 'N/A'}</h6>
                  <p className="mb-2 small text-muted">{item.email || 'No email'}</p>
                  <Badge bg="secondary">{item.role || 'assistant'}</Badge>
                </>
              )}
              {type === 'message' && (
                <>
                  <h6 className="mb-1">{item.subject || 'No subject'}</h6>
                  <p className="mb-2 small text-muted">{item.name || 'Unknown'} • {item.email || 'No email'}</p>
                  <p className="mb-2 small">{String(item.message || '').slice(0, 90)}</p>
                  <Badge bg={item.status === 'resolved' ? 'success' : 'warning'}>{item.status || 'new'}</Badge>
                </>
              )}
              {type === 'project' && (
                <>
                  <h6 className="mb-1">{item.title || 'Untitled'}</h6>
                  <p className="mb-2 small text-muted">{Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || '—'}</p>
                  <Badge bg={item.featured ? 'success' : 'secondary'}>{item.featured ? 'Featured' : 'Standard'}</Badge>
                </>
              )}

              <div className="d-flex gap-2 mt-3">
                {onEdit && <Button size="sm" variant="outline-primary" className="flex-fill" onClick={() => onEdit(type, item)}>Edit</Button>}
                {onDelete && <Button size="sm" variant="outline-danger" className="flex-fill" onClick={() => onDelete(type, item)}>Delete</Button>}
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </>
  );
};

const EditorModal = ({ show, type, formData, isSaving, isEdit, onChange, onHide, onSave }) => {
  if (!type) return null;

  return (
    <Modal centered show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit' : 'Create'} {type}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {type === 'user' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control name="username" value={formData.username || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={formData.email || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={formData.role || 'assistant'} onChange={onChange}>
                <option value="admin">Admin</option>
                <option value="assistant">Assistant</option>
                <option value="secretary">Secretary</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>{isEdit ? 'New Password (optional)' : 'Password'}</Form.Label>
              <Form.Control type="password" name="password" value={formData.password || ''} onChange={onChange} />
            </Form.Group>
          </>
        )}

        {type === 'message' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={formData.name || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="email" value={formData.email || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control name="subject" value={formData.subject || ''} onChange={onChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={4} name="message" value={formData.message || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status || 'new'} onChange={onChange}>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </Form.Select>
            </Form.Group>
          </>
        )}

        {type === 'project' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={formData.title || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tech Stack (comma separated)</Form.Label>
              <Form.Control name="techStack" value={formData.techStack || ''} onChange={onChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>GitHub URL</Form.Label>
              <Form.Control name="githubUrl" value={formData.githubUrl || ''} onChange={onChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Live URL</Form.Label>
              <Form.Control name="liveUrl" value={formData.liveUrl || ''} onChange={onChange} />
            </Form.Group>
            <Form.Check label="Featured Project" name="featured" checked={Boolean(formData.featured)} onChange={onChange} />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Spinner size="sm" animation="border" /> : (isEdit ? 'Save Changes' : 'Create')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminDashboard;
