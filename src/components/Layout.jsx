import { Outlet } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import FooterSection from './FooterSection';
import Chatbot from './Chatbot';
import LoadingAnimation from './LoadingAnimation';

const Layout = ({ theme, onToggleTheme, isLoading }) => {
  return (
    <div className="app-layout">
      {/* Global Loading Animation */}
      <LoadingAnimation isLoading={isLoading} />
      
      {/* Global Header */}
      <NavigationBar theme={theme} onToggleTheme={onToggleTheme} />
      
      {/* Dynamic Content (Home Page or All Projects Page will render here) */}
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* Global Footer & Chatbot */}
      <FooterSection />
      <Chatbot />
    </div>
  );
};

export default Layout;