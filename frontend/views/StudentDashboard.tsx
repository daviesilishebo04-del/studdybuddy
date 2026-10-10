'use client';

import React, { useState } from 'react';
import { Menu, Bell, Shield, ChevronDown, Camera } from 'lucide-react';
import { DesktopSidebar, DesktopNavTab, CurrentUser } from '../components/DesktopSidebar';
import { StreakWidget } from '../components/StreakWidget';
import { TodayPlan } from '../components/TodayPlanCard';
import { ProgressCard } from '../components/ProgressCard';
import { EncouragementBanner } from '../components/EncouragementBanner';
import { MobileQuickStatsRow } from '../components/MobileQuickStatsRow';
import { YourSubjectsSection } from '../components/YourSubjectsSection';
import { BottomNav, NavTab } from '../components/BottomNav';
import { StudyModal } from '../components/StudyModal';
import { GuardianDashboardModal } from '../components/GuardianDashboardModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { CurriculumUploadModal } from '../components/CurriculumUploadModal';
import { TimetableModal } from '../components/TimetableModal';
import {
  StreakState,
  TodayPlanSession,
  Topic,
  Question,
  QuizAttempt,
} from '@/backend/domain/types';

interface StudentDashboardProps {
  currentUser?: CurrentUser;
  initialStreak: StreakState;
  initialPlan: TodayPlanSession[];
  topics: Topic[];
  questions: Question[];
  initialOnboardingNeeded?: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  initialStreak,
  initialPlan,
  topics,
  questions,
  initialOnboardingNeeded = false,
}) => {
  const [activeTab, setActiveTab] = useState<DesktopNavTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [streak, setStreak] = useState<StreakState>(initialStreak);
  const [plan, setPlan] = useState<TodayPlanSession[]>(initialPlan);
  const [activeSession, setActiveSession] = useState<TodayPlanSession | null>(null);
  const [isGuardianOpen, setIsGuardianOpen] = useState<boolean>(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(initialOnboardingNeeded);
  const [isTimetableOpen, setIsTimetableOpen] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activeStudySeconds, setActiveStudySeconds] = useState<number>(16200);

  const studentName = currentUser?.name || 'Alex';
  const firstName = studentName.split(' ')[0];
  const initialLetters = studentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SB';
  const studentGrade = currentUser?.grade || 'Grade 8';

  const handleStartSession = (session: TodayPlanSession) => {
    setActiveSession(session);
  };

  const handleQuizCompleted = () => {
    if (activeSession) {
      setPlan((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, status: 'COMPLETED' } : s))
      );
      setStreak((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.status === 'TODAY' ? { ...d, status: 'DONE' } : d)),
      }));
      setActiveStudySeconds((prev) => prev + 900);
    }
  };

  const currentTopic = activeSession
    ? topics.find((t) => t.id === activeSession.topicId) || topics[0]
    : topics[0];

  const currentQuestions = activeSession
    ? questions.filter((q) => q.topicId === activeSession.topicId)
    : questions;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d7e6fc] via-[#cce0fb] to-[#bfd8f9] text-slate-900 antialiased font-sans flex flex-row relative selection:bg-[#2563eb] selection:text-white">
      
      {/* ============================================================ */}
      {/* 1. DESKTOP SIDEBAR (Visible on lg, Drawer on < lg)          */}
      {/* ============================================================ */}
      <DesktopSidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'profile' || tab === 'progress') {
            setIsGuardianOpen(true);
          }
          if (tab === 'curriculum') {
            setIsCurriculumOpen(true);
          }
        }}
        onOpenGuardian={() => setIsGuardianOpen(true)}
        onOpenCurriculum={() => setIsCurriculumOpen(true)}
        onOpenWeekendReview={() => {
          alert('Weekend Review: Cumulative retrieval tests cover all weekday topics (4 sessions per day).');
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* ============================================================ */}
      {/* 2. MAIN APP CONTENT AREA                                      */}
      {/* ============================================================ */}
      <div className="flex-1 min-h-screen flex flex-col relative overflow-x-hidden pb-20 lg:pb-8">
        
        {/* Subtle Sky Atmospheric Luminous Glow */}
        <div className="absolute top-0 left-0 w-full h-[360px] pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-24 left-1/4 w-[650px] h-[350px] bg-white/50 rounded-full blur-3xl" />
          <div className="absolute top-16 right-10 w-[550px] h-[320px] bg-blue-300/30 rounded-full blur-3xl" />
        </div>

        {/* --- MOBILE HEADER (Fixed at top, strictly pinned, never moves) --- */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-blue-300/70 shadow-xs px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-95 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 stroke-[2.4]" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer min-w-0" onClick={() => setActiveTab('home')}>
              <span className="font-black text-slate-950 text-base sm:text-xl tracking-tight shrink-0">StudyBuddy</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 truncate">
                {studentGrade.includes('Form') ? 'Form 1' : 'Grade 8'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsCurriculumOpen(true)}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-slate-50 border border-blue-200 flex items-center justify-center text-blue-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Send Class Pages"
              title="Snap & Send Class Pages"
            >
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              onClick={() => alert(`Notifications: Your daily sessions are ready!`)}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-slate-50 border border-blue-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <div
              onClick={() => setIsGuardianOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white border-2 border-white text-xs font-black flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform"
              title={`Student Profile: ${studentName}`}
            >
              <span>{initialLetters}</span>
            </div>
          </div>
        </header>

        {/* --- DESKTOP TOP BAR (Visible on >= lg, compact and aligned with content) --- */}
        <div className="hidden lg:flex w-full items-center justify-end px-6 lg:px-8 pt-3 pb-1 z-20">
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => alert(`Notifications: Your daily sessions are ready!`)}
              className="relative w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-blue-300/80 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Student Profile Pill */}
            <div
              onClick={() => setIsGuardianOpen(true)}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white hover:bg-blue-50/50 border border-blue-300/80 text-slate-900 cursor-pointer shadow-2xs transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {initialLetters[0]}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-black text-slate-900">Hi, {firstName}</span>
                <span className="text-[10px] font-bold text-slate-500">{studentGrade}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </div>
          </div>
        </div>

        {/* --- MAIN DASHBOARD BODY (Eliminating the gap next to sidebar & tightening vertical flow) --- */}
        <main className="flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-18 lg:pt-2 py-2 sm:py-3 flex flex-col gap-4 relative z-10">
          
          {/* ============================================================ */}
          {/* 1. HERO SECTION (Spanning alone horizontally across the row) */}
          {/* ============================================================ */}
          <section className="w-full flex flex-col justify-center pt-1 sm:pt-2 px-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-blue-700 uppercase tracking-wider">
              <span>Hey Champ!</span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-slate-950 tracking-tight leading-tight mt-1">
              Let&apos;s learn <span className="text-blue-700">something</span> awesome today!
            </h1>

            <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1 max-w-2xl leading-relaxed">
              Stay consistent and you&apos;ll reach your goals!
            </p>
          </section>

          {/* ============================================================ */}
          {/* 2. STUDY STREAK WIDGET (Follows below Hero)                  */}
          {/* ============================================================ */}
          <section className="w-full">
            <StreakWidget streak={streak} />
          </section>

          {/* ============================================================ */}
          {/* ROW 2: TODAY'S PLAN + PROGRESS & ENCOURAGEMENT (from Image 2)  */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            {/* Today's Plan Left (7 cols on desktop) */}
            <section className="lg:col-span-7">
              <TodayPlan
                sessions={plan}
                onStartSession={handleStartSession}
                onOpenWeekendReview={() => {
                  alert('Weekend Review: Cumulative retrieval tests cover all weekday topics (4 sessions per day).');
                }}
                onViewFullPlan={() => setIsTimetableOpen(true)}
              />
            </section>

            {/* Progress Card & Encouragement Banner Right (5 cols on desktop, hidden on mobile) */}
            <section className="hidden lg:flex lg:col-span-5 flex-col gap-3.5 sm:gap-4">
              <ProgressCard onViewProgress={() => setIsGuardianOpen(true)} />
              <EncouragementBanner onViewAchievements={() => setIsGuardianOpen(true)} />
            </section>
          </div>

          {/* ============================================================ */}
          {/* MOBILE 3-BOX STATS ROW (Visible on < lg, from Wireframe)     */}
          {/* ============================================================ */}
          <section className="w-full lg:hidden">
            <MobileQuickStatsRow
              onViewProgress={() => setIsGuardianOpen(true)}
              onViewAchievements={() => setIsGuardianOpen(true)}
              onOpenWeekendReview={() => {
                alert('Weekend Review: Cumulative retrieval tests cover all weekday topics (4 sessions per day).');
              }}
            />
          </section>

          {/* ============================================================ */}
          {/* ROW 3: YOUR SUBJECTS SECTION (Visible on desktop, hidden on mobile) */}
          {/* ============================================================ */}
          <section className="hidden lg:block w-full">
            <YourSubjectsSection
              onSelectSubject={(subjectSlug) => {
                const targetSession = plan.find((s) => s.subjectSlug === subjectSlug) || plan[0];
                handleStartSession(targetSession);
              }}
            />
          </section>

        </main>

        {/* --- MOBILE BOTTOM NAVIGATION (Visible on < lg, from Image 1) --- */}
        <div className="lg:hidden">
          <BottomNav
            activeTab={activeTab as NavTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'profile') {
                setIsGuardianOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. REAL WORKING QUIZ RUNNER & GUARDIAN MODALS                 */}
      {/* ============================================================ */}
      {activeSession && (
        <StudyModal
          topic={currentTopic}
          questions={currentQuestions}
          userId={currentUser?.id || 'student-alex'}
          onClose={() => setActiveSession(null)}
          onQuizCompleted={handleQuizCompleted}
        />
      )}

      <GuardianDashboardModal
        isOpen={isGuardianOpen}
        onClose={() => setIsGuardianOpen(false)}
        activeStudySeconds={activeStudySeconds}
        streakDays={streak.currentStreak}
        attempts={attempts}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        userId={currentUser?.id || 'student-alex'}
        onComplete={() => {
          setIsOnboardingOpen(false);
          window.location.reload();
        }}
      />

      <CurriculumUploadModal
        isOpen={isCurriculumOpen}
        onClose={() => setIsCurriculumOpen(false)}
        userId={currentUser?.id || 'student-alex'}
      />

      <TimetableModal
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        studentName={firstName}
      />
    </div>
  );
};
