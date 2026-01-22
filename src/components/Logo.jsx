const Logo = ({ className = "", height = "40" }) => {
  return (
    // The SVG container. 'currentColor' allows the text to change based on parent color.
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 280 50" // Wide aspect ratio for the full name+icon
      height={height}
      width="auto"
      className={`brand-logo ${className}`}
      aria-label="Muyiwa Obadara - AI Engineer Logo"
      style={{ fill: 'currentColor' }} // Ensures text adopts text color
    >
      {/* --- DEFS for Gradients (Optional, adds depth) --- */}
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* --- THE ICON GROUP (The "Neural M") --- */}
      <g transform="translate(0, 5)"> {/* Shift down slightly to center with text */}
        
        {/* The connecting lines (Neural Pathways) - Using theme color */}
        <path 
            d="M 5 40 L 25 5 L 45 35 L 65 5 L 85 40" 
            fill="none" 
            stroke="currentColor" /* Adopts Navy in light mode, White in dark */
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="logo-path"
        />

        {/* The Data Nodes (The AI "Sparks") - Always Gold */}
        <circle cx="25" cy="5" r="5" fill="url(#gold-grad)" className="logo-node" />
        <circle cx="45" cy="35" r="5" fill="url(#gold-grad)" className="logo-node" />
        <circle cx="65" cy="5" r="5" fill="url(#gold-grad)" className="logo-node" />
      </g>

      {/* --- THE TEXT GROUP --- */}
      <text 
        x="100" 
        y="35" 
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" 
        fontWeight="800" 
        fontSize="24"
        letterSpacing="1px"
        style={{ textTransform: 'uppercase' }}
      >
      </text>
      
    </svg>
  );
};

export default Logo;