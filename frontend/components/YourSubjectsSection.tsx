'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, BookOpen, ChevronRight } from 'lucide-react';

interface YourSubjectsSectionProps {
  onSelectSubject?: (subjectSlug: string) => void;
}

export const YourSubjectsSection: React.FC<YourSubjectsSectionProps> = ({ onSelectSubject }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Your Subjects</h2>
        <span className="text-xs font-semibold text-slate-500">Grade 8 Core Curriculum</span>
      </div>

      {/* 2-Card Grid (Rectangular Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Math Subject Card */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => onSelectSubject?.('math')}
          className="bg-white rounded-lg p-4 sm:p-5 shadow-xs border-[1.5px] border-[#b3d1f8] flex items-center justify-between gap-3.5 cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 w-full">
            {/* Subject Icon Box */}
            <div className="w-13 h-13 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Calculator className="w-6 h-6 stroke-[2.4]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Math</h3>
                <span className="text-xs font-black text-blue-700">70%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-sm overflow-hidden border border-slate-200/50">
                <div
                  className="bg-gradient-to-r from-[#1a68ff] to-[#0052e0] h-full rounded-sm transition-all duration-500"
                  style={{ width: '70%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mt-1.5">
                <span className="text-blue-700 font-extrabold">Keep it up!</span>
                <span>7 / 10 topics</span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </motion.div>

        {/* Literature Subject Card */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => onSelectSubject?.('literature')}
          className="bg-white rounded-lg p-4 sm:p-5 shadow-xs border-[1.5px] border-[#b3d1f8] flex items-center justify-between gap-3.5 cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 w-full">
            {/* Subject Icon Box */}
            <div className="w-13 h-13 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6 stroke-[2.4]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Literature</h3>
                <span className="text-xs font-black text-emerald-700">60%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-sm overflow-hidden border border-slate-200/50">
                <div
                  className="bg-gradient-to-r from-[#00d664] to-[#00a843] h-full rounded-sm transition-all duration-500"
                  style={{ width: '60%' }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mt-1.5">
                <span className="text-emerald-700 font-extrabold">Keep it up!</span>
                <span>6 / 10 topics</span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </motion.div>
      </div>
    </div>
  );
};
