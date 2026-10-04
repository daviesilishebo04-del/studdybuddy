'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy, ClipboardList, ChevronRight } from 'lucide-react';

interface MobileQuickStatsRowProps {
  onViewProgress: () => void;
  onViewAchievements: () => void;
  onOpenWeekendReview: () => void;
}

export const MobileQuickStatsRow: React.FC<MobileQuickStatsRowProps> = ({
  onViewProgress,
  onViewAchievements,
  onOpenWeekendReview,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:hidden">
      {/* ============================================================ */}
      {/* Box 1: You're improving!                                     */}
      {/* ============================================================ */}
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onViewProgress}
        className="bg-white rounded-md p-2.5 sm:p-3.5 flex flex-col justify-between gap-2 cursor-pointer shadow-xs border-[1.5px] border-[#b3d1f8]"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gradient-to-tr from-[#1a68ff] to-[#4f46e5] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.6]" />
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex flex-col">
          <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
            You&apos;re improving!
          </h4>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 line-clamp-1">
            Keep it up!
          </p>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* Box 2: You're doing great!                                   */}
      {/* ============================================================ */}
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onViewAchievements}
        className="bg-white rounded-md p-2.5 sm:p-3.5 flex flex-col justify-between gap-2 cursor-pointer shadow-xs border-[1.5px] border-[#b3d1f8]"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex flex-col">
          <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
            You&apos;re doing great!
          </h4>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 line-clamp-1">
            Small steps today!
          </p>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* Box 3: Weekend Review Tests                                  */}
      {/* ============================================================ */}
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onOpenWeekendReview}
        className="bg-[#fef9ee] border-[1.5px] border-[#fde68a] rounded-md p-2.5 sm:p-3.5 flex flex-col justify-between gap-2 cursor-pointer shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="bg-indigo-100/80 text-indigo-700 border border-indigo-200 text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
            Sat &amp; Sun
          </span>
        </div>

        <div className="flex flex-col">
          <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-tight">
            Weekend Review
          </h4>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-600 mt-0.5 line-clamp-1">
            4 tests each day
          </p>
        </div>
      </motion.div>
    </div>
  );
};
