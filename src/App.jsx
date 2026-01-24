import { useEffect, useState } from 'react';
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

  /**
   * Sync theme state with document theme attribute
   * This allows Bootstrap and CSS custom properties to react to theme changes
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  /**
   * Toggle between light and dark theme modes
   */
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <>
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
}

export default App;