'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';

interface ProgressCardProps {
  onViewProgress: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ onViewProgress }) => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-100 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shadow-2xs">
            <TrendingUp className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Your Progress</h2>
        </div>

        <button
          onClick={onViewProgress}
          className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors cursor-pointer group"
        >
          <span>View progress</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Main card */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={onViewProgress}
        className="card-clean-white p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-13 h-13 rounded-md bg-gradient-to-tr from-[#1a68ff] to-[#4f46e5] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.6]" />
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              You&apos;re improving! Keep it up
            </h3>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              Keep practicing and you&apos;ll reach your goals!
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
      </motion.div>
    </div>
  );
};
