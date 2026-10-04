'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DinoMascotProps {
  variant?: 'desk' | 'thumbsup' | 'avatar';
  className?: string;
}

export const DinoMascot: React.FC<DinoMascotProps> = ({ variant = 'desk', className = '' }) => {
  if (variant === 'avatar') {
    return (
      <div className={`relative w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-200 via-green-100 to-white border-2 border-emerald-400/90 overflow-hidden flex items-center justify-center shadow-md shadow-emerald-900/10 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="avatarDino" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="avatarSpike" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          {/* Spikes */}
          <polygon points="50,4 38,24 62,24" fill="url(#avatarSpike)" />
          <polygon points="76,14 62,30 84,38" fill="url(#avatarSpike)" />
          <polygon points="24,14 16,38 38,30" fill="url(#avatarSpike)" />
          {/* Head */}
          <circle cx="50" cy="56" r="38" fill="url(#avatarDino)" />
          {/* Belly Patch */}
          <ellipse cx="50" cy="80" rx="24" ry="14" fill="#BBF7D0" />
          {/* Cheeks */}
          <circle cx="32" cy="62" r="7" fill="#F43F5E" opacity="0.35" />
          <circle cx="68" cy="62" r="7" fill="#F43F5E" opacity="0.35" />
          {/* Left Eye */}
          <circle cx="39" cy="48" r="5.5" fill="#0F172A" />
          <circle cx="37" cy="45" r="2.2" fill="#FFFFFF" />
          {/* Right Winking Eye */}
          <path d="M 57 49 Q 64 41 71 49" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Cheerful Smile */}
          <path d="M 45 61 Q 50 68 55 61" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  if (variant === 'thumbsup') {
    return (
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`w-20 h-20 sm:w-22 sm:h-22 relative flex-shrink-0 ${className}`}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg overflow-visible">
          <defs>
            <linearGradient id="tuSkin" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="60%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="tuSpike" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="tuThumb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>

          {/* Back Spikes */}
          <polygon points="46,4 34,22 58,22" fill="url(#tuSpike)" />
          <polygon points="74,12 60,30 84,36" fill="url(#tuSpike)" />
          <polygon points="20,16 12,38 34,30" fill="url(#tuSpike)" />

          {/* Body & Head */}
          <circle cx="48" cy="54" r="38" fill="url(#tuSkin)" />
          <ellipse cx="48" cy="74" rx="25" ry="16" fill="#BBF7D0" />

          {/* Cheeks */}
          <circle cx="30" cy="60" r="7" fill="#F43F5E" opacity="0.4" />
          <circle cx="66" cy="60" r="7" fill="#F43F5E" opacity="0.4" />

          {/* Open Left Eye */}
          <circle cx="36" cy="46" r="6" fill="#0F172A" />
          <circle cx="34" cy="43" r="2.2" fill="#FFFFFF" />
          <circle cx="38" cy="48" r="1" fill="#FFFFFF" />

          {/* Right Winking Eye */}
          <path d="M 54 48 Q 63 38 72 48" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" fill="none" />

          {/* Big Open Smile with Tongue */}
          <path d="M 40 60 Q 48 76 56 60 Z" fill="#991B1B" />
          <path d="M 44 68 Q 48 76 52 68 Z" fill="#F43F5E" />

          {/* Thumbs Up Hand */}
          <g transform="translate(74, 46)" className="drop-shadow-md">
            {/* Hand Arm */}
            <path d="M 0 16 Q 10 16 16 12" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" />
            {/* Clenched Fist */}
            <ellipse cx="18" cy="14" rx="10" ry="12" fill="url(#tuThumb)" />
            {/* Thumb Sticking Up */}
            <rect x="15" y="-6" width="9" height="18" rx="4.5" fill="url(#tuThumb)" transform="rotate(-10 15 -6)" />
            {/* Thumb knuckle highlight */}
            <ellipse cx="17" cy="-1" rx="2.5" ry="4" fill="#BBF7D0" opacity="0.7" />
          </g>
        </svg>
      </motion.div>
    );
  }

  // Master 'desk' Hero Illustration with 3D Depth & Lighting
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full max-w-[280px] sm:max-w-[310px] aspect-[4/3] mx-auto overflow-visible ${className}`}
    >
      <svg viewBox="0 0 320 240" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          {/* Dino 3D Skin with Ambient Lighting */}
          <radialGradient id="dinoBodyGlow" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="35%" stopColor="#4ADE80" />
            <stop offset="80%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </radialGradient>

          {/* Dino Soft Belly Patch */}
          <linearGradient id="dinoBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DCFCE7" />
            <stop offset="100%" stopColor="#BBF7D0" />
          </linearGradient>

          {/* 3D Spikes Gradient */}
          <linearGradient id="dinoSpike3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="30%" stopColor="#FB923C" />
            <stop offset="85%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>

          {/* Rich Polished Wood Desk Gradient */}
          <linearGradient id="deskWood3D" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="deskRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.6" />
          </linearGradient>

          {/* Pencil Shading */}
          <linearGradient id="pencil3D" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Book Spines & Pages */}
          <linearGradient id="blueBookCover" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="redBookCover" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          {/* Atmospheric Sparkle Glow */}
          <filter id="glowSparkle" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Floating Sparkles in Pastel Sky */}
        <g filter="url(#glowSparkle)" opacity="0.85">
          {/* Top-right Purple Starburst */}
          <path d="M 275 45 L 278 52 L 285 55 L 278 58 L 275 65 L 272 58 L 265 55 L 272 52 Z" fill="#8B5CF6" />
          {/* Top-left Blue Diamond */}
          <path d="M 65 38 L 68 44 L 74 47 L 68 50 L 65 56 L 62 50 L 56 47 L 62 44 Z" fill="#6366F1" />
          {/* Golden Glitter Dots */}
          <circle cx="295" cy="85" r="3.5" fill="#FBBF24" />
          <circle cx="48" cy="82" r="2.5" fill="#EC4899" />
          <circle cx="85" cy="65" r="2" fill="#38BDF8" />
        </g>

        {/* Desk Ambient Drop Shadow */}
        <ellipse cx="160" cy="205" rx="145" ry="25" fill="#0F172A" opacity="0.08" />

        {/* Wooden Desk Curved Surface */}
        <path
          d="M 12 195 Q 160 152 308 195 L 308 240 L 12 240 Z"
          fill="url(#deskWood3D)"
        />
        {/* Desk Top Bevel Highlight */}
        <path
          d="M 12 195 Q 160 152 308 195"
          stroke="url(#deskRim)"
          strokeWidth="3.5"
          fill="none"
        />

        {/* Stack of Books on Right */}
        <g transform="translate(225, 145)">
          {/* Blue Bottom Book */}
          <g transform="translate(0, 32)">
            <rect x="0" y="0" width="72" height="15" rx="3" fill="url(#blueBookCover)" />
            {/* White Paper Pages */}
            <rect x="4" y="3" width="65" height="9" rx="1.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
            <line x1="8" y1="6" x2="62" y2="6" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="8" y1="9" x2="58" y2="9" stroke="#CBD5E1" strokeWidth="1" />
          </g>

          {/* Red Middle Book */}
          <g transform="translate(5, 17)">
            <rect x="0" y="0" width="66" height="14" rx="3" fill="url(#redBookCover)" />
            <rect x="4" y="3" width="59" height="8" rx="1.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
            <line x1="7" y1="6" x2="56" y2="6" stroke="#CBD5E1" strokeWidth="1" />
          </g>

          {/* Golden-Yellow Top Book */}
          <g transform="translate(10, 3)">
            <rect x="0" y="0" width="58" height="13" rx="3" fill="#F59E0B" />
            <rect x="4" y="2.5" width="51" height="7.5" rx="1.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
            <line x1="7" y1="5.5" x2="48" y2="5.5" stroke="#CBD5E1" strokeWidth="1" />
          </g>
        </g>

        {/* Potted Succulent Plant on Left */}
        <g transform="translate(40, 140)">
          {/* Soft Shadow */}
          <ellipse cx="20" cy="55" rx="16" ry="6" fill="#0F172A" opacity="0.15" />
          {/* Purple/Violet Modern Ceramic Pot */}
          <polygon points="10,36 30,36 26,54 14,54" fill="#6366F1" />
          <rect x="8" y="33" width="24" height="6" rx="2.5" fill="#4F46E5" />
          {/* Ceramic glossy highlight */}
          <path d="M 13 38 L 16 52" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          {/* Plump Leaves */}
          <ellipse cx="20" cy="22" rx="5" ry="11" fill="#10B981" />
          <ellipse cx="13" cy="26" rx="4.5" ry="9" transform="rotate(-30 13 26)" fill="#34D399" />
          <ellipse cx="27" cy="26" rx="4.5" ry="9" transform="rotate(30 27 26)" fill="#059669" />
          <circle cx="20" cy="25" r="3" fill="#6EE7B7" />
        </g>

        {/* THE DINOSAUR MASCOT */}
        <g>
          {/* Back Spikes with 3D Depth */}
          <polygon points="172,25 156,52 188,52" fill="url(#dinoSpike3D)" />
          <polygon points="208,42 192,68 220,74" fill="url(#dinoSpike3D)" />
          <polygon points="234,70 218,94 244,102" fill="url(#dinoSpike3D)" />
          <polygon points="132,34 118,58 144,58" fill="url(#dinoSpike3D)" />

          {/* Dino Head & Body Shape */}
          <ellipse cx="170" cy="112" rx="66" ry="62" fill="url(#dinoBodyGlow)" />

          {/* Tummy Light Patch */}
          <ellipse cx="170" cy="138" rx="42" ry="28" fill="url(#dinoBelly)" />

          {/* Cute Rosy Blushing Cheeks */}
          <ellipse cx="136" cy="118" rx="11" ry="8" fill="#F43F5E" opacity="0.4" />
          <ellipse cx="204" cy="118" rx="11" ry="8" fill="#F43F5E" opacity="0.4" />

          {/* Left Eye: Big, Bright & Curious */}
          <ellipse cx="147" cy="98" rx="9.5" ry="12" fill="#0F172A" />
          {/* Primary Specular Light */}
          <circle cx="144" cy="93" r="4.2" fill="#FFFFFF" />
          {/* Secondary Soft Light */}
          <circle cx="151" cy="103" r="1.8" fill="#FFFFFF" />

          {/* Right Eye: Playful, Cheerful Wink */}
          <path
            d="M 186 98 Q 197 86 208 98"
            stroke="#0F172A"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Joyful Warm Smile */}
          <path
            d="M 158 118 Q 172 136 186 118"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Open Workbook lying on the desk */}
        <g transform="translate(105, 155)">
          {/* Book Shadow */}
          <ellipse cx="60" cy="46" rx="58" ry="10" fill="#0F172A" opacity="0.12" />
          {/* Left Page */}
          <path d="M 60 22 Q 30 14 4 19 L 4 43 Q 30 38 60 46 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="12" y1="26" x2="48" y2="26" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="32" x2="45" y2="32" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="38" x2="36" y2="38" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

          {/* Right Page */}
          <path d="M 60 22 Q 90 14 116 19 L 116 43 Q 90 38 60 46 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="72" y1="26" x2="108" y2="26" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="72" y1="32" x2="104" y2="32" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="72" y1="38" x2="92" y2="38" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />

          {/* Book Blue Center Spine */}
          <line x1="60" y1="20" x2="60" y2="47" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        {/* Dino Right Arm & Hand Holding Yellow Pencil */}
        <g transform="translate(126, 75)">
          {/* Arm Arc */}
          <path d="M 28 60 Q 18 42 12 30" stroke="#22C55E" strokeWidth="18" strokeLinecap="round" />
          {/* Yellow Pencil with Realistic 3D Shading */}
          <g transform="rotate(-15 12 25)" className="drop-shadow-md">
            {/* Pencil Shaft */}
            <rect x="7" y="-18" width="11" height="46" rx="2.5" fill="url(#pencil3D)" />
            {/* Pink Rubber Eraser */}
            <rect x="7" y="-26" width="11" height="8" rx="2" fill="#FB7185" />
            {/* Silver Ferrule Band */}
            <rect x="7" y="-19" width="11" height="3" fill="#E2E8F0" />
            <line x1="7" y1="-17.5" x2="18" y2="-17.5" stroke="#94A3B8" strokeWidth="0.8" />
            {/* Sharpened Cedar Wood Cone */}
            <polygon points="7,28 18,28 12.5,42" fill="#FEF3C7" />
            {/* Graphite Tip */}
            <polygon points="10.5,37 14.5,37 12.5,42" fill="#1E293B" />
          </g>
          {/* Green Paw Fingers Wrapping the Pencil */}
          <circle cx="12" cy="22" r="9" fill="#4ADE80" stroke="#16A34A" strokeWidth="1" />
        </g>
      </svg>
    </motion.div>
  );
};
