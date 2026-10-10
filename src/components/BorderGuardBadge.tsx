import React from 'react';
import logoUrl from '../assets/logobp.svg';

interface BadgeProps {
  className?: string;
  size?: number;
}

export const BorderGuardBadge: React.FC<BadgeProps> = ({ className = '', size = 52 }) => {
  return (
    <img
      src={logoUrl}
      alt="Biểu trưng Bộ đội Biên phòng Việt Nam"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${110}px` }}
      className={`object-contain select-none shrink-0 ${className}`}
      draggable={false}
    />
  );
};
