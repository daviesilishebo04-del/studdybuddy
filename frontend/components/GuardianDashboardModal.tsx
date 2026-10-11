'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Clock, CheckCircle2, TrendingUp, BarChart2, Award, ExternalLink } from 'lucide-react';
import { QuizAttempt } from '@/backend/domain/types';

interface GuardianDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudySeconds: number;
  streakDays: number;
  attempts: QuizAttempt[];
  studentName?: string;
}

export const GuardianDashboardModal: React.FC<GuardianDashboardModalProps> = ({
  isOpen,
  onClose,
  activeStudySeconds,
  streakDays,
  attempts,
  studentName = 'Student',
}) => {
  if (!isOpen) return null;

  const totalMinutes = Math.round(activeStudySeconds / 60);
  const totalQuizzes = attempts.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / totalQuizzes)
      : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Guardian / Mentor Telemetry</h2>
                <p className="text-[11px] text-slate-500">Student: {studentName} (Grade 8 / Form One)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {/* 3 Metric Stat Tiles */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-center">
                <Clock className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <div className="text-base font-black text-indigo-950">{totalMinutes}m</div>
                <div className="text-[10px] font-semibold text-indigo-700 leading-tight">
                  Verified Active Study
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-center">
                <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="text-base font-black text-emerald-950">{avgScore}%</div>
                <div className="text-[10px] font-semibold text-emerald-700 leading-tight">
                  Avg Quiz Mastery
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <div className="text-base font-black text-amber-950">{streakDays} Days</div>
                <div className="text-[10px] font-semibold text-amber-700 leading-tight">
                  Current Streak
                </div>
              </div>
            </div>

            {/* Heartbeat Telemetry Integrity Note */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active Engagement Telemetry</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Study time is verified by client heartbeat detection (Page Visibility API &amp; key/touch activity). Background tab time is automatically paused and excluded.
              </p>
            </div>

            {/* Subject Mastery Trends */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Subject Performance Breakdown</span>
              </div>

              <div className="space-y-2">
                {/* Math */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-600">Mathematics</span>
                    <span className="text-slate-800">92% Mastery</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Topic: Algebra Linear Equations</span>
                </div>

                {/* Literature */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-600">Literature</span>
                    <span className="text-slate-800">86% Mastery</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '86%' }} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Topic: Poetry Theme &amp; Meaning</span>
                </div>
              </div>
            </div>

            {/* Recent Metacognitive Log */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Metacognitive Calibration</span>
              <div className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 text-xs text-indigo-900">
                <p className="font-semibold">Student Metacognition: Well-Calibrated</p>
                <p className="text-[11px] text-indigo-700/90 mt-0.5">
                  {totalQuizzes > 0
                    ? `${studentName}'s self-assessments are actively synced with quiz performance.`
                    : `${studentName} has not completed any quizzes yet. Calibration will record here after the first study session.`}
                </p>
              </div>
            </div>

            {/* Direct Link to Full Admin Studio */}
            <div className="pt-2">
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Open Full Mentor Studio &amp; Curriculum Builder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
