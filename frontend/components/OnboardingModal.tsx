'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, BookOpen, Calendar, Sparkles, GraduationCap, UserCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  userId?: string;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  userId = 'student-alex',
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1 State: Grade & Name
  const [studentName, setStudentName] = useState('Alex');
  const [grade, setGrade] = useState('Grade 8 / Form One');

  // Step 2 State: Exact 7 Subjects (Confirmed: math, history, civic education, english structure, literature, chemistry, religious education)
  const allSubjects = [
    { id: 'math', name: 'Mathematics', active: true, tag: 'MATH' },
    { id: 'literature', name: 'Literature', active: true, tag: 'LITERATURE' },
    { id: 'history', name: 'History', active: false },
    { id: 'civic-education', name: 'Civic Education', active: false },
    { id: 'english-structure', name: 'English Structure', active: false },
    { id: 'chemistry', name: 'Chemistry', active: false },
    { id: 'religious-education', name: 'Religious Education', active: false },
  ];
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['math', 'literature', 'history']);

  // Step 3 State: Self-Reported Hard Subjects (bootstraps priority to 1.0)
  const [hardSubjects, setHardSubjects] = useState<string[]>(['math']);

  // Step 4 State: Generated Timetable (Defaults)
  const [weekdaySlots] = useState('18:00 - 18:40 (Math) & 19:00 - 19:40 (Literature)');
  const [weekendSlots] = useState('4 retrieval review tests per day (Sat & Sun)');

  if (!isOpen) return null;

  const handleNext = async () => {
    if (currentStep < 5) {
      if (currentStep === 4) {
        // Trigger celebratory confetti when transitioning to Step 5 (confetti can stay multi-colored)
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
      // Step 5: Persist directly to real PostgreSQL via /api/onboarding
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            studentName,
            grade,
            selectedSubjectSlugs: selectedSubjects,
            hardSubjectSlugs: hardSubjects,
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs">
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-[#eaf2fd] rounded-3xl shadow-2xl shadow-[#0a1f50]/30 w-full max-w-lg overflow-hidden flex flex-col border border-[#bed7fa]"
        >
          {/* Header Step Counter: Exactly 5 Steps with Blue Progress Bar */}
          <div className="p-4 border-b border-[#bed7fa] bg-[#e3effd]/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-700 bg-blue-100/90 px-3 py-1 rounded-full border border-blue-200">
                Step {currentStep} of 5
              </span>
              <span className="text-xs font-extrabold text-slate-800">Student Onboarding</span>
            </div>

            {/* Blue Progress Bar */}
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
                      className="w-full p-3 rounded-xl border border-[#bed7fa] bg-[#f4f8fe] focus:bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. Alex"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 block mb-1">Grade / Form</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#bed7fa] bg-[#f4f8fe] focus:bg-white text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      placeholder="e.g. Grade 8 / Form One"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Exact 7 Subjects (Card-Grid Selection) */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">What subjects do you take?</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Select your subjects. Math and Literature are currently active.
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
                            isSelected ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
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
                          <div className="flex items-center gap-1">
                            {sub.tag === 'MATH' && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                Math
                              </span>
                            )}
                            {sub.tag === 'LITERATURE' && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Lit
                              </span>
                            )}
                            {!sub.active && (
                              <span className="text-[9px] font-medium text-slate-500">
                                Scheduled
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-700 stroke-[3] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Self-Reported Hard Subjects */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Which subjects do you find hardest?</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Tap any subject to mark it for extra practice (bootstraps priority to 1.0).
                  </p>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto p-0.5">
                  {selectedSubjects.map((subId) => {
                    const sub = allSubjects.find((s) => s.id === subId);
                    if (!sub) return null;
                    const isHard = hardSubjects.includes(subId);

                    return (
                      <button
                        key={subId}
                        type="button"
                        onClick={() => {
                          setHardSubjects((prev) =>
                            isHard ? prev.filter((id) => id !== subId) : [...prev, subId]
                          );
                        }}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isHard
                            ? 'border-blue-600 bg-blue-100 text-blue-950 ring-2 ring-blue-600/30 shadow-xs'
                            : 'border-[#bed7fa] bg-[#f4f8fe] text-slate-800 hover:border-blue-300'
                        }`}
                      >
                        <span className="font-extrabold">{sub.name}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                            isHard
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-[#eaf2fd] text-slate-700 border-[#bed7fa]'
                          }`}
                        >
                          {isHard ? 'Priority: 1.0 (Hard)' : 'Priority: 0.3'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Generated Default Timetable */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Recommended Study Timetable</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Structured sessions designed for high retention:
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] shadow-xs">
                    <div className="flex items-center gap-2 font-black text-xs text-blue-900 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Weekdays (Mon - Fri)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{weekdaySlots}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] shadow-xs">
                    <div className="flex items-center gap-2 font-black text-xs text-blue-900 mb-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Weekends (Sat &amp; Sun)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{weekendSlots}</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Welcome / Confirmation Screen */}
            {currentStep === 5 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                  <UserCheck className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">All Set, {studentName}!</h3>
                  <p className="text-xs font-semibold text-slate-700 mt-1 max-w-xs mx-auto">
                    Your personalized plan is ready. Today we will focus on your priority subjects!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f4f8fe] border border-[#bed7fa] text-xs text-slate-800 text-left space-y-1.5 shadow-xs">
                  <p><strong>Student:</strong> {studentName} ({grade})</p>
                  <p><strong>Priority Focus:</strong> Math &amp; Literature</p>
                  <p><strong>Scheduled Slots:</strong> 18:00 - 18:40 &amp; 19:00 - 19:40</p>
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
                  <span>Saving to Database...</span>
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
