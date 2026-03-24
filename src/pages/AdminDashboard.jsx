import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Toast,
  ToastContainer,
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
  BiChat,
  BiEnvelope,
  BiFolder,
  BiLogOut,
  BiMoon,
  BiPlus,
  BiRefresh,
  BiReply,
  BiSearch,
  BiShield,
  BiShow,
  BiSun,
  BiTrash,
  BiUser,
  BiUserCheck
} from 'react-icons/bi';
import {
  ADMIN_ROUTES,
  buildAdminUrl,
  clearAdminAuth,
  getStoredAdminToken,
  getStoredAdminUser,
  withAuthHeaders
} from '../utils/adminApi';
import './AdminDashboard.css';

const USERS_ENDPOINT = ADMIN_ROUTES.users;
const MESSAGES_ENDPOINT = ADMIN_ROUTES.messages;
const MESSAGES_CREATE_PUBLIC_ENDPOINT = ADMIN_ROUTES.contactCreate;
const PROJECTS_ENDPOINT = ADMIN_ROUTES.projects;
const DELETE_ALL_CHAT_SESSIONS_ENDPOINT = ADMIN_ROUTES.deleteAllChatSessions;
const DELETE_ALL_MESSAGES_ENDPOINT = ADMIN_ROUTES.deleteAllMessages;
const DELETE_ALL_PROJECTS_ENDPOINT = ADMIN_ROUTES.deleteAllProjects;
const CONTACT_REPLY_TO_EMAIL = import.meta?.env?.VITE_CONTACT_REPLY_TO_EMAIL || 'muyiwa.j.obadara@gmail.com';

const emptyForms = {
  user: { username: '', email: '', role: 'assistant', password: '' },
  message: { name: '', email: '', subject: '', message: '', status: 'new' },
  project: { 
    title: '', 
    description: '', 
    fullDescription: '',
    category: 'General',
    techStack: '', 
    image: '',
    githubUrl: '', 
    liveUrl: '',
    youtubeUrl: '',
    paperUrl: '',
    order: 0,
    featured: false,
    metrics: ''
  },
  password: { current_password: '', new_password: '', confirm_password: '' }
};

