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
        <linearGradient id="aquaconGreenGrad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="aquaconShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#059669" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Circle Background */}
      <circle cx="250" cy="250" r="235" fill="url(#aquaconGreenGrad)" filter="url(#aquaconShadow)" />
      <circle cx="250" cy="250" r="235" fill="url(#aquaconGreenGrad)" />

      {/* Aqua Text */}
      <text
        x="250"
        y="215"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="118"
        letterSpacing="-1"
      >
        Aqua
      </text>

      {/* Con Text */}
      <text
        x="250"
        y="348"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="118"
        letterSpacing="-1"
      >
        Con
      </text>
    </svg>
  );
};
