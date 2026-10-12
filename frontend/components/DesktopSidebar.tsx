'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  User,
  ClipboardList,
  ChevronRight,
  LogOut,
  Shield,
  X,
  Camera,
} from 'lucide-react';

export type DesktopNavTab =
  | 'home'
  | 'plan'
  | 'subjects'
  | 'quizzes'
  | 'curriculum'
  | 'progress'
  | 'achievements'
  | 'profile';

export interface CurrentUser {
  id?: string;
  name: string;
  role: string;
  grade?: string | null;
}

interface DesktopSidebarProps {
  currentUser?: CurrentUser;
  activeTab: DesktopNavTab;
  onChangeTab: (tab: DesktopNavTab) => void;
  onOpenGuardian: () => void;
  onOpenWeekendReview: () => void;
  onOpenCurriculum?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const SIDEBAR_ITEMS: {
  id: DesktopNavTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'plan', label: 'My Plan', icon: Calendar },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'quizzes', label: 'Quizzes', icon: Target },
  { id: 'curriculum', label: 'Send Class Pages', icon: Camera },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'profile', label: 'Profile', icon: User },
];

interface SidebarBodyProps {
  currentUser?: CurrentUser;
  activeTab: DesktopNavTab;
  onChangeTab: (tab: DesktopNavTab) => void;
  onOpenGuardian: () => void;
  onOpenWeekendReview: () => void;
  onOpenCurriculum?: () => void;
  onCloseMobile?: () => void;
  isDrawer?: boolean;
}

const SidebarBody: React.FC<SidebarBodyProps> = ({
  currentUser,
  activeTab,
  onChangeTab,
  onOpenGuardian,
  onOpenWeekendReview,
  onOpenCurriculum,
  onCloseMobile,
  isDrawer = false,
}) => {
  const handleItemClick = (id: DesktopNavTab) => {
    onChangeTab(id);
    if (id === 'curriculum' && onOpenCurriculum) {
      onOpenCurriculum();
    }
    if (isDrawer && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top Section: Logo & Nav Links */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo (with optional mobile close button) */}
        <div className="flex items-center justify-between px-1">
          <div
            onClick={() => handleItemClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-950 text-lg tracking-tight leading-none">
                StudyBuddy
              </span>
              <span className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">
                Grade 8 • Form One
              </span>
            </div>
          </div>

          {isDrawer && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              aria-label="Close sidebar menu"
              className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.4]" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'stroke-[2.6] text-indigo-600' : 'stroke-[2] text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Weekend Review Card & Logout */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 mt-6">
        {/* Weekend Review Mini-Card */}
        <div
          onClick={() => {
            onOpenWeekendReview();
            if (isDrawer && onCloseMobile) onCloseMobile();
          }}
          className="p-3.5 rounded-2xl bg-[#fef9ee] border-[1.5px] border-[#fde68a] hover:bg-[#fef4df] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 truncate">Weekend Review</span>
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                Sat &amp; Sun
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 mt-2 leading-tight">
            4 tests each day to review everything!
          </p>
        </div>

        {/* Current Logged-in User Badge */}
        {currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
              {currentUser.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-xs font-black text-slate-900 truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {currentUser.role === 'GUARDIAN' ? 'Mentor / Admin' : (currentUser.grade || 'Student')}
              </span>
            </div>
          </div>
        )}

        {/* Guardian / Mentor Shortcut Button */}
        <button
          onClick={() => {
            onOpenGuardian();
            if (isDrawer && onCloseMobile) onCloseMobile();
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          <Shield className="w-4 h-4 text-slate-400" />
          <span>Mentor Portal</span>
        </button>

        {/* Admin Dashboard Direct Link (visible if user is mentor or for testing) */}
        {currentUser?.role === 'GUARDIAN' && (
          <Link
            href="/admin"
            onClick={() => {
              if (isDrawer && onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Admin Studio</span>
          </Link>
        )}

        {/* Log Out */}
        <button
          onClick={async () => {
            if (isDrawer && onCloseMobile) onCloseMobile();
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
              console.error('Logout error:', err);
            }
            window.location.href = '/login';
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentUser,
  activeTab,
  onChangeTab,
  onOpenGuardian,
  onOpenWeekendReview,
  onOpenCurriculum,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Handle escape key on mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* 1. PERSISTENT DESKTOP SIDEBAR (Visible on lg and up) */}
      <aside className="hidden lg:flex w-64 bg-white min-h-screen border-r border-slate-200/80 p-5 flex-col justify-between flex-shrink-0 z-30 shadow-sm">
        <SidebarBody
          currentUser={currentUser}
          activeTab={activeTab}
          onChangeTab={onChangeTab}
          onOpenGuardian={onOpenGuardian}
          onOpenWeekendReview={onOpenWeekendReview}
          onOpenCurriculum={onOpenCurriculum}
        />
      </aside>

      {/* 2. MOBILE SLIDE-OVER DRAWER (Visible on < lg when three lines button is clicked) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dimmed backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-in drawer with exact white aesthetic */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 p-5 flex flex-col justify-between z-50 shadow-2xl overflow-y-auto"
            >
              <SidebarBody
                currentUser={currentUser}
                activeTab={activeTab}
                onChangeTab={onChangeTab}
                onOpenGuardian={onOpenGuardian}
                onOpenWeekendReview={onOpenWeekendReview}
                onOpenCurriculum={onOpenCurriculum}
                onCloseMobile={onCloseMobile}
                isDrawer
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