function AdminDashboard() {
  const navigate = useNavigate();
  const token = getStoredAdminToken();
  const authUser = getStoredAdminUser();
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);

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
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerAction, setDangerAction] = useState('');
  const [dangerPassword, setDangerPassword] = useState('');
  const [isRunningDangerAction, setIsRunningDangerAction] = useState(false);

  const currentRole = String(authUser?.role || 'assistant').toLowerCase();
  const isAdminRole = currentRole === 'admin';
  const canManageMessages = true;
  const canManageUsersAndProjects = ['owner', 'admin', 'superadmin'].includes(currentRole);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    setIsBootstrapping(false);
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
      throw new Error(data?.message || `${response.status} ${response.statusText}`);
    }

    return data;
  }, [token]);

  const normalizeList = (data, preferredKey) => {
    if (!data) return [];
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
    const safeMessages = Array.isArray(messages) ? messages : [];
    const q = query.trim().toLowerCase();
    if (!q) return safeMessages;
    return safeMessages.filter((item) =>
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

  const openPasswordModal = () => {
    setModalType('password');
    setEditingItem(null);
    setFormData(emptyForms.password);
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingItem(item);

    if (type === 'project') {
      const links = item.links || {};
      let metricsStr = '';
      if (item.metrics && Object.keys(item.metrics).length > 0) {
        try {
          metricsStr = JSON.stringify(item.metrics);
        } catch {
          metricsStr = '';
        }
      }

      setFormData({
        ...emptyForms.project,
        ...item,
        techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || '',
        githubUrl: item.githubUrl || links.github || '',
        liveUrl: item.liveUrl || links.demo || '',
        youtubeUrl: links.youtube || '',
        paperUrl: links.paper || '',
        order: item.order || 0,
        metrics: metricsStr
      });
    } else {
      setFormData({
        ...emptyForms[type],
        ...item,
        techStack: Array.isArray(item.techStack) ? item.techStack.join(', ') : item.techStack || ''
      });
    }

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
    const response = await fetch(buildAdminUrl(MESSAGES_CREATE_PUBLIC_ENDPOINT), {
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

    if (modalType === 'password') {
      if (!payload.current_password || !payload.new_password) {
        setError('Please fill in current and new password.');
        return;
      }

      if (payload.new_password !== payload.confirm_password) {
        setError('New password and confirmation do not match.');
        return;
      }

      endpoint = ADMIN_ROUTES.changePassword;
      method = 'POST';
      payload = {
        current_password: payload.current_password,
        new_password: payload.new_password
      };
    }

    if (modalType === 'project') {
      const links = {};
      if (payload.githubUrl) links.github = payload.githubUrl;
      if (payload.liveUrl) links.demo = payload.liveUrl;
      if (payload.youtubeUrl) links.youtube = payload.youtubeUrl;
      if (payload.paperUrl) links.paper = payload.paperUrl;

      let metrics = {};
      if (payload.metrics) {
        try {
          metrics = JSON.parse(payload.metrics);
        } catch {
          metrics = {};
        }
      }

      payload = {
        title: payload.title,
        description: payload.description,
        fullDescription: payload.fullDescription,
        category: payload.category || 'General',
        techStack: String(payload.techStack || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        image: payload.image,
        links: links,
        githubUrl: payload.githubUrl,
        liveUrl: payload.liveUrl,
        metrics: metrics,
        order: parseInt(payload.order, 10) || 0,
        featured: Boolean(payload.featured)
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

      if (modalType === 'password') {
        setSuccess('Password updated successfully. Use your new password next login.');
      } else {
        setSuccess(`${modalType[0].toUpperCase()}${modalType.slice(1)} ${isEdit ? 'updated' : 'created'} successfully.`);
        setShowToast(true);
      }
      closeModal();
      if (modalType !== 'password') {
        await loadDashboardData();
      }
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

  const openMessageModal = (item) => {
    setSelectedMessage(item || null);
    setShowMessageModal(Boolean(item));
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMessage(null);
  };

  const handleReplyToMessage = (message) => {
    const recipientEmail = String(message?.email || '').trim();
    if (!recipientEmail) {
      setError('This message has no sender email to reply to.');
      return;
    }

    const replySubject = 'Replying to your message from my portfolio';
    const emailBody = [
      `Hi ${message?.name || 'there'},`,
      '',
      'Thanks for your message from my portfolio website.',
      '',
      'Best regards,',
      'Muyiwa Obadara',
      '',
      `Reply-To: ${CONTACT_REPLY_TO_EMAIL}`
    ].join('\n');

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(emailBody)}&reply_to=${encodeURIComponent(CONTACT_REPLY_TO_EMAIL)}`;
    const openedTab = window.open(gmailUrl, '_blank', 'noopener,noreferrer');

    if (!openedTab) {
      const fallbackMailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(emailBody)}&reply-to=${encodeURIComponent(CONTACT_REPLY_TO_EMAIL)}`;
      window.location.href = fallbackMailto;
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    navigate('/admin');
  };

  const dangerLabels = {
    sessions: 'Delete All Chat Sessions',
    messages: 'Delete All Messages',
    projects: 'Delete All Projects'
  };

  const dangerEndpoints = {
    sessions: DELETE_ALL_CHAT_SESSIONS_ENDPOINT,
    messages: DELETE_ALL_MESSAGES_ENDPOINT,
    projects: DELETE_ALL_PROJECTS_ENDPOINT
  };

  const openDangerModal = (action) => {
    setDangerAction(action);
    setDangerPassword('');
    setShowDangerModal(true);
  };

  const closeDangerModal = (force = false) => {
    if (isRunningDangerAction && !force) return;
    setShowDangerModal(false);
    setDangerAction('');
    setDangerPassword('');
  };

  const handleConfirmDangerAction = async () => {
    if (!isAdminRole) {
      setError('Only admin role can perform this action.');
      return;
    }

    if (!dangerAction || !dangerEndpoints[dangerAction]) return;

    if (!dangerPassword.trim()) {
      setError('Please enter your admin password to continue.');
      return;
    }

    setError('');
    setSuccess('');
    setIsRunningDangerAction(true);

    try {
      const response = await requestWithAuth(dangerEndpoints[dangerAction], {
        method: 'POST',
        body: JSON.stringify({ admin_password: dangerPassword })
      });

      setSuccess(response?.message || `${dangerLabels[dangerAction]} completed successfully.`);
      closeDangerModal(true);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || `Failed to run ${dangerLabels[dangerAction]}.`);
    } finally {
      setIsRunningDangerAction(false);
    }
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
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg="success" show={showToast} onClose={() => setShowToast(false)} delay={3500} autohide>
          <Toast.Header closeButton={true}>
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{success}</Toast.Body>
        </Toast>
      </ToastContainer>
      <Container fluid className="py-2 py-md-3 admin-dashboard-wrap">
        <Card className="admin-dashboard-shell border-0 shadow-lg">
          <Card.Body className="p-3">
            <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between mb-3">
              <div>
                <h3 className="mb-1 fw-bold d-flex align-items-center gap-2 admin-dash-title admin-shell-title">
                  <BiShield /> Admin Dashboard
                </h3>
                <p className="mb-0 small admin-shell-subtitle">
                  Signed in as <strong>{authUser?.username || 'admin'}</strong> • Role: <Badge bg="info">{currentRole}</Badge>
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2 admin-dash-actions">
                <Button variant="primary" size="sm" onClick={() => navigate('/admin/chat')}>
                  <BiChat className="me-1" /> Open Chats
                </Button>
                <Button variant={theme === 'dark' ? 'outline-light' : 'outline-secondary'} size="sm" onClick={openPasswordModal}>
                  Change Password
                </Button>
                <Button variant="light" size="sm" onClick={loadDashboardData} disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : <BiRefresh className="me-1" />} Refresh
                </Button>
                <Button
                  variant={theme === 'dark' ? 'light' : 'dark'}
                  size="sm"
                  className="theme-toggle-btn"
                  onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                >
                  {theme === 'dark' ? <BiSun className="me-1" /> : <BiMoon className="me-1" />}
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </Button>
                <Button variant={theme === 'dark' ? 'outline-light' : 'outline-secondary'} size="sm" onClick={handleLogout}>
                  <BiLogOut className="me-1" /> Logout
                </Button>
              </div>
            </div>

            <Row className="g-2 mb-3">
              <Col xs={12} sm={6} xl={4}>
                <Card className="metric-card border-0 h-100">
                  <Card.Body className="py-3">
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
                  <Card.Body className="py-3">
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
                  <Card.Body className="py-3">
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

            {isAdminRole && (
              <Card className="border-danger-subtle bg-danger-subtle mb-3">
                <Card.Body className="p-3">
                  <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
                    <div>
                      <h6 className="mb-1 text-danger fw-bold">Danger Zone</h6>
                      <p className="mb-0 small text-danger-emphasis">These actions permanently delete data and require your admin password.</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <Button size="sm" variant="outline-danger" onClick={() => openDangerModal('sessions')}>
                        Delete All Chat Sessions
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => openDangerModal('messages')}>
                        Delete All Messages
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => openDangerModal('projects')}>
                        Delete All Projects
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            <Card className="border-0 admin-panel-card">
              <Card.Body className="p-2 p-md-3">
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
                        onView={canManageMessages ? openMessageModal : null}
                        onReply={canManageMessages ? handleReplyToMessage : null}
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

      <MessageDetailsModal
        show={showMessageModal}
        message={selectedMessage}
        onHide={closeMessageModal}
        onReply={handleReplyToMessage}
      />

      <DangerActionModal
        show={showDangerModal}
        action={dangerAction}
        password={dangerPassword}
        isSaving={isRunningDangerAction}
        labels={dangerLabels}
        onPasswordChange={(value) => setDangerPassword(value)}
        onHide={closeDangerModal}
        onConfirm={handleConfirmDangerAction}
      />
    </div>
  );
}

const ResourceTable = ({ type, items, onEdit, onView, onReply, onDelete, emptyText }) => {
  const navigate = useNavigate();
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
              {type === 'message' && <><th>Sender</th><th>Subject</th><th>Received</th></>}
              {type === 'project' && <><th>Title</th><th>Tech Stack</th><th>Featured</th></>}
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const rowProps = (type === 'message') ? {
                style: { cursor: 'pointer' },
                onClick: (e) => {
                  // Only trigger if not clicking an action button
                  if (e.target.closest('button')) return;
                  navigate(`/admin/messages/${getItemId(item)}`, { state: { message: item } });
                }
              } : {};
              return (
                <tr key={getItemId(item)} {...rowProps}>
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
                      <td className="small text-muted">{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</td>
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
                      {type === 'message' && onView && (
                        <Button size="sm" variant="outline-secondary" onClick={(e) => { e.stopPropagation(); onView(item); }}>
                          <BiShow />
                        </Button>
                      )}
                      {type === 'message' && onReply && (
                        <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); onReply(item); }}>
                          <BiReply />
                        </Button>
                      )}
                      {onEdit && <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); onEdit(type, item); }}>Edit</Button>}
                      {onDelete && (
                        <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); onDelete(type, item); }}>
                          <BiTrash />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <div className="d-md-none d-grid gap-2">
        {items.map((item) => {
          const cardProps = (type === 'message') ? {
            style: { cursor: 'pointer' },
            onClick: (e) => {
              if (e.target.closest('button')) return;
              navigate(`/admin/messages/${getItemId(item)}`, { state: { message: item } });
            }
          } : {};
          return (
            <Card key={getItemId(item)} className="border-0 admin-mobile-card" {...cardProps}>
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
                    <small className="text-muted d-block">{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</small>
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
                  {type === 'message' && onView && (
                    <Button size="sm" variant="outline-secondary" className="flex-fill" onClick={(e) => { e.stopPropagation(); onView(item); }}>Open</Button>
                  )}
                  {type === 'message' && onReply && (
                    <Button size="sm" variant="outline-primary" className="flex-fill" onClick={(e) => { e.stopPropagation(); onReply(item); }}>Reply</Button>
                  )}
                  {onEdit && <Button size="sm" variant="outline-primary" className="flex-fill" onClick={(e) => { e.stopPropagation(); onEdit(type, item); }}>Edit</Button>}
                  {onDelete && <Button size="sm" variant="outline-danger" className="flex-fill" onClick={(e) => { e.stopPropagation(); onDelete(type, item); }}>Delete</Button>}
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </>
  );
};

const MessageDetailsModal = ({ show, message, onHide, onReply }) => {
  if (!message) return null;

  return (
    <Modal centered show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Message Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2"><strong>From:</strong> {message.name || 'Unknown'}</p>
        <p className="mb-2"><strong>Email:</strong> {message.email || 'N/A'}</p>
        <p className="mb-2"><strong>Subject:</strong> {message.subject || 'No subject'}</p>
        <p className="mb-3"><strong>Received:</strong> {message.created_at ? new Date(message.created_at).toLocaleString() : 'N/A'}</p>
        <Form.Group>
          <Form.Label><strong>Message</strong></Form.Label>
          <Form.Control as="textarea" rows={8} value={String(message.message || '')} readOnly />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="primary" onClick={() => onReply(message)}>
          <BiReply className="me-1" /> Reply
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const EditorModal = ({ show, type, formData, isSaving, isEdit, onChange, onHide, onSave }) => {
  if (!type) return null;

  const modalTitle = type === 'password'
    ? 'Change Password'
    : `${isEdit ? 'Edit' : 'Create'} ${type}`;

  const saveLabel = type === 'password'
    ? 'Update Password'
    : (isEdit ? 'Save Changes' : 'Create');

  return (
    <Modal centered show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
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
              <Form.Label>Category</Form.Label>
              <Form.Control name="category" value={formData.category || 'General'} onChange={onChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Short Description</Form.Label>
              <Form.Control as="textarea" rows={2} name="description" value={formData.description || ''} onChange={onChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Full Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="fullDescription" value={formData.fullDescription || ''} onChange={onChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tech Stack (comma separated)</Form.Label>
              <Form.Control name="techStack" value={formData.techStack || ''} onChange={onChange} placeholder="e.g., React, Node.js, MongoDB" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control name="image" value={formData.image || ''} onChange={onChange} placeholder="https://..." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>GitHub URL</Form.Label>
              <Form.Control name="githubUrl" value={formData.githubUrl || ''} onChange={onChange} placeholder="https://github.com/..." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Live Demo URL</Form.Label>
              <Form.Control name="liveUrl" value={formData.liveUrl || ''} onChange={onChange} placeholder="https://..." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>YouTube URL</Form.Label>
              <Form.Control name="youtubeUrl" value={formData.youtubeUrl || ''} onChange={onChange} placeholder="https://youtube.com/..." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Paper/Documentation URL</Form.Label>
              <Form.Control name="paperUrl" value={formData.paperUrl || ''} onChange={onChange} placeholder="https://..." />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Display Order</Form.Label>
              <Form.Control type="number" name="order" value={formData.order || 0} onChange={onChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Metrics (JSON, optional)</Form.Label>
              <Form.Control as="textarea" rows={2} name="metrics" value={formData.metrics || ''} onChange={onChange} placeholder='{"accuracy": 94, "users": 1000}' />
            </Form.Group>

            <Form.Check label="Featured Project" name="featured" checked={Boolean(formData.featured)} onChange={onChange} />
          </>
        )}

        {type === 'password' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control type="password" name="current_password" value={formData.current_password || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" name="new_password" value={formData.new_password || ''} onChange={onChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control type="password" name="confirm_password" value={formData.confirm_password || ''} onChange={onChange} required />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Spinner size="sm" animation="border" /> : saveLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const DangerActionModal = ({ show, action, password, isSaving, labels, onPasswordChange, onHide, onConfirm }) => {
  if (!action) return null;

  return (
    <Modal centered show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{labels[action] || 'Confirm Action'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger" className="mb-3">
          This action is permanent and cannot be undone.
        </Alert>
        <p className="mb-2 small">
          Enter your admin password to confirm <strong>{(labels[action] || '').toLowerCase()}</strong>.
        </p>
        <Form.Group>
          <Form.Label>Admin Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            autoFocus
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={isSaving || !password.trim()}>
          {isSaving ? <Spinner size="sm" animation="border" /> : 'Confirm Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminDashboard;
