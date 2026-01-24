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

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <>
      <NavigationBar theme={theme} onToggleTheme={toggleTheme} />
      <HeroSection />
      <AboutSection />
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