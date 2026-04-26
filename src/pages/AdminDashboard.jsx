import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  Alert,
  Toast,
  ToastContainer,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  Nav,
  Row,
  Spinner,
  Tab,
  Table
} from 'react-bootstrap';
import {
  BiCog,
  BiBell,
  BiMenu,
  BiChat,
  BiEnvelope,
  BiFile,
  BiFolder,
  BiImage,
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
  BiUserCheck,
  BiX
} from 'react-icons/bi';
import {
  ADMIN_ROUTES,
  buildAdminUrl,
  clearAdminAuth,
  getStoredAdminToken,
  getStoredAdminUser,
  withAuthHeaders
} from '../utils/adminApi';
import {
  buildAdminNotifications,
  clearAdminNotifications,
  getStoredAdminNotifications,
  mergeAdminNotifications,
  saveAdminNotifications,
  notifyAdminBridge,
} from '../utils/adminNotifications';
import './AdminDashboard.css';

const USERS_ENDPOINT = ADMIN_ROUTES.users;
const MESSAGES_ENDPOINT = ADMIN_ROUTES.messages;
const PROJECTS_ENDPOINT = ADMIN_ROUTES.projects;
const SKILLS_ENDPOINT = ADMIN_ROUTES.skills;
const OVERVIEW_ENDPOINT = ADMIN_ROUTES.overview;
const UPLOAD_RESUME_ENDPOINT = ADMIN_ROUTES.uploadResume;
const UPLOAD_PORTRAIT_ENDPOINT = ADMIN_ROUTES.uploadPortrait;
const RESUME_ASSET_ENDPOINT = ADMIN_ROUTES.resumeAsset;
const PORTRAIT_ASSET_ENDPOINT = ADMIN_ROUTES.portraitAsset;
const DELETE_ALL_CHAT_SESSIONS_ENDPOINT = ADMIN_ROUTES.deleteAllChatSessions;
const DELETE_ALL_MESSAGES_ENDPOINT = ADMIN_ROUTES.deleteAllMessages;
const DELETE_ALL_PROJECTS_ENDPOINT = ADMIN_ROUTES.deleteAllProjects;
const CONTACT_REPLY_TO_EMAIL = import.meta?.env?.VITE_CONTACT_REPLY_TO_EMAIL || 'muyiwa.j.obadara@gmail.com';

