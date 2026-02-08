import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AIPlayground from './components/AIPlayground';
import AboutSection from './components/AboutSection';
import Chatbot from './components/Chatbot';
import ContactSection from './components/ContactSection';
import FooterSection from './components/FooterSection';
import HeroSection from './components/HeroSection';
import NavigationBar from './components/NavigationBar';
import NewsletterSection from './components/NewsletterSection';
import PortfolioSection from './components/PortfolioSection';
import ServicesSection from './components/ServicesSection';
import LoadingAnimation from './components/LoadingAnimation';
import AdminDashboard from './pages/AdminDashboard';
import projects from './data/projects';
import './App.css';

/**
 * App - Root component for the portfolio application.
 * Manages global theme state and orchestrates all page sections.
 * @component
 * @returns {JSX.Element} The complete portfolio application
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

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

  const homeContent = (
    <>
      <LoadingAnimation isLoading={isLoading} />
      <NavigationBar theme={theme} onToggleTheme={toggleTheme} />
      <HeroSection />
      <AboutSection theme={theme} />
      <PortfolioSection projects={projects} />
      <AIPlayground />
      <ServicesSection />
      <NewsletterSection />
      <ContactSection />
      <FooterSection />
      <Chatbot />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={homeContent} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;