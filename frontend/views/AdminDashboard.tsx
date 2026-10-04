'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
  Type,
  Menu,
  X,
  User,
} from 'lucide-react';
import {
  StudentOverview,
  WeeklyPerformance,
  TopicWithCounts,
  Subject,
} from '@/backend/repositories/adminRepository';
import { PerformanceOverview } from '@/frontend/components/admin/PerformanceOverview';
import { TopicManager } from '@/frontend/components/admin/TopicManager';
import { QuizBuilder } from '@/frontend/components/admin/QuizBuilder';
import { ShortAnswerBuilder } from '@/frontend/components/admin/ShortAnswerBuilder';
import { CurriculumInbox } from '@/frontend/components/admin/CurriculumInbox';
import { Camera } from 'lucide-react';

export type AdminTab = 'overview' | 'inbox' | 'topics' | 'assessments';
export type AssessmentSubTab = 'mcq' | 'short_answer';

interface AdminDashboardProps {
  initialOverview: StudentOverview;
  initialPerformance: WeeklyPerformance;
  initialTopics: TopicWithCounts[];
  subjects: Subject[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialOverview,
  initialPerformance,
  initialTopics,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [assessmentSubTab, setAssessmentSubTab] =
    useState<AssessmentSubTab>('mcq');
  const [targetTopicId, setTargetTopicId] = useState<string>(
    initialTopics.length > 0 ? initialTopics[0].id : ''
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleNavigateToMCQ = (topicId: string) => {
    setTargetTopicId(topicId);
    setAssessmentSubTab('mcq');
    setActiveTab('assessments');
  };

  const handleNavigateToShortAnswer = (topicId: string) => {
    setTargetTopicId(topicId);
    setAssessmentSubTab('short_answer');
    setActiveTab('assessments');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d7e6fc] via-[#cce0fb] to-[#bfd8f9] text-slate-900 antialiased font-sans flex flex-col md:flex-row relative selection:bg-[#2563eb] selection:text-white">
      {/* Subtle Sky Atmospheric Luminous Glow */}
      <div className="absolute top-0 left-0 w-full h-[360px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 left-1/4 w-[650px] h-[350px] bg-white/50 rounded-full blur-3xl" />
        <div className="absolute top-16 right-10 w-[550px] h-[320px] bg-blue-300/30 rounded-full blur-3xl" />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-blue-300/70 shadow-xs relative z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-slate-950 text-sm tracking-tight block">
              Mentor Studio
            </span>
            <span className="text-[10px] font-extrabold text-blue-700 block uppercase tracking-wider">
              Admin Hub
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-slate-700 hover:bg-blue-50 border border-blue-200/80 cursor-pointer transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl border-r border-blue-300/70 p-5 flex flex-col justify-between transition-transform md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:h-screen md:sticky md:top-0 shadow-xs`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="font-black text-slate-950 text-base tracking-tight block leading-tight">
                Mentor Studio
              </span>
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                Admin &amp; Curriculum
              </span>
            </div>
          </div>

          {/* Pupil Status Card */}
          <div className="p-3 rounded-md bg-blue-50/80 border border-blue-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-black text-slate-950 block truncate">
                {initialOverview.name}
              </span>
              <span className="text-[10px] font-bold text-blue-700 block">
                {initialOverview.grade} • Pupil
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/80'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Alex&apos;s Progress</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('inbox');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/80'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Class Pages Inbox</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('topics');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'topics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/80'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Notes &amp; Video Modules</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('assessments');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeTab === 'assessments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/80'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Quiz &amp; Question Builder</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action: Back to Student View */}
        <div className="pt-5 border-t border-blue-200/80">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white hover:bg-blue-50 text-slate-800 border border-blue-300/80 text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <span>Open Pupil View</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-y-auto relative z-10">
        {/* Render Tab 1: Overview */}
        {activeTab === 'overview' && (
          <PerformanceOverview
            overview={initialOverview}
            initialPerformance={initialPerformance}
          />
        )}

        {/* Render Tab 2: Topics & Notes */}
        {activeTab === 'topics' && (
          <TopicManager
            initialTopics={initialTopics}
            subjects={subjects}
            onNavigateToQuiz={handleNavigateToMCQ}
            onNavigateToShortAnswer={handleNavigateToShortAnswer}
          />
        )}

        {/* Render Tab 3: Assessments (MCQ + Short Answer) */}
        {activeTab === 'assessments' && (
          <div className="flex flex-col gap-5">
            {/* Assessment Sub-tabs Selector */}
            <div className="bg-white rounded-md p-1.5 border border-blue-300/80 shadow-xs flex items-center gap-2 max-w-md">
              <button
                onClick={() => setAssessmentSubTab('mcq')}
                className={`flex-1 py-2 px-3.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  assessmentSubTab === 'mcq'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>MCQ Quizzes</span>
              </button>

              <button
                onClick={() => setAssessmentSubTab('short_answer')}
                className={`flex-1 py-2 px-3.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  assessmentSubTab === 'short_answer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-blue-50/60'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>One-Word Answers</span>
              </button>
            </div>

            {/* Sub-tab view */}
            {assessmentSubTab === 'mcq' ? (
              <QuizBuilder
                topics={initialTopics}
                selectedTopicId={targetTopicId}
                onTopicChange={(tId) => setTargetTopicId(tId)}
              />
            ) : (
              <ShortAnswerBuilder
                topics={initialTopics}
                selectedTopicId={targetTopicId}
                onTopicChange={(tId) => setTargetTopicId(tId)}
              />
            )}
          </div>
        )}

        {/* Render Tab: Class Pages Inbox */}
        {activeTab === 'inbox' && (
          <CurriculumInbox
            onNavigateToNotes={(_subjectId, _suggestedTitle) => {
              setActiveTab('topics');
            }}
          />
        )}
      </main>
    </div>
  );
};
