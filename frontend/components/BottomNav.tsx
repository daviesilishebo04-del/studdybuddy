'use client';

import React from 'react';
import { Home, Calendar, BookOpen, HelpCircle, User } from 'lucide-react';

export type NavTab = 'home' | 'plan' | 'subjects' | 'quizzes' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'plan', label: 'My Plan', icon: Calendar },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    // Only visible on mobile/small screens (hidden on md and larger)
    <div className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 z-40 md:hidden max-w-md mx-auto">
      <div className="rounded-full px-3 py-2 shadow-2xl shadow-blue-950/20 border border-white/80 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {navItemsRender(activeTab, onChangeTab)}
        </div>
      </div>
    </div>
  );
};

function navItemsRender(activeTab: NavTab, onChangeTab: (tab: NavTab) => void) {
  return NAV_ITEMS.map((item) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => onChangeTab(item.id)}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-3.5 rounded-2xl cursor-pointer relative ${
          isActive
            ? 'text-indigo-600 scale-105'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.9]'}`} />
        <span className={`text-[10px] tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
          {item.label}
        </span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 -mt-0.5 shadow-xs shadow-indigo-600" />
        )}
      </button>
    );
  });
}
