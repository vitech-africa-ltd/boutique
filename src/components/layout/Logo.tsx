import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Background Hexagon */}
      <path 
        d="M50 5L93.3 30V70L50 95L6.7 70V30L50 5Z" 
        fill="#1F2125" 
        stroke="#00A3FF" 
        strokeWidth="2"
      />
      
      {/* Stylized 'V' and 'I' */}
      <path 
        d="M30 35L50 75L70 35" 
        stroke="#00A3FF" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M50 25V30" 
        stroke="#FFFFFF" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      
      {/* Accent Dot */}
      <circle cx="50" cy="25" r="4" fill="#00A3FF" />
      
      {/* Bottom Bar */}
      <rect x="35" y="82" width="30" height="4" rx="2" fill="#00A3FF" fillOpacity="0.5" />
    </svg>
  );
}
