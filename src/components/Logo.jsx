import React from 'react';

const Logo = ({ className = "", height = "40" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 90 45" // Adjusted ViewBox to fit ONLY the icon (removed empty text space)
      height={height}
      width="auto"
      className={`brand-logo ${className}`}
      aria-label="AI Neural Logo"
      style={{ fill: 'currentColor', overflow: 'visible' }} 
    >
      <defs>
        {/* Gold Gradient */}
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        </linearGradient>

        {/* Glow Filter for the Pulse */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* --- THE ICON GROUP --- */}
      <g>
        {/* The connecting path (The M) */}
        <path 
            d="M 5 40 L 25 5 L 45 35 L 65 5 L 85 40" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="logo-path"
        />

        {/* The Nodes - Added IDs for staggered animation */}
        <circle id="node-1" cx="25" cy="5" r="5" fill="url(#gold-grad)" className="logo-node" />
        <circle id="node-2" cx="45" cy="35" r="5" fill="url(#gold-grad)" className="logo-node" />
        <circle id="node-3" cx="65" cy="5" r="5" fill="url(#gold-grad)" className="logo-node" />
      </g>
    </svg>
  );
};

export default Logo;