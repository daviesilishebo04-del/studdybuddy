'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, FileText, HelpCircle, Play, ClipboardList, Laptop, Video } from 'lucide-react';
import { TodayPlanSession } from '@/backend/domain/types';

interface TodayPlanProps {
  sessions: TodayPlanSession[];
  onStartSession: (session: TodayPlanSession) => void;
  onOpenWeekendReview: () => void;
  onViewFullPlan: () => void;
}

export const TodayPlan: React.FC<TodayPlanProps> = ({
  sessions,
  onStartSession,
  onOpenWeekendReview,
  onViewFullPlan,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100 border border-blue-200/80 flex items-center justify-center text-blue-700 shadow-2xs">
            <Calendar className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Today&apos;s Plan</h2>
            <p className="text-xs font-semibold text-slate-500">You have {sessions.length} study sessions today</p>
          </div>
        </div>

        <button
          onClick={onViewFullPlan}
          className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 transition-colors cursor-pointer group"
        >
          <span>View full plan</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Session Cards (Crisp Pure White Rectangular Cards floating on Sky Blue) */}
      <div className="flex flex-col gap-3">
        {sessions.map((session, idx) => {
          const isMath = session.subjectSlug === 'math';

          const badgeStyle = isMath
            ? 'bg-blue-100/90 text-blue-800 border border-blue-300'
            : 'bg-emerald-100/90 text-emerald-800 border border-emerald-300';

          const iconBoxStyle = isMath
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25';

          const buttonStyle = isMath ? 'btn-pill-blue' : 'btn-pill-green';

          return (
            <motion.div
              key={session.id}
              initial={false}
              className="bg-white rounded-lg p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs border-[1.5px] border-[#b3d1f8]"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                {/* Subject Icon Box (Rectangular) */}
                {isMath ? (
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-md flex items-center justify-center font-black text-base sm:text-lg shadow-xs tracking-tight flex-shrink-0 ${iconBoxStyle}`}>
                    <span className="text-yellow-300">1</span>
                    <span className="text-white">2</span>
                    <span className="text-teal-200">3</span>
                  </div>
                ) : (
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-md flex items-center justify-center shadow-xs flex-shrink-0 p-2.5 ${iconBoxStyle}`}>
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                      <path d="M 50 24 Q 24 18 6 24 L 6 74 Q 24 68 50 77 Z" fill="#FFFFFF" />
                      <path d="M 50 24 Q 76 18 94 24 L 94 74 Q 76 68 50 77 Z" fill="#FFFFFF" />
                      <line x1="50" y1="24" x2="50" y2="77" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
                      <line x1="14" y1="36" x2="42" y2="36" stroke="#99F6E4" strokeWidth="3" strokeLinecap="round" />
                      <line x1="14" y1="46" x2="38" y2="46" stroke="#99F6E4" strokeWidth="3" strokeLinecap="round" />
                      <line x1="58" y1="36" x2="86" y2="36" stroke="#99F6E4" strokeWidth="3" strokeLinecap="round" />
                      <line x1="58" y1="46" x2="82" y2="46" stroke="#99F6E4" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Subject & Topic Text */}
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md w-fit shadow-2xs ${badgeStyle}`}
                  >
                    {session.badgeLabel}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    {session.topicTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-700 text-xs mt-0.5 font-bold">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Study
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Quiz
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Button (Rectangular box) */}
              <button
                onClick={() => onStartSession(session)}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${buttonStyle}`}
              >
                <span>Start</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </motion.div>
          );
        })}

        {/* Weekend Review Tests Card (Warm Yellow/Amber Rectangular Card - Desktop only, shown in 3-box grid on mobile) */}
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={onOpenWeekendReview}
          className="hidden lg:flex bg-[#fef9ee] border-[1.5px] border-[#fde68a] rounded-lg p-4 sm:p-5 items-center justify-between gap-3 cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-md bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ClipboardList className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Weekend Review Tests</h3>
                <span className="bg-indigo-100/80 text-indigo-700 border border-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Sat &amp; Sun
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                4 retrieval practice tests each day to review everything!
              </p>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
        </motion.div>
      </div>
    </div>
  );
};
