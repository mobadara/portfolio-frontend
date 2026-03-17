import React from 'react';
import './Logo.css';

/**
 * Logo - Creative data science & AI engineer symbol
 * Combines a neural network node with a brain circuit pattern
 * @component
 * @param {string} className - Additional CSS classes
 * @param {string} height - SVG height
 * @returns {JSX.Element} Minimalist tech logo
 */
const Logo = ({ className = "", height = "50" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 160 160"
      height={height}
      width="auto"
      className={`brand-logo ${className}`}
      aria-label="Data Science & AI Logo"
      style={{ overflow: 'visible' }} 
    >
      <defs>
        {/* Primary Gradient */}
        <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
        </linearGradient>

        {/* Accent Gradient */}
        <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow Effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Brain/Head Shape - Upper Part */}
      <path 
        d="M 80 20 Q 100 20 110 35 Q 115 50 110 65 L 85 65 Q 80 50 80 40 Q 80 30 80 20"
        fill="url(#primary-grad)"
        opacity="0.1"
        className="brain-shape"
      />
      <path 
        d="M 80 20 Q 60 20 50 35 Q 45 50 50 65 L 75 65 Q 80 50 80 40 Q 80 30 80 20"
        fill="url(#accent-grad)"
        opacity="0.1"
        className="brain-shape"
      />

      {/* Central Core Node - Data */}
      <circle 
        cx="80" 
        cy="80" 
        r="12" 
        fill="url(#primary-grad)"
        filter="url(#glow)"
        className="core-node"
      />
      <circle 
        cx="80" 
        cy="80" 
        r="9" 
        fill="none"
        stroke="url(#primary-grad)"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Satellite Nodes - AI/ML concepts */}
      {/* Machine Learning (left) */}
      <circle 
        cx="40" 
        cy="80" 
        r="7" 
        fill="url(#accent-grad)"
        filter="url(#glow)"
        className="node satellite-1"
      />
      {/* Deep Learning (top) */}
      <circle 
        cx="80" 
        cy="40" 
        r="7" 
        fill="url(#primary-grad)"
        filter="url(#glow)"
        className="node satellite-2"
      />
      {/* Cloud/Engineering (right) */}
      <circle 
        cx="120" 
        cy="80" 
        r="7" 
        fill="url(#accent-grad)"
        filter="url(#glow)"
        className="node satellite-3"
      />
      {/* Analytics (bottom) */}
      <circle 
        cx="80" 
        cy="120" 
        r="7" 
        fill="url(#primary-grad)"
        filter="url(#glow)"
        className="node satellite-4"
      />

      {/* Connection Lines - Neural Network */}
      {/* Center to ML */}
      <line 
        x1="68" 
        y1="80" 
        x2="47" 
        y2="80" 
        stroke="url(#primary-grad)"
        strokeWidth="1.5"
        opacity="0.4"
        className="connection"
      />
      {/* Center to DL */}
      <line 
        x1="80" 
        y1="92" 
        x2="80" 
        y2="47" 
        stroke="url(#accent-grad)"
        strokeWidth="1.5"
        opacity="0.4"
        className="connection"
      />
      {/* Center to Cloud */}
      <line 
        x1="92" 
        y1="80" 
        x2="113" 
        y2="80" 
        stroke="url(#primary-grad)"
        strokeWidth="1.5"
        opacity="0.4"
        className="connection"
      />
      {/* Center to Analytics */}
      <line 
        x1="80" 
        y1="92" 
        x2="80" 
        y2="113" 
        stroke="url(#accent-grad)"
        strokeWidth="1.5"
        opacity="0.4"
        className="connection"
      />

      {/* Cross connections - Knowledge flow */}
      <line 
        x1="48" 
        y1="70" 
        x2="70" 
        y2="50" 
        stroke="url(#primary-grad)"
        strokeWidth="0.8"
        opacity="0.2"
        className="connection"
      />
      <line 
        x1="112" 
        y1="70" 
        x2="90" 
        y2="50" 
        stroke="url(#accent-grad)"
        strokeWidth="0.8"
        opacity="0.2"
        className="connection"
      />
      <line 
        x1="48" 
        y1="90" 
        x2="70" 
        y2="110" 
        stroke="url(#primary-grad)"
        strokeWidth="0.8"
        opacity="0.2"
        className="connection"
      />
      <line 
        x1="112" 
        y1="90" 
        x2="90" 
        y2="110" 
        stroke="url(#accent-grad)"
        strokeWidth="0.8"
        opacity="0.2"
        className="connection"
      />

      {/* Outer Ring - Tech enclosure */}
      <circle 
        cx="80" 
        cy="80" 
        r="70" 
        fill="none" 
        stroke="url(#primary-grad)"
        strokeWidth="1.5"
        opacity="0.3"
        className="outer-ring"
      />

      {/* Corner accents - Tech squares */}
      <g opacity="0.4">
        <rect x="20" y="20" width="8" height="8" fill="url(#accent-grad)" className="corner-accent" />
        <rect x="132" y="20" width="8" height="8" fill="url(#primary-grad)" className="corner-accent" />
        <rect x="20" y="132" width="8" height="8" fill="url(#primary-grad)" className="corner-accent" />
        <rect x="132" y="132" width="8" height="8" fill="url(#accent-grad)" className="corner-accent" />
      </g>
    </svg>
  );
};

export default Logo;