const emptyForms = {
  user: { username: '', email: '', role: 'assistant', password: '' },
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
  const [notifications, setNotifications] = useState(() => getStoredAdminNotifications());

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForms.user);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerAction, setDangerAction] = useState('');
  const [dangerPassword, setDangerPassword] = useState('');
  const [isRunningDangerAction, setIsRunningDangerAction] = useState(false);
  const [assetFiles, setAssetFiles] = useState({ resume: null, portrait: null });
  const [isUploadingAssets, setIsUploadingAssets] = useState({ resume: false, portrait: false });
  const [assetVersion, setAssetVersion] = useState({ resume: 0, portrait: 0 });
  const [assetLinks, setAssetLinks] = useState({ resume: '', portrait: '' });
  const [assetMissing, setAssetMissing] = useState({ resume: false, portrait: false });
  const [uploadProgress, setUploadProgress] = useState({ resume: 0, portrait: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentRole = String(authUser?.role || 'assistant').toLowerCase();
  const isAdminRole = currentRole === 'admin';
  const canManageMessages = true;
  const canManageUsersAndProjects = ['owner', 'admin', 'superadmin'].includes(currentRole);

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  useEffect(() => {
    saveAdminNotifications(notifications);
  }, [notifications]);

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
      if (response.status === 401 || response.status === 403) {
        clearAdminAuth();
        navigate('/admin/login', { replace: true });
      }
      throw new Error(data?.message || `${response.status} ${response.statusText}`);
    }

    return data;
  }, [navigate, token]);

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
      const overviewRes = await requestWithAuth(OVERVIEW_ENDPOINT);

      setUsers(normalizeList(overviewRes, 'users'));
      setMessages(normalizeList(overviewRes, 'messages'));
      setProjects(normalizeList(overviewRes, 'projects'));
      setSkills(normalizeList(overviewRes, 'skills'));
      setSessions(normalizeList(overviewRes, 'sessions'));

      const nextNotifications = buildAdminNotifications({
        messages: normalizeList(overviewRes, 'messages'),
        sessions: normalizeList(overviewRes, 'sessions')
      });
      setNotifications((prev) => mergeAdminNotifications(prev, nextNotifications));
      nextNotifications.forEach((notification) => notifyAdminBridge(notification));
    } catch (err) {
      if (!getStoredAdminToken()) {
        return;
      }

      try {
        const [usersRes, messagesRes, projectsRes, skillsRes, sessionsRes] = await Promise.all([
          canManageUsersAndProjects ? requestWithAuth(USERS_ENDPOINT) : Promise.resolve([]),
          requestWithAuth(MESSAGES_ENDPOINT),
          canManageUsersAndProjects ? requestWithAuth(PROJECTS_ENDPOINT) : Promise.resolve([]),
          canManageUsersAndProjects ? requestWithAuth(SKILLS_ENDPOINT) : Promise.resolve([]),
          requestWithAuth(ADMIN_ROUTES.sessions)
        ]);

        setUsers(normalizeList(usersRes, 'users'));
        setMessages(normalizeList(messagesRes, 'messages'));
        setProjects(normalizeList(projectsRes, 'projects'));
        setSkills(normalizeList(skillsRes, 'skills'));
        setSessions(normalizeList(sessionsRes, 'sessions'));

        const nextNotifications = buildAdminNotifications({
          messages: normalizeList(messagesRes, 'messages'),
          sessions: normalizeList(sessionsRes, 'sessions')
        });
        setNotifications((prev) => mergeAdminNotifications(prev, nextNotifications));
        nextNotifications.forEach((notification) => notifyAdminBridge(notification));
      } catch (fallbackErr) {
        setError(fallbackErr.message || err.message || 'Failed to load dashboard data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [canManageUsersAndProjects, requestWithAuth]);

  useEffect(() => {
    if (!isBootstrapping) {
      loadDashboardData();
    }
  }, [isBootstrapping, loadDashboardData]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('admin-sidebar-open');
    } else {
      document.body.classList.remove('admin-sidebar-open');
    }

    return () => {
      document.body.classList.remove('admin-sidebar-open');
    };
  }, [isSidebarOpen]);

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

  const filteredSessions = useMemo(() => {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const q = query.trim().toLowerCase();
    if (!q) return safeSessions;

    return safeSessions.filter((session) =>
      [
        session.session_id,
        session.user_name,
        session.user_email,
        session.user_phone,
        session.last_message,
        String(session.message_count)
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [query, sessions]);

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

  const openSettingsModal = () => {
    setShowSettingsModal(true);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
  };

  const closeSidebarOnMobile = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
  }, []);

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
    setFormData(emptyForms.user);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getItemId = (item) => item.id || item._id || item.userId || item.messageId || item.projectId;

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
    } else if (modalType === 'message') {
      setError('Creating messages from admin dashboard is disabled.');
      return;
    } else {
      setError('Unsupported editor action.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await requestWithAuth(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

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
    clearAdminNotifications();
    navigate('/admin');
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenNotification = (notification) => {
    if (notification?.href) {
      navigate(notification.href);
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    clearAdminNotifications();
  };

  const toAbsoluteAssetUrl = useCallback((url = '') => {
    const normalized = String(url || '').trim();
    if (!normalized) return '';
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return buildAdminUrl(normalized.startsWith('/') ? normalized : `/${normalized}`);
  }, []);

  const withVersion = useCallback((url, version) => {
    if (!url || !version) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }, []);

  const loadAssetLinks = useCallback(async () => {
    const fetchAsset = async (kind) => {
      const endpoint = kind === 'resume' ? RESUME_ASSET_ENDPOINT : PORTRAIT_ASSET_ENDPOINT;
      const response = await fetch(buildAdminUrl(endpoint));

      if (response.status === 404) {
        return { kind, url: '', missing: true };
      }

      if (!response.ok) {
        throw new Error(`Unable to load ${kind} asset.`);
      }

      const resolvedUrl = toAbsoluteAssetUrl(buildAdminUrl(endpoint));
      return {
        kind,
        url: withVersion(resolvedUrl, assetVersion[kind]),
        missing: !resolvedUrl
      };
    };

    try {
      const [resumeAsset, portraitAsset] = await Promise.all([
        fetchAsset('resume'),
        fetchAsset('portrait')
      ]);

      setAssetLinks({
        resume: resumeAsset.url,
        portrait: portraitAsset.url
      });

      setAssetMissing({
        resume: resumeAsset.missing,
        portrait: portraitAsset.missing
      });
    } catch (err) {
      setError(err.message || 'Failed to load asset previews.');
    }
  }, [assetVersion, toAbsoluteAssetUrl, withVersion]);

  useEffect(() => {
    loadAssetLinks();
  }, [loadAssetLinks]);

  const handleAssetFileChange = (kind, file) => {
    setAssetFiles((prev) => ({
      ...prev,
      [kind]: file || null
    }));
  };

  const handleUploadAsset = async (kind) => {
    const file = assetFiles[kind];
    if (!file) {
      setError(`Please choose a ${kind} file first.`);
      return;
    }

    const endpoint = kind === 'resume' ? UPLOAD_RESUME_ENDPOINT : UPLOAD_PORTRAIT_ENDPOINT;
    const fieldName = kind === 'resume' ? 'resume' : 'portrait';
    const formData = new FormData();
    formData.append('file', file);
    formData.append(fieldName, file);

    setError('');
    setSuccess('');
    setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
    setIsUploadingAssets((prev) => ({ ...prev, [kind]: true }));

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress((prev) => ({ ...prev, [kind]: Math.round(percentComplete) }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', async () => {
        try {
          let errorPayload = null;
          try {
            errorPayload = JSON.parse(xhr.responseText);
          } catch {
            errorPayload = null;
          }

          if (xhr.status >= 400) {
            throw new Error(errorPayload?.detail || errorPayload?.message || `Failed to upload ${kind}.`);
          }

          const uploadedTextUrl = String(xhr.responseText || '').trim();
          const now = Date.now();
          setAssetVersion((prev) => ({ ...prev, [kind]: now }));
          const uploadedUrl = toAbsoluteAssetUrl(uploadedTextUrl || buildAdminUrl(kind === 'resume' ? RESUME_ASSET_ENDPOINT : PORTRAIT_ASSET_ENDPOINT));
          if (uploadedUrl) {
            setAssetLinks((prev) => ({ ...prev, [kind]: withVersion(uploadedUrl, now) }));
            setAssetMissing((prev) => ({ ...prev, [kind]: false }));
          }
          setAssetFiles((prev) => ({ ...prev, [kind]: null }));
          setSuccess(`${kind[0].toUpperCase()}${kind.slice(1)} uploaded successfully.`);
          setShowToast(true);
          setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
        } catch (err) {
          setError(err.message || `Unable to upload ${kind}.`);
          setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
        } finally {
          setIsUploadingAssets((prev) => ({ ...prev, [kind]: false }));
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        setError(`Network error while uploading ${kind}.`);
        setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
        setIsUploadingAssets((prev) => ({ ...prev, [kind]: false }));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        setError(`Upload of ${kind} was cancelled.`);
        setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
        setIsUploadingAssets((prev) => ({ ...prev, [kind]: false }));
      });

      // Open connection and set headers
      xhr.open('POST', buildAdminUrl(endpoint));
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Send
      xhr.send(formData);
    } catch (err) {
      setError(err.message || `Unable to upload ${kind}.`);
      setUploadProgress((prev) => ({ ...prev, [kind]: 0 }));
      setIsUploadingAssets((prev) => ({ ...prev, [kind]: false }));
    }
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
      <div
        className={`admin-sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        role="button"
        tabIndex={0}
        aria-label="Close sidebar"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setIsSidebarOpen(false);
          }
        }}
      />
      <Container fluid className="py-2 py-md-3 admin-dashboard-wrap">
        <div className="admin-desktop-shell">
          <Row className="g-3 g-xl-4">
            <Col lg={4} xl={3} xxl={2} className={`admin-sidebar-col ${isSidebarOpen ? 'is-open' : ''}`}>
              <Card className="admin-sidebar-panel border-0">
                <Card.Body className="p-3 p-md-4">
                  <div className="admin-sidebar-mobile-head d-lg-none mb-3">
                    <Button
                      variant="link"
                      className="admin-sidebar-close-btn"
                      onClick={() => setIsSidebarOpen((prev) => !prev)}
                      aria-label={isSidebarOpen ? 'Close sidebar' : 'Expand sidebar'}
                    >
                      {isSidebarOpen ? <BiX size={22} /> : <BiMenu size={22} />}
                    </Button>
                  </div>

                  <div className="admin-identity-card mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="admin-identity-avatar">
                        <BiUser />
                      </span>
                      <div className="admin-identity-meta">
                        <p className="mb-0 fw-semibold">{authUser?.username || 'admin'}</p>
                        <small className="admin-shell-subtitle">Role: {currentRole}</small>
                      </div>
                    </div>

                    <Dropdown align="end" className="mt-3 admin-account-dropdown">
                      <Dropdown.Toggle variant="outline-light" size="sm" className="w-100">
                        <BiUser className="me-1 admin-sidebar-link-icon" />
                        <span className="admin-sidebar-link-text">Account</span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="w-100">
                        <Dropdown.Item onClick={() => { openSettingsModal(); closeSidebarOnMobile(); }}>
                          <BiCog className="me-2" /> Settings
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => { handleLogout(); closeSidebarOnMobile(); }} className="text-danger">
                          <BiLogOut className="me-1" /> Logout
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <div className="d-grid gap-2 admin-dash-actions">
                    <Button variant="light" size="sm" onClick={() => { loadDashboardData(); closeSidebarOnMobile(); }} disabled={isLoading}>
                      {isLoading ? <Spinner animation="border" size="sm" /> : <BiRefresh className="me-1 admin-sidebar-link-icon" />} <span className="admin-sidebar-link-text">Refresh</span>
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { navigate('/admin/chat'); closeSidebarOnMobile(); }}>
                      <BiChat className="me-1 admin-sidebar-link-icon" /> <span className="admin-sidebar-link-text">Open Chats</span>
                    </Button>
                    {canManageUsersAndProjects && (
                      <Button variant="primary" size="sm" onClick={() => { navigate('/admin/skills'); closeSidebarOnMobile(); }}>
                        <BiCog className="me-1 admin-sidebar-link-icon" /> <span className="admin-sidebar-link-text">Manage Skills</span>
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8} xl={9} xxl={10} className="admin-workspace-col">
              <Card className="admin-dashboard-shell border-0 shadow-lg">
                <Card.Body className="p-3 p-md-4">
                  <div className="admin-main-header d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between mb-3">
                    <div>
                      <h4 className="mb-1 fw-bold d-flex align-items-center gap-2 admin-shell-title">
                        <BiShield /> Corporate Admin Console <Badge bg="info" className="text-uppercase">{currentRole}</Badge>
                      </h4>
                      <p className="mb-0 small admin-shell-subtitle">
                        Govern operations, content, skills, and assets from a centralized command center.
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end admin-header-actions">
                      <Dropdown align="end" className="admin-notification-dropdown">
                        <Dropdown.Toggle variant="link" className="admin-notification-bell" aria-label="Notifications">
                          <BiBell />
                          {notifications.length > 0 && <Badge bg="danger" pill className="admin-notification-count">{notifications.length}</Badge>}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="admin-notification-menu shadow-lg">
                          <div className="px-3 py-2 d-flex align-items-center justify-content-between">
                            <strong>Notifications</strong>
                            <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={handleClearNotifications}>
                              Clear all
                            </Button>
                          </div>
                          <Dropdown.Divider />
                          {notifications.length === 0 ? (
                            <div className="px-3 py-3 text-muted small">No new notifications.</div>
                          ) : (
                            notifications.map((notification) => (
                              <Dropdown.Item key={notification.id} className="admin-notification-item" onClick={() => handleOpenNotification(notification)}>
                                <div className="d-flex flex-column gap-1">
                                  <strong>{notification.title}</strong>
                                  <span className="small text-muted">{notification.body}</span>
                                </div>
                              </Dropdown.Item>
                            ))
                          )}
                        </Dropdown.Menu>
                      </Dropdown>

                      <Form.Check
                        type="switch"
                        id="admin-dashboard-theme-switch"
                        className="admin-theme-switch"
                        checked={theme === 'dark'}
                        onChange={handleThemeToggle}
                        label={theme === 'dark' ? 'Dark' : 'Light'}
                      />

                      <Button variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} size="sm" className="admin-header-logout-btn" onClick={handleLogout}>
                        <BiLogOut className="me-1" /> Logout
                      </Button>
                    </div>
                  </div>

                  <Row className="g-2 mb-3">
                    <Col xs={12} sm={6} xl={3}>
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
                    <Col xs={12} sm={6} xl={3}>
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
                    <Col xs={12} sm={6} xl={3}>
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
                    <Col xs={12} sm={6} xl={3}>
                      <Card className="metric-card border-0 h-100">
                        <Card.Body className="py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <small className="text-muted">Skills</small>
                              <h4 className="mb-0">{skills.length}</h4>
                            </div>
                            <BiCog className="metric-icon" />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} sm={6} xl={3}>
                      <Card className="metric-card border-0 h-100">
                        <Card.Body className="py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <small className="text-muted">Chat Sessions</small>
                              <h4 className="mb-0">{sessions.length}</h4>
                            </div>
                            <BiChat className="metric-icon" />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                  {canManageUsersAndProjects && (
                    <Accordion className="mb-3 admin-section-accordion" alwaysOpen>
                      <Accordion.Item eventKey="assets" className="border-0 admin-panel-card">
                        <Accordion.Header>
                          <span className="fw-bold d-flex align-items-center gap-2">
                            <BiFile /> Asset Management
                          </span>
                        </Accordion.Header>
                        <Accordion.Body className="p-3">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <small className="text-muted">Upload and manage your resume and portrait</small>
                          </div>

                  <Row className="g-4 align-items-stretch">
                    <Col xs={12} lg={6} className="d-flex">
                      <Card className="h-100 border-0 shadow-sm flex-fill" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <Card.Header className="bg-light border-0 py-3 px-4">
                          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                            <BiFile size={20} style={{ color: '#0d6efd' }} />
                            Resume (PDF/DOC)
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          {/* Resume Preview */}
                          {assetLinks.resume && !assetMissing.resume && (
                            <div className="mb-3 admin-resume-preview-wrap">
                              <iframe
                                src={assetLinks.resume}
                                title="Resume Preview"
                                className="admin-asset-preview-frame"
                              />
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="mb-3">
                            {assetLinks.resume && !assetMissing.resume ? (
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="success" className="fw-semibold">✓ Uploaded</Badge>
                                <a href={assetLinks.resume} target="_blank" rel="noreferrer" className="small fw-bold text-decoration-none ms-2">
                                  Download
                                </a>
                              </div>
                            ) : (
                              <Badge bg="secondary" className="fw-semibold">Not uploaded</Badge>
                            )}
                          </div>

                          {/* File Selection */}
                          <div className="mb-3">
                            {assetFiles.resume && (
                              <small className="text-muted d-block mb-2">
                                Selected: <strong>{assetFiles.resume.name}</strong> ({(assetFiles.resume.size / 1024 / 1024).toFixed(2)} MB)
                              </small>
                            )}
                            <Form.Group>
                              <Form.Label className="fw-semibold mb-2">Choose File</Form.Label>
                              <div className="admin-file-upload-wrapper">
                                <input
                                  type="file"
                                  id="resume-file-input"
                                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                  onChange={(event) => handleAssetFileChange('resume', event.target.files?.[0])}
                                  className="admin-file-input"
                                />
                                <label htmlFor="resume-file-input" className="admin-file-upload-label">
                                  <div className="d-flex flex-column align-items-center gap-2">
                                    <BiFile size={32} />
                                    <span className="fw-semibold">Click to browse</span>
                                    <span className="small text-muted">or drag and drop</span>
                                  </div>
                                </label>
                              </div>
                            </Form.Group>
                          </div>

                          {/* Progress Bar */}
                          {uploadProgress.resume > 0 && (
                            <div className="mb-3">
                              <small className="d-flex justify-content-between mb-1">
                                <span>Uploading...</span>
                                <span className="fw-bold">{uploadProgress.resume}%</span>
                              </small>
                              <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${uploadProgress.resume}%`,
                                    background: 'linear-gradient(90deg, #0d6efd 0%, #0a58ca 100%)',
                                    transition: 'width 0.3s ease'
                                  }}
                                  aria-valuenow={uploadProgress.resume}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                />
                              </div>
                            </div>
                          )}

                          {/* Upload Button */}
                          <Button
                            variant="primary"
                            onClick={() => handleUploadAsset('resume')}
                            disabled={isUploadingAssets.resume || !assetFiles.resume}
                            className="w-100"
                            style={{ borderRadius: '10px' }}
                          >
                            {isUploadingAssets.resume ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <BiPlus className="me-2" />
                                Upload Resume
                              </>
                            )}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={12} lg={6} className="d-flex">
                      <Card className="h-100 border-0 shadow-sm flex-fill" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <Card.Header className="bg-light border-0 py-3 px-4">
                          <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                            <BiImage size={20} style={{ color: '#0d6efd' }} />
                            Portrait (Image)
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          {/* Portrait Preview */}
                          {assetLinks.portrait && !assetMissing.portrait && (
                            <div className="admin-portrait-preview-wrap mb-3 border-0 shadow-sm">
                              <img src={assetLinks.portrait} alt="Current portrait" className="admin-portrait-preview" />
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="mb-3">
                            {assetLinks.portrait && !assetMissing.portrait ? (
                              <Badge bg="success" className="fw-semibold">✓ Uploaded</Badge>
                            ) : (
                              <Badge bg="secondary" className="fw-semibold">Not uploaded</Badge>
                            )}
                          </div>

                          {/* File Selection */}
                          <div className="mb-3">
                            {assetFiles.portrait && (
                              <small className="text-muted d-block mb-2">
                                Selected: <strong>{assetFiles.portrait.name}</strong> ({(assetFiles.portrait.size / 1024 / 1024).toFixed(2)} MB)
                              </small>
                            )}
                            <Form.Group>
                              <Form.Label className="fw-semibold mb-2">Choose Image</Form.Label>
                              <div className="admin-file-upload-wrapper">
                                <input
                                  type="file"
                                  id="portrait-file-input"
                                  accept="image/*"
                                  onChange={(event) => handleAssetFileChange('portrait', event.target.files?.[0])}
                                  className="admin-file-input"
                                />
                                <label htmlFor="portrait-file-input" className="admin-file-upload-label">
                                  <div className="d-flex flex-column align-items-center gap-2">
                                    <BiImage size={32} />
                                    <span className="fw-semibold">Click to browse</span>
                                    <span className="small text-muted">or drag and drop</span>
                                  </div>
                                </label>
                              </div>
                            </Form.Group>
                          </div>

                          {/* Progress Bar */}
                          {uploadProgress.portrait > 0 && (
                            <div className="mb-3">
                              <small className="d-flex justify-content-between mb-1">
                                <span>Uploading...</span>
                                <span className="fw-bold">{uploadProgress.portrait}%</span>
                              </small>
                              <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${uploadProgress.portrait}%`,
                                    background: 'linear-gradient(90deg, #0d6efd 0%, #0a58ca 100%)',
                                    transition: 'width 0.3s ease'
                                  }}
                                  aria-valuenow={uploadProgress.portrait}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                />
                              </div>
                            </div>
                          )}

                          {/* Upload Button */}
                          <Button
                            variant="primary"
                            onClick={() => handleUploadAsset('portrait')}
                            disabled={isUploadingAssets.portrait || !assetFiles.portrait}
                            className="w-100"
                            style={{ borderRadius: '10px' }}
                          >
                            {isUploadingAssets.portrait ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <BiPlus className="me-2" />
                                Upload Portrait
                              </>
                            )}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
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

                  <Card className="border-0 admin-panel-card mt-3">
                    <Card.Body className="p-2 p-md-3">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="mb-0 fw-bold">Recent Chat Sessions</h6>
                        <Button variant="outline-primary" size="sm" onClick={() => navigate('/admin/chat')}>
                          Open Chats
                        </Button>
                      </div>

                      {filteredSessions.length === 0 ? (
                        <Alert variant="secondary" className="mb-0">No sessions found.</Alert>
                      ) : (
                        <Table responsive hover className="align-middle mb-0 admin-table">
                          <thead>
                            <tr>
                              <th>Session</th>
                              <th>User</th>
                              <th>Messages</th>
                              <th>Status</th>
                              <th>Last Activity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSessions.slice(0, 8).map((session) => (
                              <tr key={session.session_id}>
                                <td className="fw-semibold">{session.session_id}</td>
                                <td>
                                  <div>{session.user_name || 'Anonymous'}</div>
                                  <div className="small text-muted">{session.user_email || session.user_phone || 'No contact details'}</div>
                                </td>
                                <td>{session.message_count || 0}</td>
                                <td>
                                  {session.human_mode ? <Badge bg="warning" text="dark">Human</Badge> : <Badge bg="info">AI</Badge>}
                                </td>
                                <td className="small text-muted">
                                  {session.last_activity ? new Date(session.last_activity).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>

                  {isAdminRole && (
                    <Accordion className="mt-3 admin-section-accordion admin-danger-accordion">
                      <Accordion.Item eventKey="danger" className="border-danger-subtle bg-danger-subtle">
                        <Accordion.Header>
                          <span className="text-danger fw-bold">Danger Zone</span>
                        </Accordion.Header>
                        <Accordion.Body className="p-3">
                          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
                            <div>
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
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
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

      <Modal show={showSettingsModal} onHide={closeSettingsModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              closeSettingsModal();
              openPasswordModal();
            }}
          >
            Change Password
          </Button>
        </Modal.Body>
      </Modal>
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
