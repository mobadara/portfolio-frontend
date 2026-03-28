import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AIPlayground from './components/AIPlayground';
import AboutSection from './components/AboutSection';
import Chatbot from './components/Chatbot';
import ContactSection from './components/ContactSection';
import FooterSection from './components/FooterSection';
import HeroSection from './components/HeroSection';
import NavigationBar from './components/NavigationBar';
import BlogSection from './components/BlogSection';
import PortfolioSection from './components/PortfolioSection';
import ServicesSection from './components/ServicesSection';
import SkillsSection from './components/SkillsSection';
import AdminChatPage from './components/AdminChatPage';
import LoadingAnimation from './components/LoadingAnimation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';
import AdminMessages from './pages/AdminMessages';
import AdminMessageDetail from './pages/AdminMessageDetail';
import NotFoundPage from './pages/NotFoundPage';
import AllProjects from './pages/AllProjects';
// import projectsLocalData from './data/projects';
import axios from 'axios';
import './App.css';

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
  const location = useLocation();

  /**
   * Fetch projects from backend API
   * Falls back to local data if API is unavailable
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
   * This allows Bootstrap and CSS custom properties to react to theme changes
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
    }, 2500); // Show loading for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  /**
   * Toggle between light and dark theme modes
   */
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    const sectionId = SECTION_PATHS[location.pathname];
    if (!sectionId || location.pathname.startsWith('/admin')) {
      return;
    }

    const scrollToSection = () => {
      const targetSection = document.getElementById(sectionId);
      if (!targetSection) {
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
    };

    const timer = setTimeout(scrollToSection, 40);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const homeContent = (
    <>
      <LoadingAnimation isLoading={isLoading} />
      <NavigationBar theme={theme} onToggleTheme={toggleTheme} />
      <HeroSection />
      <AboutSection theme={theme} />
      <SkillsSection />
      <PortfolioSection projects={projects} />
      <ServicesSection />
      <AIPlayground />
      <BlogSection />
      <ContactSection />
      <FooterSection />
      <Chatbot />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={homeContent} />
      <Route path="/about" element={homeContent} />
      <Route path="/skills" element={homeContent} />
      <Route path="/portfolio" element={homeContent} />
      <Route path="/blog" element={homeContent} />
      <Route path="/services" element={homeContent} />
      <Route path="/contact" element={homeContent} />
      <Route path="/projects" element={<AllProjects projects={projects} />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/content" element={<AdminContent />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/messages" element={<AdminMessages />} />
      <Route path="/admin/messages/:id" element={<AdminMessageDetail />} />
      <Route path="/admin/chat" element={<AdminChatPage />} />
      <Route path="/admin/chat/:sessionId" element={<AdminChatPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;