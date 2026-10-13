'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, BookOpen, Calendar, Sparkles, GraduationCap, UserCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  userId?: string;
  initialStudentName?: string;
  onComplete: () => void;
}

export type SubjectRating = 'EASY' | 'OK' | 'HARD';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userId,
  initialStudentName = '',
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1 State: Grade & Name
  const [studentName, setStudentName] = useState(initialStudentName);
  const [grade, setGrade] = useState('Grade 8 / Form One');

  // Step 2 State: All 7 Junior Secondary Subjects Active
  const allSubjects = [
    { id: 'math', name: 'Mathematics', tag: 'MATH' },
    { id: 'literature', name: 'Literature in English', tag: 'LIT' },
    { id: 'chemistry', name: 'Integrated Science', tag: 'SCI' },
    { id: 'english-structure', name: 'English Structure', tag: 'ENG' },
    { id: 'history', name: 'History', tag: 'HIST' },
    { id: 'civic-education', name: 'Civic Education', tag: 'CIV' },
    { id: 'religious-education', name: 'Religious Education', tag: 'RE' },
  ];

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'math',
    'literature',
    'chemistry',
    'english-structure',
    'history',
  ]);

  // Step 3 State: 3-tier Honest Difficulty Rating per Subject
  const [subjectRatings, setSubjectRatings] = useState<Record<string, SubjectRating>>({
    math: 'HARD',
    literature: 'OK',
    chemistry: 'HARD',
    'english-structure': 'OK',
    history: 'EASY',
    'civic-education': 'EASY',
    'religious-education': 'EASY',
  });

  if (!isOpen) return null;

  const handleRatingChange = (slug: string, rating: SubjectRating) => {
    setSubjectRatings((prev) => ({
      ...prev,
      [slug]: rating,
    }));
  };

  const handleNext = async () => {
    if (currentStep < 5) {
      if (currentStep === 4) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (_) {}
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const hardSlugs = Object.keys(subjectRatings).filter(
          (k) => subjectRatings[k] === 'HARD'
        );

        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            studentName,
            grade,
            selectedSubjectSlugs: selectedSubjects,
            hardSubjectSlugs: hardSlugs,
            subjectRatings,
          }),
        });

        const data = await res.json();
        if (data.success) {
          onComplete();
        } else {
          alert(`Onboarding error: ${data.error}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        alert(`Failed to save onboarding: ${msg}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const hardCount = selectedSubjects.filter((s) => subjectRatings[s] === 'HARD').length;
  const hardSubjectNames = selectedSubjects
    .filter((s) => subjectRatings[s] === 'HARD')
    .map((s) => allSubjects.find((sub) => sub.id === s)?.name || s);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs">
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-[#eaf2fd] rounded-3xl shadow-2xl shadow-[#0a1f50]/30 w-full max-w-lg overflow-hidden flex flex-col border border-[#bed7fa]"
        >
          {/* Header Step Counter */}
          <div className="p-4 border-b border-[#bed7fa] bg-[#e3effd]/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-700 bg-blue-100/90 px-3 py-1 rounded-full border border-blue-200">
                Step {currentStep} of 5
              </span>
              <span className="text-xs font-extrabold text-slate-800">Student Onboarding</span>
            </div>

            <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* STEP 1: Grade + Name */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/90 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                    <GraduationCap className="w-7 h-7 stroke-[2.4]" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Welcome to StudyBuddy</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">Let&apos;s personalize your study companion.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#bed7fa] bg-[#f4f8fe] focus:bg-white text-base sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. Nisa"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1">Grade / Form</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#bed7fa] bg-[#f4f8fe] focus:bg-white text-base sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. Grade 8 / Form One"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: All 7 Subjects Active */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">What subjects are you taking?</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Select your core school subjects to include in your weekly schedule.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto p-0.5">
                  {allSubjects.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setSelectedSubjects((prev) =>
                            isSelected
                              ? prev.length > 1
                                ? prev.filter((id) => id !== sub.id)
                                : prev
                              : [...prev, sub.id]
                          );
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-100 text-blue-950 ring-2 ring-blue-600/30 shadow-xs'
                            : 'border-[#bed7fa] bg-[#f4f8fe] text-slate-800 hover:border-blue-300 hover:bg-[#eaf2fd]'
                        }`}
                      >
                        <div className="flex flex-col gap-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
                            <span className="truncate">{sub.name}</span>
                          </div>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 w-fit">
                            {sub.tag}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-700 stroke-[3] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: 3-Tier Rating (Easy / OK / Hard) */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">How do you feel about each subject?</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Be honest! Your mentor uses this to prioritize your hardest topics first.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto p-0.5">
                  {selectedSubjects.map((subId) => {
                    const sub = allSubjects.find((s) => s.id === subId);
                    if (!sub) return null;
                    const rating = subjectRatings[subId] || 'OK';

                    return (
                      <div
                        key={subId}
                        className="p-3 rounded-xl border border-[#bed7fa] bg-[#f4f8fe] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <span className="font-extrabold text-xs text-slate-900 truncate">
                          {sub.name}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* EASY */}
                          <button
                            type="button"
                            onClick={() => handleRatingChange(subId, 'EASY')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                              rating === 'EASY'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            Easy
                          </button>

                          {/* OK / FAIR */}
                          <button
                            type="button"
                            onClick={() => handleRatingChange(subId, 'OK')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                              rating === 'OK'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            Fair
                          </button>

                          {/* HARD */}
                          <button
                            type="button"
                            onClick={() => handleRatingChange(subId, 'HARD')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                              rating === 'HARD'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            Hard 🔥
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Personalized Schedule Preview */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Your Structured Daily Timetable</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Spaced across your {selectedSubjects.length} subjects ({hardCount} prioritized for extra focus):
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] shadow-xs">
                    <div className="flex items-center gap-2 font-black text-xs text-blue-900 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Weekdays (Monday – Friday)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      18:00 – 18:40 (Session 1) &bull; 19:00 – 19:40 (Session 2)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      20-minute rest &amp; hydration break between sessions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] shadow-xs">
                    <div className="flex items-center gap-2 font-black text-xs text-blue-900 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Weekends (Saturday &amp; Sunday)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      4 Cumulative Retrieval Quizzes per weekend
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Spaced practice to lock weekday lessons into long-term memory.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Welcome / Launch Screen */}
            {currentStep === 5 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                  <UserCheck className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">All Set, {studentName}!</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-1 max-w-xs mx-auto">
                    Your timetable has been created and sent to your mentor to oversee!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] text-xs text-slate-800 text-left space-y-1.5 shadow-xs">
                  <p><strong>Student:</strong> {studentName} ({grade})</p>
                  <p><strong>Subjects Selected:</strong> {selectedSubjects.length} subjects</p>
                  <p>
                    <strong>High-Priority Focus:</strong>{' '}
                    {hardSubjectNames.length > 0 ? hardSubjectNames.join(', ') : 'Balanced rotation'}
                  </p>
                  <p><strong>Daily Sessions:</strong> 18:00 &amp; 19:00</p>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              disabled={isSubmitting}
              onClick={handleNext}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <>
                  <span>{currentStep < 5 ? 'Continue' : 'Launch My Dashboard'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
