'use client';

import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  StudentOverview,
  WeeklyPerformance,
} from '@/backend/repositories/adminRepository';

interface PerformanceOverviewProps {
  overview: StudentOverview;
  initialPerformance: WeeklyPerformance;
}

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  overview,
  initialPerformance,
}) => {
  const [performance, setPerformance] = useState<WeeklyPerformance>(initialPerformance);
  const [weekStart, setWeekStart] = useState<string>(initialPerformance.weekStart);
  const [isLoadingWeek, setIsLoadingWeek] = useState<boolean>(false);

  const handleNavigateWeek = async (deltaDays: number) => {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + deltaDays);
    const newWeekStartStr = currentDate.toISOString().split('T')[0];

    setIsLoadingWeek(true);
    try {
      const res = await fetch(`/api/admin/performance?weekStart=${newWeekStartStr}`);
      if (res.ok) {
        const data = await res.json();
        setPerformance(data);
        setWeekStart(newWeekStartStr);
      }
    } catch (err) {
      console.error('Failed to load week performance:', err);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}, ${end.getFullYear()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Student Welcome & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-md p-5 sm:p-6 border border-blue-300/80 shadow-xs relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span>Pupil Profile</span> • <span>{overview.grade}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            {overview.name}&apos;s Learning Tracker
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Real-time telemetry on daily attendance, quiz accuracy, and subject mastery.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="bg-blue-50/80 border border-blue-200 px-4 py-2.5 rounded-md text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 block">
              Longest Streak
            </span>
            <span className="text-lg font-black text-slate-950">{overview.longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Current Streak
            </span>
            <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {overview.currentStreak}{' '}
              <span className="text-xs font-bold text-slate-400">days</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Consecutive study days</p>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Active Time
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {overview.totalStudyMinutes}{' '}
              <span className="text-xs font-bold text-slate-400">mins</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Tracked study sessions</p>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {overview.averageScore}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Across all quiz attempts</p>
          </div>
        </div>

        {/* Quizzes Taken */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Quizzes Taken
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950">
              {overview.totalQuizzes}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Completed evaluations</p>
          </div>
        </div>
      </div>

      {/* Weekly Heatmap Matrix */}
      <div className="bg-white rounded-md p-5 sm:p-6 border border-blue-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Attendance &amp; Performance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Identifies which days he studied and which days were missed.
            </p>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-200/80 p-1.5 rounded-md self-start sm:self-auto">
            <button
              onClick={() => handleNavigateWeek(-7)}
              disabled={isLoadingWeek}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 disabled:opacity-50 transition cursor-pointer border border-transparent hover:border-blue-200"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[150px] text-center">
              {isLoadingWeek ? 'Loading...' : formatDateRange(performance.weekStart, performance.weekEnd)}
            </span>
            <button
              onClick={() => handleNavigateWeek(7)}
              disabled={isLoadingWeek}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 hover:text-slate-900 disabled:opacity-50 transition cursor-pointer border border-transparent hover:border-blue-200"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto mt-5">
          <table className="w-full text-left min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-40">
                  Subject
                </th>
                {performance.days.map((d) => (
                  <th key={d.date} className="pb-3 text-center">
                    <span className="text-xs font-black text-slate-800 block">
                      {d.dayLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {d.date.slice(5)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performance.subjectSummaries.map((subj) => (
                <tr key={subj.subjectId} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 text-xs font-extrabold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                      {subj.subjectName}
                    </div>
                  </td>

                  {performance.days.map((day) => {
                    const statusObj = day.subjects.find(
                      (s) => s.subjectId === subj.subjectId
                    );
                    const status = statusObj?.status ?? 'UPCOMING';
                    const score = statusObj?.scorePercent;

                    return (
                      <td key={day.date} className="py-3.5 text-center">
                        {status === 'DONE' && (
                          <div className="inline-flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-300/80 px-2.5 py-1.5 rounded-md min-w-[54px]">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            {score !== undefined && (
                              <span className="text-[10px] font-black mt-0.5">
                                {score}%
                              </span>
                            )}
                          </div>
                        )}
                        {status === 'MISSED' && (
                          <div className="inline-flex flex-col items-center justify-center bg-rose-50 text-rose-700 border border-rose-300/80 px-2.5 py-1.5 rounded-md min-w-[54px]">
                            <XCircle className="w-4 h-4 stroke-[2.2]" />
                            <span className="text-[9px] font-bold mt-0.5">Missed</span>
                          </div>
                        )}
                        {status === 'UPCOMING' && (
                          <div className="inline-flex items-center justify-center bg-slate-50 text-slate-400 border border-dashed border-slate-300 px-2.5 py-2.5 rounded-md min-w-[54px]">
                            <span className="text-[10px] font-medium">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-5 pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Completed (Quiz taken)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-xs bg-rose-500" />
            <span>Missed Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-xs bg-slate-300" />
            <span>Upcoming / Future</span>
          </div>
        </div>
      </div>

      {/* Two Column: Subject Breakdown & Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Subject Mastery Breakdown */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-blue-200/80 shadow-xs">
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Subject Breakdown
          </h3>
          <div className="space-y-3.5">
            {performance.subjectSummaries.map((subj) => (
              <div
                key={subj.subjectId}
                className="p-3.5 rounded-md bg-blue-50/40 border border-blue-200/60"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-slate-900 font-black">{subj.subjectName}</span>
                  <span className="text-blue-700 font-extrabold">{subj.averageScore}% avg</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-blue-100 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-xs transition-all"
                    style={{ width: `${Math.min(100, subj.averageScore)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-semibold">
                  <span>{subj.quizCount} quizzes completed</span>
                  <span>{subj.totalStudyMinutes} mins studied</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attempts Activity Log */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-blue-200/80 shadow-xs">
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-blue-600" />
            Recent Quiz Attempts
          </h3>
          {overview.recentAttempts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No recent quiz attempts found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {overview.recentAttempts.slice(0, 5).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-md bg-white border border-blue-200/70"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900">
                      Score: {attempt.scorePercent}% ({attempt.correctCount}/
                      {attempt.totalQuestions})
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.selfRating && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase border border-slate-200">
                        {attempt.selfRating}
                      </span>
                    )}
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-md border ${
                        attempt.scorePercent >= 70
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : attempt.scorePercent >= 50
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {attempt.scorePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
