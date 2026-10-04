'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { StreakState, StreakDayStatus } from '@/backend/domain/types';

interface StreakWidgetProps {
  streak: StreakState;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ streak }) => {
  const renderDayIndicator = (status: StreakDayStatus) => {
    switch (status) {
      case 'DONE':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#00c853] text-white flex items-center justify-center shadow-xs shadow-[#00c853]/40">
            <Check className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[3.2]" />
          </div>
        );
      case 'TODAY':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#2563eb] text-white flex items-center justify-center font-black text-sm sm:text-base shadow-xs shadow-blue-600/40 ring-2 ring-blue-200">
            T
          </div>
        );
      case 'UPCOMING':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border-2 border-slate-200 bg-slate-50/50 flex items-center justify-center" />
        );
      case 'MISSED':
        return (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={false}
      className="card-clean-white p-4 sm:p-5 lg:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
        {/* Left: Flame Pedestal + Streak text */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3.5">
            {/* Flame Icon with Number inside */}
            <div className="relative w-12 h-14 sm:w-14 sm:h-16 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm overflow-visible">
                <defs>
                  <linearGradient id="flameFire3D" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#DC2626" />
                    <stop offset="35%" stopColor="#EA580C" />
                    <stop offset="75%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>

                  <linearGradient id="flameCore3D" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#EA580C" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="90%" stopColor="#FEF08A" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>

                  <linearGradient id="pedestal3D" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="30%" stopColor="#F59E0B" />
                    <stop offset="85%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                  </linearGradient>
                </defs>

                <ellipse cx="50" cy="116" rx="28" ry="4" fill="#0F172A" opacity="0.12" />
                <ellipse cx="50" cy="112" rx="32" ry="7" fill="url(#pedestal3D)" />
                <rect x="34" y="103" width="32" height="9" rx="2.5" fill="#B45309" />
                <rect x="36" y="102" width="28" height="4" rx="1.5" fill="#FDE68A" opacity="0.8" />

                <path
                  d="M 50 3 Q 78 32 80 64 Q 84 96 50 103 Q 16 96 20 64 Q 22 32 50 3 Z"
                  fill="url(#flameFire3D)"
                />

                <path
                  d="M 50 28 Q 70 52 70 74 Q 70 95 50 99 Q 30 95 30 74 Q 30 52 50 28 Z"
                  fill="url(#flameCore3D)"
                />

                <text
                  x="50"
                  y="85"
                  textAnchor="middle"
                  fontSize="40"
                  fontWeight="900"
                  fill="#FFFFFF"
                  style={{
                    filter: 'drop-shadow(0px 2px 3px rgba(180, 83, 9, 0.6))',
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                  }}
                >
                  {streak.currentStreak}
                </text>
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-base sm:text-lg lg:text-xl">
                <span>Study Streak</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="text-slate-700 text-sm sm:text-base font-semibold mt-0.5">
                <span className="font-black text-indigo-700 text-base sm:text-lg">{streak.currentStreak}</span> days in a row!
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-md bg-amber-400 border border-amber-500/40 text-amber-950 text-xs sm:text-sm font-black shadow-2xs">
            Active
          </div>
        </div>

        {/* Center: 7-Day Pill Strip */}
        <div className="flex-1 max-w-2xl w-full pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 w-full">
            {streak.days.map((d, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-slate-700">{d.dayLabel}</span>
                {renderDayIndicator(d.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Legend Footer */}
        <div className="pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 flex lg:flex-col justify-between sm:justify-center gap-2 lg:gap-2 text-xs sm:text-sm font-bold text-slate-700 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00c853] inline-block shrink-0 shadow-2xs shadow-[#00c853]/50" />
            <span className="text-slate-700">Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block shrink-0 shadow-2xs shadow-blue-600/50" />
            <span className="text-slate-700">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 inline-block shrink-0" />
            <span className="text-slate-700">Upcoming</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
            <span className="text-slate-700">Missed</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
