'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';

interface EncouragementBannerProps {
  onViewAchievements?: () => void;
}

export const EncouragementBanner: React.FC<EncouragementBannerProps> = ({ onViewAchievements }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onViewAchievements}
      className="card-clean-white p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* Golden Trophy Icon Box (Rectangular) */}
        <div className="w-13 h-13 rounded-md bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
          <Trophy className="w-6 h-6 stroke-[2.4]" />
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
            You&apos;re doing great!
          </h3>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Small steps today, big wins tomorrow!
          </p>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
    </motion.div>
  );
};
