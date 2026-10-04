'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Flame,
  Shield,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gamepad2,
  Target,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('alex');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (overrideUserId?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const payload = overrideUserId
        ? { userId: overrideUserId }
        : { identifier, password };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Route to appropriate dashboard
      router.push(data.redirectUrl || '/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d7e6fc] flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b-2 border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 text-white flex items-center justify-center font-black text-lg border-2 border-slate-900">
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-950 uppercase tracking-tight leading-none">
              StudyBuddy
            </span>
            <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider mt-1">
              Interactive Study Station
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-3 py-1 bg-white border-2 border-slate-900 text-xs font-black uppercase tracking-wider">
            Grade 8 • Form One
          </span>
          <div className="px-2.5 py-1 bg-amber-400 border-2 border-slate-900 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-amber-950 text-amber-950" />
            <span>5-Day Streak</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Split-Pane Container */}
      <main className="w-full max-w-5xl mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 border-2 border-slate-900 bg-white">
          
          {/* ========================================================= */}
          {/* LEFT PANE: "Mature Kid / Game Terminal" Quest Showcase    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-slate-900">
            <div className="space-y-6">
              
              {/* Terminal Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-black uppercase tracking-widest border border-blue-400">
                <Gamepad2 className="w-4 h-4" />
                <span>Player Station 01</span>
              </div>

              {/* Punchy Hero Typography */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none uppercase">
                  Ready to <span className="text-amber-400">Level Up</span> Today?
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-relaxed">
                  Log in to defend your study streak, complete today&apos;s retrieval quests, and master your syllabus topics.
                </p>
              </div>

              {/* Active Quest Cards (Gamified but mature pre-teen focus) */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-800 border-2 border-slate-700">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                    <span>Active Target</span>
                    <span className="text-amber-400">Due Today</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Mathematics: Linear Equations</p>
                      <p className="text-[10px] font-semibold text-slate-400">Form 1 Algebra Review</p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800 border-2 border-slate-700">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                    <span>Secondary Target</span>
                    <span className="text-emerald-400">Ready</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      L
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Literature: Theme &amp; Meaning</p>
                      <p className="text-[10px] font-semibold text-slate-400">Poetry Comprehension</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Status Footnote */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="uppercase tracking-wider">Streak Defense</span>
              <span className="text-amber-400 font-black flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                Active • 5 Days
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANE: Authentication Card & One-Click Player Select */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-8 sm:py-10 flex flex-col justify-between">
            <div>
              {/* Form Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
                  Sign In to StudyStation
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  Enter your student credentials or select your profile below.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border-2 border-rose-600 flex items-center gap-2.5 text-rose-900 text-xs font-black">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 stroke-[2.5]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                {/* Identifier Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                    Student Username or Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. alex or student@studybuddy.local"
                    className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-700 focus:outline-none text-sm font-bold text-slate-950 placeholder:text-slate-400 bg-white"
                    required
                  />
                </div>

                {/* Password / Passcode Input with Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                      Passcode or Password
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 cursor-pointer hover:underline">
                      Need help?
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your passcode"
                      className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-700 focus:outline-none text-sm font-bold text-slate-950 placeholder:text-slate-400 bg-white pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 border-2 border-slate-900 rounded-none accent-blue-700 cursor-pointer"
                    />
                    <span>Remember this station</span>
                  </label>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest border-2 border-blue-700 transition cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>INITIALIZING SESSION...</span>
                    </>
                  ) : (
                    <>
                      <span>ENTER STUDY STATION</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>

              {/* ========================================================= */}
              {/* Quick Player Switcher (One-Click Launch Tray)              */}
              {/* ========================================================= */}
              <div className="mt-8 pt-6 border-t-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Quick Launch Player
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Demo Profiles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Player 1: Alex */}
                  <button
                    type="button"
                    onClick={() => handleLogin('student-alex')}
                    disabled={isLoading}
                    className="p-3 border-2 border-slate-900 bg-white hover:bg-blue-50 text-left transition cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 bg-blue-700 text-white font-black text-xs flex items-center justify-center border border-slate-900 group-hover:scale-105 transition-transform flex-shrink-0">
                      AM
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-950 truncate">Alex (Champ)</p>
                      <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                        Grade 8 • Pupil
                      </p>
                    </div>
                  </button>

                  {/* Player 2: Mentor Davie */}
                  <button
                    type="button"
                    onClick={() => handleLogin('guardian-davie')}
                    disabled={isLoading}
                    className="p-3 border-2 border-slate-900 bg-white hover:bg-slate-100 text-left transition cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 bg-slate-900 text-white font-black text-xs flex items-center justify-center border border-slate-900 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-950 truncate">Mentor Davie</p>
                      <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                        Guardian • Admin
                      </p>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Note */}
            <p className="text-[11px] font-bold text-slate-500 text-center mt-6">
              StudyBuddy Secure Learning Environment • Version 1.0
            </p>
          </div>

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs font-black uppercase text-slate-700 gap-2">
        <span>© 2026 StudyBuddy. Built for Alex.</span>
        <span>Grade 8 Secondary Curriculum System</span>
      </footer>

    </div>
  );
}
