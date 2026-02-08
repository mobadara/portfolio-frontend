import { useState, useEffect } from 'react';
import './LoadingAnimation.css';

/**
 * LoadingAnimation - Data Science themed loading indicator
 * Shows an animated loading screen with neural network and data visualization theme
 * 
 * @param {boolean} isLoading - Whether to show the loading animation
 * @param {number} duration - How long to show loading (ms), 0 = indefinite
 */
const LoadingAnimation = ({ isLoading = true, duration = 0 }) => {
  const [show, setShow] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Static particle positions with varied timing
  const particlePositions = [
    { x: 10, y: 20, duration: 5, delay: 0 },
    { x: 80, y: 15, duration: 6, delay: 0.3 },
    { x: 15, y: 70, duration: 5.5, delay: 0.6 },
    { x: 85, y: 80, duration: 6.5, delay: 0.2 },
    { x: 45, y: 10, duration: 5.2, delay: 0.5 },
    { x: 60, y: 85, duration: 6.2, delay: 0.1 },
    { x: 20, y: 45, duration: 5.8, delay: 0.7 },
    { x: 75, y: 40, duration: 5.5, delay: 0.4 },
    { x: 35, y: 60, duration: 6, delay: 0.8 },
    { x: 65, y: 25, duration: 5.3, delay: 0.3 },
    { x: 25, y: 85, duration: 6.3, delay: 0.6 },
    { x: 80, y: 60, duration: 5.7, delay: 0.2 },
  ];

  useEffect(() => {
    if (isLoading) {
      // Show loading
      const timeoutId = setTimeout(() => {
        setShow(true);
        setFadeOut(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    } else if (show) {
      // Hide loading with fade
      const timeoutId = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShow(false);
          setFadeOut(false);
        }, 600);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, show]);

  // Auto-hide after specified duration
  useEffect(() => {
    if (duration > 0 && show && !fadeOut) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShow(false);
          setFadeOut(false);
        }, 600);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, show, fadeOut]);

  if (!show) return null;

  return (
    <div className={`loading-overlay ${fadeOut ? 'fade-out' : ''}`}>
      {/* Animated Background Grid */}
      <div className="loading-grid">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="grid-item" style={{ '--delay': `${i * 0.05}s` }} />
        ))}
      </div>

      {/* Main Loading Container */}
      <div className="loading-container">
        {/* Central Pulsing Orb */}
        <div className="loading-orb-wrapper">
          <div className="loading-orb">
            <div className="orb-pulse" />
            <div className="orb-inner" />
          </div>

          {/* Orbiting Particles (Neural Network Theme) */}
          <div className="neural-orbit">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="neural-particle"
                style={{
                  '--index': i,
                  '--total': 6,
                }}
              >
                <span className="particle-dot" />
              </div>
            ))}
          </div>

          {/* Connecting Lines */}
          <svg className="neural-lines" viewBox="0 0 200 200">
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const x = 100 + 60 * Math.cos(angle);
              const y = 100 + 60 * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={x}
                  y2={y}
                  className="neural-line"
                  style={{ '--index': i }}
                />
              );
            })}
          </svg>
        </div>

        {/* Loading Text */}
        <div className="loading-text-wrapper">
          <p className="loading-text">
            <span className="loading-word">Loading</span>
            <span className="dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
          <p className="loading-subtext">Analyzing Data</p>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress-bar">
          <div className="progress-fill" />
        </div>
      </div>

      {/* Floating Data Particles */}
      <div className="particles-container">
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              '--duration': `${pos.duration}s`,
              '--delay': `${pos.delay}s`,
              '--x': `${pos.x}%`,
              '--y': `${pos.y}%`,
            }}
          >
            <div className="particle-icon">
              {i % 3 === 0 && '📊'}
              {i % 3 === 1 && '🤖'}
              {i % 3 === 2 && '💻'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAnimation;
