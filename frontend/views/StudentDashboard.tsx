'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, Camera } from 'lucide-react';
import { initAccessibility } from '@/frontend/lib/accessibility';
import { DesktopSidebar, DesktopNavTab, CurrentUser } from '../components/DesktopSidebar';
import { StreakWidget } from '../components/StreakWidget';
import { TodayPlan } from '../components/TodayPlanCard';
import { ProgressCard } from '../components/ProgressCard';
import { EncouragementBanner } from '../components/EncouragementBanner';
import { MobileQuickStatsRow } from '../components/MobileQuickStatsRow';
import { YourSubjectsSection } from '../components/YourSubjectsSection';
import { BottomNav, NavTab } from '../components/BottomNav';
import { StudyModal } from '../components/StudyModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { CurriculumUploadModal } from '../components/CurriculumUploadModal';
import { TimetableModal } from '../components/TimetableModal';
import { ProfileView } from './student/ProfileView';
import { ProgressView } from './student/ProgressView';
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
  const [isCurriculumOpen, setIsCurriculumOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(initialOnboardingNeeded);
  const [isTimetableOpen, setIsTimetableOpen] = useState<boolean>(false);
  const [, setAttempts] = useState<QuizAttempt[]>([]);
  const [, setActiveStudySeconds] = useState<number>(0);

  useEffect(() => {
    initAccessibility();
  }, []);

  const studentName = currentUser?.name || 'Pupil';
  const firstName = studentName.split(' ')[0] || 'Pupil';
  const initialLetters = studentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';
  const studentGrade = currentUser?.grade || 'Grade 8 / Form One';

  const handleStartSession = (session: TodayPlanSession) => {
    setActiveSession(session);
  };

  const handleQuizCompleted = () => {
    if (activeSession) {
      setPlan((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, completed: true } : s
        )
      );
    }
    setActiveSession(null);
  };

  const handleTabChange = (tab: DesktopNavTab) => {
    setActiveTab(tab);
    if (tab === 'curriculum') {
      setIsCurriculumOpen(true);
    } else if (tab === 'plan') {
      setIsTimetableOpen(true);
    } else if (tab === 'quizzes') {
      if (plan.length > 0) {
        handleStartSession(plan[0]);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/login';
  };

  const currentTopic = activeSession
    ? topics.find((t) => t.id === activeSession.topicId) || topics[0]
    : topics[0];

  const currentQuestions = activeSession
    ? questions.filter((q) => q.topicId === activeSession.topicId)
    : questions;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d7e6fc] via-[#cce0fb] to-[#bfd8f9] text-slate-900 antialiased font-sans flex flex-row relative selection:bg-blue-600 selection:text-white">
      
      {/* 1. DESKTOP SIDEBAR */}
      <DesktopSidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenGuardian={() => setActiveTab('progress')}
        onOpenCurriculum={() => setIsCurriculumOpen(true)}
        onOpenWeekendReview={() => {
          alert('Weekend Review: Cumulative retrieval tests cover all weekday topics (4 sessions per day).');
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. MAIN APP CONTENT AREA */}
      <div className="flex-1 min-h-screen flex flex-col relative overflow-x-hidden pb-20 lg:pb-8">
        
        {/* Subtle Sky Atmospheric Luminous Glow */}
        <div className="absolute top-0 left-0 w-full h-[360px] pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-24 left-1/4 w-[650px] h-[350px] bg-white/50 rounded-full blur-3xl" />
          <div className="absolute top-16 right-10 w-[550px] h-[320px] bg-blue-300/30 rounded-full blur-3xl" />
        </div>

        {/* --- MOBILE HEADER --- */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-blue-200/60 shadow-xs px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer active:scale-95 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 stroke-[2.4]" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer min-w-0" onClick={() => setActiveTab('home')}>
              <span className="font-black text-slate-950 text-base sm:text-lg tracking-tight truncate">
                StudyBuddy
              </span>
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                G8
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCurriculumOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Send Pages</span>
            </button>

            <button
              onClick={() => alert(`Notifications: Your daily sessions are ready!`)}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-slate-50 border border-blue-200/60 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
            </button>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-xs"
              title={`Student Profile: ${studentName}`}
            >
              <span>{initialLetters}</span>
            </div>
          </div>
        </header>

        {/* --- DESKTOP TOP BAR --- */}
        <div className="hidden lg:flex w-full items-center justify-end px-6 lg:px-8 pt-3 pb-1 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert(`Notifications: Your daily sessions are ready!`)}
              className="relative w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-blue-200/60 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>

            {/* Student Profile Pill */}
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-white hover:bg-blue-50/60 border border-blue-200/60 text-slate-900 cursor-pointer transition-all shadow-xs"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
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

        {/* --- MAIN DASHBOARD BODY --- */}
        <main className="flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-18 lg:pt-2 py-2 sm:py-3 flex flex-col gap-4 relative z-10">
          
          {/* PROFILE VIEW */}
          {activeTab === 'profile' && (
            <ProfileView
              onNavigateToTab={(tabId) => handleTabChange(tabId as DesktopNavTab)}
              onLogout={handleLogout}
            />
          )}

          {/* PROGRESS VIEW */}
          {(activeTab === 'progress' || activeTab === 'achievements') && (
            <ProgressView
              onStartQuiz={() => plan.length > 0 && handleStartSession(plan[0])}
            />
          )}

          {/* HOME DASHBOARD VIEW */}
          {(activeTab === 'home' || activeTab === 'subjects' || activeTab === 'plan' || activeTab === 'quizzes') && (
            <>
              {/* 1. HERO SECTION */}
              <section className="w-full flex flex-col justify-center pt-1 sm:pt-2 px-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-blue-700 uppercase tracking-wider">
                  <span>Hey Champ!</span>
                  <span className="w-2 h-2 bg-blue-600" />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black text-slate-950 tracking-tight leading-tight mt-1">
                  Let&apos;s learn <span className="text-blue-700">something</span> awesome today!
                </h1>

                <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1 max-w-2xl leading-relaxed">
                  Stay consistent and you&apos;ll reach your goals!
                </p>
              </section>

              {/* 2. STUDY STREAK WIDGET */}
              <section className="w-full">
                <StreakWidget streak={streak} />
              </section>

              {/* ROW 2: TODAY'S PLAN + PROGRESS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
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

                <section className="hidden lg:flex lg:col-span-5 flex-col gap-3.5 sm:gap-4">
                  <ProgressCard onViewProgress={() => setActiveTab('progress')} />
                  <EncouragementBanner onViewAchievements={() => setActiveTab('progress')} />
                </section>
              </div>

              {/* MOBILE 3-BOX STATS ROW */}
              <section className="w-full lg:hidden">
                <MobileQuickStatsRow
                  onViewProgress={() => setActiveTab('progress')}
                  onViewAchievements={() => setActiveTab('progress')}
                  onOpenWeekendReview={() => {
                    alert('Weekend Review: Cumulative retrieval tests cover all weekday topics (4 sessions per day).');
                  }}
                />
              </section>

              {/* ROW 3: YOUR SUBJECTS SECTION */}
              <section className="hidden lg:block w-full">
                <YourSubjectsSection
                  onSelectSubject={(subjectSlug) => {
                    const targetSession = plan.find((s) => s.subjectSlug === subjectSlug) || plan[0];
                    handleStartSession(targetSession);
                  }}
                />
              </section>
            </>
          )}

        </main>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="lg:hidden">
          <BottomNav
            activeTab={activeTab as NavTab}
            onChangeTab={handleTabChange}
          />
        </div>

      </div>

      {/* 3. WORKING QUIZ RUNNER */}
      {activeSession && (
        <StudyModal
          topic={currentTopic}
          questions={currentQuestions}
          userId={currentUser?.id || ''}
          onClose={() => setActiveSession(null)}
          onQuizCompleted={handleQuizCompleted}
        />
      )}

      <OnboardingModal
        isOpen={isOnboardingOpen}
        userId={currentUser?.id}
        initialStudentName={currentUser?.name}
        onComplete={() => {
          setIsOnboardingOpen(false);
          window.location.reload();
        }}
      />

      <CurriculumUploadModal
        isOpen={isCurriculumOpen}
        onClose={() => setIsCurriculumOpen(false)}
        userId={currentUser?.id || ''}
      />

      <TimetableModal
        isOpen={isTimetableOpen}
        onClose={() => setIsTimetableOpen(false)}
        studentName={firstName}
      />
    </div>
  );
};
