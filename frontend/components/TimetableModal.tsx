'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  BookOpen,
  Target,
  Sparkles,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface TimetableSlotData {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  subjectTheme: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  activity: string;
}

interface TimetableResponse {
  success: boolean;
  planTitle?: string;
  mentorNotes?: string | null;
  slots: TimetableSlotData[];
}

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  WEEKDAY: 'Monday – Friday',
};

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Nisa',
}) => {
  const [data, setData] = useState<TimetableResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    setIsLoading(true);

    fetch('/api/timetable')
      .then((res) => res.json())
      .then((resData) => {
        if (!ignore && resData.success) {
          setData(resData);
        }
      })
      .catch((err) => {
        console.error('Failed to load timetable:', err);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const slots = data?.slots || [];

  // Group slots by day of week
  const groupedSlots = slots.reduce<Record<string, TimetableSlotData[]>>(
    (acc, slot) => {
      const day = slot.dayOfWeek || 'WEEKDAY';
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    },
    {}
  );

  const availableDays = Object.keys(groupedSlots);

  const displayedDays =
    selectedDay === 'ALL'
      ? availableDays
      : availableDays.filter((d) => d === selectedDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-blue-200/80 rounded-2xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                {data?.planTitle || 'Weekly Study Timetable'}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Personalized study schedule for {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Mentor Guidance Banner (if available) */}
          {data?.mentorNotes && (
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-semibold text-blue-950 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-blue-900 block mb-0.5">
                  Mentor Davie&apos;s Focus for this Schedule:
                </span>
                &ldquo;{data.mentorNotes}&rdquo;
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold">Loading your active schedule...</span>
            </div>
          ) : slots.length === 0 ? (
            /* Empty State */
            <div className="py-10 text-center space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-sm font-black text-slate-900">No Timetable Set Yet</h3>
              <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
                Your mentor will review your subject ratings and generate your schedule shortly.
              </p>
            </div>
          ) : (
            /* Render Dynamic Grouped Schedule */
            <div className="space-y-4">
              {/* Day Filter Chips (if more than 1 day exists) */}
              {availableDays.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDay('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDay === 'ALL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Days
                  </button>
                  {availableDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedDay === day
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {DAY_LABELS[day] || day}
                    </button>
                  ))}
                </div>
              )}

              {displayedDays.map((day) => {
                const daySlots = groupedSlots[day] || [];
                return (
                  <div key={day} className="space-y-2.5">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span>{DAY_LABELS[day] || day}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {daySlots.length} sessions
                      </span>
                    </span>

                    <div className="space-y-2">
                      {daySlots.map((slot, sIdx) => (
                        <React.Fragment key={slot.id || sIdx}>
                          <div className="p-3.5 rounded-xl bg-white border border-blue-100 hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3 transition">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                {slot.startTime}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-slate-900 truncate">
                                  {slot.subjectName}
                                </h4>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {slot.startTime} &ndash; {slot.endTime} (40 Mins)
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 uppercase tracking-wide ${
                                slot.activity === 'LEARN'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : slot.activity === 'QUIZ'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              {slot.activity === 'LEARN'
                                ? 'Core Study'
                                : slot.activity === 'QUIZ'
                                ? 'Practice Quiz'
                                : 'Review'}
                            </span>
                          </div>

                          {/* 20-min Recharge break after first session */}
                          {sIdx === 0 && daySlots.length > 1 && (
                            <div className="px-3.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-center gap-2 text-amber-900 text-[11px] font-bold">
                              <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>20 min Rest, hydrate &amp; recharge</span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Weekend Review Card */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Saturday &bull; Sunday (Weekend Review)
                </span>
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    REVIEW
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      4 Weekend Spaced Quizzes
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-relaxed">
                      Cumulative spaced retrieval practice consolidating lessons from Monday through Friday into long-term memory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Designed for 40-minute deep focus sessions
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            Got it, Let&apos;s Study
          </button>
        </div>

      </div>
    </div>
  );
};
