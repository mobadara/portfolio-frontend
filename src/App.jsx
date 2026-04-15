import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios';
import './App.css';

// Layout & Global Components
import Layout from './components/Layout';

// Page Sections (Home)
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import SkillsSection from './components/SkillsSection';
import PortfolioSection from './components/PortfolioSection';
import ServicesSection from './components/ServicesSection';
import BlogSection from './components/BlogSection';
import ContactSection from './components/ContactSection';

// Pages
import AllProjects from './pages/AllProjects';
import ResumePage from './pages/ResumePage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminMessages from './pages/AdminMessages';
import AdminMessageDetail from './pages/AdminMessageDetail';
import AdminChatPage from './components/AdminChatPage';

// Live Project Pages
import FinBERT from './pages/projects/FinBERT';

const SECTION_PATHS = {
  '/': 'home',
  '/about': 'about',
  '/skills': 'skills',
  '/portfolio': 'portfolio',
  '/blog': 'blog',
  '/services': 'services',
  '/contact': 'contact'
};

/**
 * App - Root component for the portfolio application.
 * Manages global theme state and orchestrates all page sections.
 * @component
 * @returns {JSX.Element} The complete portfolio application
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const location = useLocation();


  /**
   * Fetch projects from backend API
   */
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('https://portfolio-backend-tjq3.onrender.com/api/projects');
        const data = response.data;
        const projectList = Array.isArray(data) ? data : data.projects || [];
        setProjects(projectList);
      } catch (error) {
        console.warn('Failed to fetch projects from backend:', error);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  /**
   * Sync theme state with document theme attribute
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  /**
   * Hide loading animation after initial page load
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Scroll Interceptor for single-page links
  useEffect(() => {
    const sectionId = SECTION_PATHS[location.pathname];
    
    if (!sectionId || location.pathname.startsWith('/admin') || location.pathname === '/projects') {
      setTimeout(() => setRouteLoading(false), 0);
      return;
    }

    const scrollToSection = () => {
      setRouteLoading(true);
      const targetSection = document.getElementById(sectionId);
      if (!targetSection) {
        setRouteLoading(false);
        return;
      }

      const navbarElement = document.querySelector('.navbar-custom');
      const navbarHeight = navbarElement?.offsetHeight ?? 88;
      const sectionTop = targetSection.getBoundingClientRect().top + window.scrollY;
      const scrollTop = Math.max(sectionTop - navbarHeight - 12, 0);

      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      setTimeout(() => setRouteLoading(false), 400);
    };

    const timer = setTimeout(scrollToSection, 40);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Cleaned up homeContent (No layout elements here anymore)
  const homeContent = (
    <>
      <HeroSection />
      <AboutSection theme={theme} />
      <SkillsSection />
      <PortfolioSection projects={projects} setRouteLoading={setRouteLoading} />
      <ServicesSection />
      <BlogSection />
      <ContactSection />
    </>
  );

  return (
    <Routes>
      {/* PUBLIC ROUTES WRAPPED IN LAYOUT */}
      <Route element={<Layout theme={theme} onToggleTheme={toggleTheme} isLoading={isLoading || routeLoading} />}>
        {/* Scrollable Single-Page Routes */}
        <Route path="/" element={homeContent} />
        <Route path="/about" element={homeContent} />
        <Route path="/skills" element={homeContent} />
        <Route path="/portfolio" element={homeContent} />
        <Route path="/blog" element={homeContent} />
        <Route path="/services" element={homeContent} />
        <Route path="/contact" element={homeContent} />
        
        {/* Distinct Pages */}
        <Route 
          path="/projects" 
          element={<AllProjects projects={projects} theme={theme} onToggleTheme={toggleTheme} setRouteLoading={setRouteLoading} />} 
        />
        <Route path="/resume" element={<ResumePage />} />
      </Route>

      {/* ADMIN ROUTES (No Public Header/Footer) */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/messages" element={<AdminMessages />} />
      <Route path="/admin/messages/:id" element={<AdminMessageDetail />} />
      <Route path="/admin/chat" element={<AdminChatPage />} />
      <Route path="/admin/chat/:sessionId" element={<AdminChatPage />} />

      {/* Live Projects Demos */}
      <Route path="/projects/sentiment-analysis-with-bert" element={<FinBERT />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;