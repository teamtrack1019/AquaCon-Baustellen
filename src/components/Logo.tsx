import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-9 h-9 sm:w-10 sm:h-10', size }) => {
  return (
    <svg
      viewBox="0 0 500 500"
      className={`${className} flex-shrink-0`}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aquaconGreenBg" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <filter id="aquaconShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#047857" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Circle Background */}
      <circle cx="250" cy="250" r="235" fill="url(#aquaconGreenBg)" filter="url(#aquaconShadow)" />
      <circle cx="250" cy="250" r="235" fill="url(#aquaconGreenBg)" />

      {/* Wave Swooshes above 'Con' */}
      <path
        d="M 248 206 C 275 190, 305 194, 328 208 C 344 218, 356 215, 368 188"
        stroke="#7DD3FC"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 258 220 C 280 207, 305 209, 325 221 C 337 228, 347 226, 356 206"
        stroke="#7DD3FC"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Text */}
      <g
        fontFamily="'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="78"
        letterSpacing="-0.5"
      >
        <text x="246" y="286" textAnchor="end" fill="#FFFFFF">
          Aqua
        </text>
        <text x="246" y="286" textAnchor="start" fill="#7DD3FC">
          Con
        </text>
      </g>
    </svg>
  );
};
