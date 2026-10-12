'use client';

import React, { useEffect, useState } from 'react';
import { Flame, Clock, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import { CollectibleItem } from '@/frontend/lib/unlocks';

interface ProgressViewProps {
  onStartQuiz?: () => void;
}

interface StudentStats {
  totalMinutes: number;
  quizzesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
}

export const ProgressView: React.FC<ProgressViewProps> = () => {
  const [stats, setStats] = useState<StudentStats>({
    totalMinutes: 0,
    quizzesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok && !ignore) {
          const json = await res.json();
          const headphoneItem = (json.unlockedItems as CollectibleItem[] | undefined)?.find(
            (i) => i.id === 'headphones'
          );
          setStats({
            totalMinutes: 0,
            quizzesCompleted: headphoneItem?.isUnlocked ? 1 : 0,
            currentStreak: json.streak?.currentStreak || 0,
            longestStreak: json.streak?.longestStreak || 0,
            averageScore: 0,
          });
        }
      } catch (err) {
        console.error('Failed to load progress stats:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="rounded-2xl p-6 bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-sm text-slate-800">Loading study progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 max-w-4xl pb-12">
      {/* Header Banner */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
          <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          <span>My Progress</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Study Consistency & Milestones
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-xl">
          Track your personal active study time, consistency streak, and quiz scores.
        </p>
      </section>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-2 shadow-xs">
            <Flame className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats.currentStreak} Days</span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">Current Streak</span>
        </div>

        {/* Study Time */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-2 shadow-xs">
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats.totalMinutes} Mins</span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">Active Time</span>
        </div>

        {/* Quizzes Completed */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats.quizzesCompleted}</span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">Quizzes Solved</span>
        </div>

        {/* Best Streak */}
        <div className="bg-white/95 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-2 shadow-xs">
            <Award className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black text-slate-900">{stats.longestStreak} Days</span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">Best Record</span>
        </div>
      </div>

      {/* Clean Slate Guidance */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
        <h2 className="text-base font-black text-slate-900">How Your Progress Grows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-5 rounded-2xl bg-blue-50/70">
            <span className="text-xs font-bold uppercase text-blue-700 block">1. Read & Practice</span>
            <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">
              Start any topic in Mathematics or Literature from the Home timetable.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-amber-50/70">
            <span className="text-xs font-bold uppercase text-amber-700 block">2. Protect Your Streak</span>
            <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">
              Complete at least one practice quiz every weekday to build your flame.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50/70">
            <span className="text-xs font-bold uppercase text-emerald-700 block">3. Unlock Avatar Gear</span>
            <p className="text-xs font-medium text-slate-600 mt-1.5 leading-relaxed">
              Reaching milestones automatically unlocks hats, glasses, and the mastery crown!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
