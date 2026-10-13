'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
  AlertCircle,
  Coffee,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';

interface PriorityItem {
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  subjectTheme: string;
  priority: number;
  isHard: boolean;
  rating: 'EASY' | 'OK' | 'HARD';
}

interface SlotItem {
  id: string;
  subjectId: string;
  subject: {
    name: string;
    slug: string;
    colorTheme: string;
  };
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  activity: string;
}

interface PlanItem {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  source: 'AI' | 'MANUAL' | 'FALLBACK';
  mentorNotes?: string | null;
  aiRationale?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  slots: SlotItem[];
}

interface TimetablePlannerProps {
  studentId: string;
  studentName?: string;
}

const DAY_LABELS: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
  WEEKDAY: 'Weekdays',
};

export const TimetablePlanner: React.FC<TimetablePlannerProps> = ({
  studentId,
  studentName = 'Nisa',
}) => {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [publishedPlan, setPublishedPlan] = useState<PlanItem | null>(null);
  const [draftPlan, setDraftPlan] = useState<PlanItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // AI Generation State
  const [mentorNotes, setMentorNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset Onboarding State
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const fetchTimetableData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/timetable?studentId=${studentId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPriorities(data.priorities || []);
        setPublishedPlan(data.publishedPlan || null);
        setDraftPlan(data.draftPlan || null);
      } else {
        setErrorMessage(data.error || 'Failed to load timetable data');
      }
    } catch (err: unknown) {
      console.error('Error fetching timetable data:', err);
      setErrorMessage('Could not connect to timetable service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchTimetableData();
    }
  }, [studentId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          mentorNotes: mentorNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDraftPlan(data.plan);
        setStatusMessage(
          `New schedule draft generated (${data.source === 'AI' ? 'Gemini AI' : 'Rule-Based Fallback'}). Review and publish below!`
        );
      } else {
        setErrorMessage(data.error || 'Failed to generate timetable');
      }
    } catch (err: unknown) {
      console.error('Generation error:', err);
      setErrorMessage('Failed to connect to AI scheduler');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (planId: string) => {
    setIsPublishing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/timetable/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishedPlan(data.plan);
        setDraftPlan(null);
        setStatusMessage('Schedule successfully published! It is now live in the student app.');
      } else {
        setErrorMessage(data.error || 'Failed to publish plan');
      }
    } catch (err: unknown) {
      console.error('Publish error:', err);
      setErrorMessage('Failed to publish timetable');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reset-onboarding`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowResetConfirm(false);
        setStatusMessage(data.message);
        await fetchTimetableData();
      } else {
        setErrorMessage(data.error || 'Failed to reset onboarding');
      }
    } catch (err: unknown) {
      console.error('Reset error:', err);
      setErrorMessage('Error communicating with server');
    } finally {
      setIsResetting(false);
    }
  };

  // Group slots by day
  const groupSlots = (slots: SlotItem[]) => {
    return slots.reduce<Record<string, SlotItem[]>>((acc, s) => {
      const day = s.dayOfWeek || 'WEEKDAY';
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
      return acc;
    }, {});
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Reset Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-4 h-4 stroke-[2.4]" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-950">
              Timetable &amp; AI Planner for {studentName}
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Generate customized study timetables using Gemini AI, review the draft, and publish to {studentName}&apos;s dashboard.
          </p>
        </div>

        {/* Quick Reset Onboarding Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-black uppercase tracking-wider transition cursor-pointer"
            title="Reset onboarding so student experiences fresh first-time setup"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Reset {studentName}&apos;s Onboarding</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Onboarding */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950">
                Reset Onboarding for {studentName}?
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                This clears {studentName}&apos;s onboarding flag and old subject ratings so they experience the onboarding process like the very first time.
              </p>
              <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-2">
                ✓ Their quiz attempts, streaks, and curriculum snaps will be safely kept.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetOnboarding}
                disabled={isResetting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase transition flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Yes, Reset Onboarding</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alerts */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-950 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Left Column = AI Generator & Subjects, Right Column = Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Subject Ratings & AI Generation Form */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Student's Current Subject Ratings */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                {studentName}&apos;s Subject Difficulties
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {priorities.length} subjects
              </span>
            </div>

            {priorities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No subjects rated yet. When {studentName} completes onboarding, their difficulty ratings will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {priorities.map((p) => (
                  <div
                    key={p.subjectId}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-900">{p.subjectName}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        p.rating === 'HARD'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : p.rating === 'OK'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {p.rating === 'HARD' ? 'Hard 🔥' : p.rating === 'OK' ? 'Fair' : 'Easy'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. AI Generator Control Panel */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Generate with Gemini AI
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  Add instructions (e.g. test dates, specific focus)
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={mentorNotes}
              onChange={(e) => setMentorNotes(e.target.value)}
              placeholder="e.g. Teacher announced Algebra test on Friday. Focus heavily on Math and Chemistry, keep Wednesday night lighter."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 text-xs font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white resize-none transition focus:outline-none"
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Optimal Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Weekly Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Draft Plan (Human in the loop) & Published Plan */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* A. DRAFT PLAN (Awaiting Mentor Approval) */}
          {draftPlan && (
            <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-300 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Draft Ready for Review
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Source: {draftPlan.source === 'AI' ? 'Gemini AI' : 'Rule-Based'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-950 mt-1">
                    {draftPlan.title}
                  </h3>
                </div>

                <button
                  onClick={() => handlePublish(draftPlan.id)}
                  disabled={isPublishing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>Publish to {studentName}</span>
                </button>
              </div>

              {/* AI Rationale */}
              {draftPlan.aiRationale && (
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-slate-800 leading-relaxed">
                  <span className="font-black text-amber-950 block mb-0.5">
                    💡 Schedule Rationale:
                  </span>
                  {draftPlan.aiRationale}
                </div>
              )}

              {/* Draft Slots List */}
              <div className="space-y-3">
                {Object.entries(groupSlots(draftPlan.slots)).map(([day, slots]) => (
                  <div key={day} className="space-y-1.5">
                    <span className="text-[11px] font-black text-slate-700 uppercase">
                      {DAY_LABELS[day] || day}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {slots.map((s) => (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-700 text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {s.startTime}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {s.subject.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-500">
                            {s.activity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. CURRENT PUBLISHED PLAN */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Currently Live for {studentName}
                </span>
                <h3 className="text-sm font-black text-slate-950 mt-1">
                  {publishedPlan ? publishedPlan.title : 'Default Scheduled Sessions'}
                </h3>
              </div>
            </div>

            {publishedPlan ? (
              <div className="space-y-3">
                {publishedPlan.mentorNotes && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs font-semibold text-blue-950">
                    <strong>Mentor Notes:</strong> &ldquo;{publishedPlan.mentorNotes}&rdquo;
                  </div>
                )}

                <div className="space-y-3">
                  {Object.entries(groupSlots(publishedPlan.slots)).map(([day, slots]) => (
                    <div key={day} className="space-y-1.5">
                      <span className="text-[11px] font-black text-slate-700 uppercase">
                        {DAY_LABELS[day] || day}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {slots.map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-black text-blue-700 text-[11px] bg-white px-1.5 py-0.5 rounded border border-blue-200">
                                {s.startTime}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {s.subject.name}
                              </span>
                            </div>
                            <span className="text-[9px] font-black uppercase text-slate-500">
                              {s.activity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">
                  No published AI plan yet. Click &ldquo;Generate Weekly Plan&rdquo; on the left to create one!
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
