'use client';

import React from 'react';
import { Calendar, Clock, Coffee, BookOpen, Target, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Nisa',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="w-full max-w-lg bg-white border-2 border-blue-900 rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Study Timetable</h2>
              <p className="text-xs font-semibold text-slate-500">Automated daily schedule for {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Schedule Explanation Card */}
        <div className="mt-4 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 leading-relaxed">
          <span className="font-black text-blue-950 block mb-0.5">⚡ How Daily Missions Work:</span>
          Sessions are automatically prioritized each day. Harder subjects appear first while energy is highest, followed by spaced retrieval practice.
        </div>

        {/* Weekday Schedule Timeline */}
        <div className="mt-5 space-y-3">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
            Monday &bull; Tuesday &bull; Wednesday &bull; Thursday &bull; Friday
          </span>

          {/* Slot 1: Mathematics */}
          <div className="p-3.5 rounded-lg bg-white border-2 border-blue-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              18:00
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 uppercase tracking-wide">
                  Session 1 &bull; 40 Mins
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800 border border-blue-200">
                  Priority Hard
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Mathematics (Algebra / Arithmetic)</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Core notes study, video module breakdown, and a 5-question mastery quiz.
              </p>
            </div>
          </div>

          {/* Break: 18:40 - 19:00 */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-700">18:40 &ndash; 19:00 (20 min Break)</span>
              <span className="text-[11px] text-slate-500 block">Rest, stretch, and hydrate before session 2.</span>
            </div>
          </div>

          {/* Slot 2: Literature / Integrated Science */}
          <div className="p-3.5 rounded-lg bg-white border-2 border-emerald-200 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              19:00
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  Session 2 &bull; 40 Mins
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Core Subject
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">Literature &amp; Reading Comprehension</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Vocabulary expansion, poem analysis, and one-word precision answers.
              </p>
            </div>
          </div>
        </div>

        {/* Weekend Schedule Timeline */}
        <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
            Saturday &bull; Sunday (Weekend Review)
          </span>

          <div className="p-3.5 rounded-lg bg-amber-50 border-2 border-amber-300 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              WEEKEND
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Cumulative Retrieval
              </span>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">4 Weekend Review Quizzes</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Spaced repetition tests to consolidate all lessons learned Monday through Friday into long-term memory.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            Got it, Let&apos;s Study
          </button>
        </div>

      </div>
    </div>
  );
};
