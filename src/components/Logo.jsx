import React from 'react';
import './Logo.css';

/**
 * Logo - Circular data science logo with initials MO
 * Combines data science elements with cancer zodiac symbolism
 * @component
 * @param {string} className - Additional CSS classes
 * @param {string} height - SVG height
 * @returns {JSX.Element} Circular animated logo
 */
const Logo = ({ className = "", height = "50" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200"
      height={height}
      width="auto"
      className={`brand-logo ${className}`}
      aria-label="MO Data Science Logo"
      style={{ overflow: 'visible' }} 
    >
      <defs>
        {/* Primary Gradient - Purple to Teal (emotional, data, intuitive) */}
        <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
        </linearGradient>

        {/* Accent Gradient - Teal to Blue (data & intuition) */}
        <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow Effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Text Filter */}
        <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer Circular Border - Cancer Crab Shell */}
      <circle 
        cx="100" 
        cy="100" 
        r="95" 
        fill="none" 
        stroke="url(#primary-grad)" 
        strokeWidth="2"
        opacity="0.6"
        className="logo-outer-ring"
      />

      {/* Inner Circular Border */}
      <circle 
        cx="100" 
        cy="100" 
        r="85" 
        fill="none" 
        stroke="url(#accent-grad)" 
        strokeWidth="1.5"
        opacity="0.4"
        className="logo-inner-ring"
      />

      {/* Background Circle - Soft filled */}
      <circle 
        cx="100" 
        cy="100" 
        r="80" 
        fill="rgba(102, 126, 234, 0.05)" 
      />

      {/* Data Points on Circle Perimeter (representing data and connection) */}
      {/* Top left */}
      <circle 
        cx="45" 
        cy="45" 
        r="4" 
        fill="url(#primary-grad)" 
        filter="url(#glow)"
        className="data-node node-1"
      />
      {/* Top right */}
      <circle 
        cx="155" 
        cy="45" 
        r="4" 
        fill="url(#accent-grad)" 
        filter="url(#glow)"
        className="data-node node-2"
      />
      {/* Right */}
      <circle 
        cx="155" 
        cy="100" 
        r="4" 
        fill="url(#primary-grad)" 
        filter="url(#glow)"
        className="data-node node-3"
      />
      {/* Bottom right */}
      <circle 
        cx="155" 
        cy="155" 
        r="4" 
        fill="url(#accent-grad)" 
        filter="url(#glow)"
        className="data-node node-4"
      />
      {/* Bottom left */}
      <circle 
        cx="45" 
        cy="155" 
        r="4" 
        fill="url(#primary-grad)" 
        filter="url(#glow)"
        className="data-node node-5"
      />
      {/* Left */}
      <circle 
        cx="45" 
        cy="100" 
        r="4" 
        fill="url(#accent-grad)" 
        filter="url(#glow)"
        className="data-node node-6"
      />

      {/* Connection Lines - Network Effect */}
      <line 
        x1="45" 
        y1="45" 
        x2="155" 
        y2="155" 
        stroke="url(#primary-grad)" 
        strokeWidth="1" 
        opacity="0.3"
        className="connection-line line-1"
      />
      <line 
        x1="155" 
        y1="45" 
        x2="45" 
        y2="155" 
        stroke="url(#accent-grad)" 
        strokeWidth="1" 
        opacity="0.3"
        className="connection-line line-2"
      />
      <line 
        x1="45" 
        y1="100" 
        x2="155" 
        y2="100" 
        stroke="url(#primary-grad)" 
        strokeWidth="1" 
        opacity="0.25"
        className="connection-line line-3"
      />

      {/* Central Circle - Heart of data science */}
      <circle 
        cx="100" 
        cy="100" 
        r="35" 
        fill="none" 
        stroke="url(#primary-grad)" 
        strokeWidth="1.5"
        opacity="0.5"
        className="center-circle"
      />

      {/* Cancer Moon Symbol - Subtle crescent at top */}
      <path
        d="M 95 35 Q 100 30 105 35 Q 100 38 95 35"
        fill="url(#accent-grad)"
        opacity="0.3"
        className="moon-symbol"
      />

      {/* Initials MO */}
      <text 
        x="100" 
        y="110" 
        textAnchor="middle" 
        fontSize="52" 
        fontWeight="800" 
        fill="url(#primary-grad)"
        filter="url(#text-glow)"
        className="logo-text"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-3"
      >
        MO
      </text>

      {/* Optional: Subtitle or role indicator */}
      <circle 
        cx="100" 
        cy="155" 
        r="3" 
        fill="url(#accent-grad)" 
        opacity="0.7"
        className="pulse-dot"
      />
    </svg>
  );
};

export default Logo;