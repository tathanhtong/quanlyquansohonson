import React from 'react';

interface BadgeProps {
  className?: string;
  size?: number;
}

export const BorderGuardBadge: React.FC<BadgeProps> = ({ className = '', size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md select-none shrink-0 ${className}`}
      aria-label="Biểu trưng Bộ đội Biên phòng Việt Nam"
    >
      <defs>
        <radialGradient id="shieldGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d32f2f" />
          <stop offset="100%" stopColor="#8b0000" />
        </radialGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e5128" />
          <stop offset="100%" stopColor="#0b2b16" />
        </linearGradient>
      </defs>

      {/* Outer Military Wreath (Cành tùng) */}
      <path
        d="M 12,62 C 10,42 22,22 42,12 C 40,24 45,34 50,42 C 34,42 22,50 12,62 Z"
        fill="#2e7d32"
        opacity="0.9"
      />
      <path
        d="M 88,62 C 90,42 78,22 58,12 C 60,24 55,34 50,42 C 66,42 78,50 88,62 Z"
        fill="#2e7d32"
        opacity="0.9"
      />

      {/* Military Shield */}
      <path
        d="M 50,8 L 84,20 C 84,55 68,82 50,92 C 32,82 16,55 16,20 Z"
        fill="url(#shieldGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
      />

      {/* Inner Green Stripe for Border Guard */}
      <path
        d="M 50,15 L 77,25 C 77,52 64,74 50,83 C 36,74 23,52 23,25 Z"
        fill="url(#greenGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="1.5"
      />

      {/* Crossing Swords & Anchor / Frontier Landmark Symbol */}
      <circle cx="50" cy="50" r="24" fill="#8b0000" stroke="url(#goldGrad)" strokeWidth="1.5" />

      {/* Central Vietnam Golden Star */}
      <polygon
        points="50,33 54.5,43 65.5,43.5 56.8,50.5 60.2,61 50,54.5 39.8,61 43.2,50.5 34.5,43.5 45.5,43"
        fill="url(#goldGrad)"
        stroke="#8b6508"
        strokeWidth="0.8"
      />

      {/* Frontier Landmark Posts (Mốc quốc giới) */}
      <path
        d="M 44,72 L 56,72 L 53,60 L 47,60 Z"
        fill="url(#goldGrad)"
        stroke="#5c4308"
        strokeWidth="0.5"
      />

      {/* BĐBP Banner Text Arc */}
      <path
        d="M 28,78 Q 50,90 72,78"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};
