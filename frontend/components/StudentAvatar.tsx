'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { transitions } from '@/frontend/lib/motion';

export interface AvatarConfig {
  baseStyle?: 'scholar' | 'adventurer' | 'maker' | 'champion';
  bgColor?: string;
  accessoryId?: string | null;
}

interface StudentAvatarProps {
  config?: AvatarConfig;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  config = { baseStyle: 'scholar', bgColor: '#2563eb', accessoryId: null },
  size = 'md',
  className = '',
  interactive = false,
  onClick,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const bgColor = config.bgColor || '#2563eb';
  const baseStyle = config.baseStyle || 'scholar';
  const accessoryId = config.accessoryId;

  const content = (
    <div
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      className={`relative ${sizeMap[size]} rounded-full shadow-md ring-2 ring-white/90 flex items-center justify-center overflow-hidden shrink-0 select-none ${
        interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
    >
      {/* Crisp flat SVG illustration base */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Flat head / skin base */}
        <circle cx="50" cy="54" r="32" fill="#fed7aa" />

        {/* Flat Hair Styles */}
        {baseStyle === 'scholar' && (
          <path
            d="M 18 50 C 18 20, 82 20, 82 50 C 82 36, 70 28, 50 28 C 30 28, 18 36, 18 50 Z"
            fill="#1e293b"
          />
        )}
        {baseStyle === 'adventurer' && (
          <path
            d="M 20 48 C 22 18, 78 18, 80 48 C 80 30, 65 24, 50 24 C 35 24, 20 30, 20 48 Z"
            fill="#854d0e"
          />
        )}
        {baseStyle === 'maker' && (
          <path
            d="M 22 52 C 22 22, 78 22, 78 52 C 78 32, 60 26, 50 26 C 40 26, 22 32, 22 52 Z"
            fill="#334155"
          />
        )}
        {baseStyle === 'champion' && (
          <path
            d="M 16 54 C 18 16, 82 16, 84 54 C 84 30, 68 22, 50 22 C 32 22, 16 30, 16 54 Z"
            fill="#451a03"
          />
        )}

        {/* Flat Eyes & Smile */}
        <circle cx="40" cy="54" r="3.5" fill="#0f172a" />
        <circle cx="60" cy="54" r="3.5" fill="#0f172a" />
        <path
          d="M 43 64 Q 50 71 57 64"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Flat Glasses on scholar style */}
        {baseStyle === 'scholar' && (
          <g stroke="#0f172a" strokeWidth="2.5" fill="none">
            <circle cx="40" cy="54" r="9" />
            <circle cx="60" cy="54" r="9" />
            <line x1="49" y1="54" x2="51" y2="54" />
          </g>
        )}

        {/* Flat Accessories Overlay */}
        {accessoryId === 'headphones' && (
          <g>
            <path
              d="M 20 54 A 30 30 0 0 1 80 54"
              stroke="#2563eb"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="15" y="46" width="10" height="18" rx="4" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
            <rect x="75" y="46" width="10" height="18" rx="4" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
          </g>
        )}

        {accessoryId === 'sunglasses' && (
          <g>
            <rect x="30" y="47" width="18" height="12" rx="2" fill="#0f172a" />
            <rect x="52" y="47" width="18" height="12" rx="2" fill="#0f172a" />
            <line x1="48" y1="52" x2="52" y2="52" stroke="#0f172a" strokeWidth="3" />
          </g>
        )}

        {accessoryId === 'cap' && (
          <g>
            <path d="M 22 36 Q 50 16 78 36 Z" fill="#0891b2" stroke="#0f172a" strokeWidth="2" />
            <path d="M 18 36 L 50 36 L 55 42 L 18 36 Z" fill="#0e7490" stroke="#0f172a" strokeWidth="2" />
          </g>
        )}

        {accessoryId === 'crown' && (
          <g>
            <polygon
              points="30,30 36,18 50,26 64,18 70,30"
              fill="#fbbf24"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <circle cx="50" cy="22" r="2.5" fill="#ef4444" />
          </g>
        )}
      </svg>
    </div>
  );

  if (interactive) {
    return (
      <motion.div whileTap={{ scale: 0.95 }} transition={transitions.snappy}>
        {content}
      </motion.div>
    );
  }

  return content;
};
