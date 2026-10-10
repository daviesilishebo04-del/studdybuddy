'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Please enter your name and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Route based on role
      router.push(data.redirectUrl || '/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#072B6B] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      
      {/* ── TOP NAV BAR ── */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center text-white">
            <BookOpen size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">StudyBuddy</h1>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest mt-1">
              Learn • Practice • Grow
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-400/40 bg-blue-900/60 text-xs font-bold text-blue-200">
          <span>Grade 8 / Form One Study Portal</span>
        </div>
      </header>

      {/* ── MAIN CONTENT (Split-Pane on Desktop, Stacked on Mobile) ── */}
      <main className="w-full max-w-7xl mx-auto px-6 py-6 sm:py-12 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ── LEFT COLUMN: Motivational Value Proposition ── */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            
            {/* Champ Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-blue-900 border border-blue-400/60 text-amber-300 text-xs font-black tracking-wider uppercase w-fit">
              <span>HEY CHAMP!</span>
              <Sparkles size={14} className="text-amber-400 fill-amber-400" />
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Welcome back, <br />
                Your goals are <span className="text-amber-400 underline decoration-amber-400 decoration-4 underline-offset-6">within reach!</span>
              </h2>
              <p className="text-blue-100 text-sm sm:text-base max-w-lg font-medium leading-relaxed">
                Log in to continue your learning journey and make progress, one step at a time.
              </p>
            </div>

            {/* 4 Feature Value Pillars Strip (Flat, High-Contrast) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              
              {/* Pillar 1: Learn */}
              <div className="bg-blue-900/70 border border-blue-400/50 rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-600 border border-blue-300 flex items-center justify-center text-white mb-2">
                  <BookOpen size={20} />
                </div>
                <span className="font-bold text-xs text-white">Learn</span>
                <span className="text-[10px] text-blue-200 mt-0.5">new concepts</span>
              </div>

              {/* Pillar 2: Practice */}
              <div className="bg-blue-900/70 border border-blue-400/50 rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-600 border border-purple-300 flex items-center justify-center text-white mb-2">
                  <Target size={20} />
                </div>
                <span className="font-bold text-xs text-white">Practice</span>
                <span className="text-[10px] text-blue-200 mt-0.5">with quizzes</span>
              </div>

              {/* Pillar 3: Track */}
              <div className="bg-blue-900/70 border border-blue-400/50 rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 border border-emerald-300 flex items-center justify-center text-white mb-2">
                  <TrendingUp size={20} />
                </div>
                <span className="font-bold text-xs text-white">Track</span>
                <span className="text-[10px] text-blue-200 mt-0.5">your progress</span>
              </div>

              {/* Pillar 4: Achieve */}
              <div className="bg-blue-900/70 border border-blue-400/50 rounded-xl p-3.5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-amber-500 border border-amber-300 flex items-center justify-center text-slate-950 mb-2">
                  <Award size={20} className="fill-slate-950" />
                </div>
                <span className="font-bold text-xs text-white">Achieve</span>
                <span className="text-[10px] text-blue-200 mt-0.5">your goals</span>
              </div>

            </div>

          </div>

          {/* ── RIGHT COLUMN: High-Contrast Auth Card ── */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-blue-900 border-2 border-blue-400 rounded-2xl p-6 sm:p-8">
              
              <div className="mb-6">
                <h3 className="text-2xl font-black text-white tracking-tight">Log In</h3>
                <p className="text-xs font-semibold text-blue-200 mt-1">
                  Continue your study journey
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-950 border border-red-500 text-red-200 text-xs font-bold flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {showForgotNotice && (
                <div className="mb-5 p-3 rounded-lg bg-amber-950 border border-amber-400 text-amber-200 text-xs font-semibold flex items-start gap-2">
                  <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Forgot your password?</span>
                    <p className="mt-0.5 text-[11px] text-amber-100">
                      Ask your mentor in person. They can view your student profile and set a new password for you from the Mentor Studio.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                    Your Name or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Nisa or Mentor Davie"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-blue-950 border border-blue-400 text-white placeholder:text-blue-400/60 text-sm font-semibold focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your passcode"
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-blue-950 border border-blue-400 text-white placeholder:text-blue-400/60 text-sm font-semibold focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-300 hover:text-white transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Quick Profile Fillers for Brother & Mentor */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1.5">
                    Quick Select Profile:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Nisa');
                        setPassword('nisa123');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-blue-950/80 border border-blue-400/60 hover:border-amber-400 text-[11px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">
                        N
                      </span>
                      <span className="truncate">Nisa (Pupil)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUsername('Mentor Davie');
                        setPassword('mentor123');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-blue-950/80 border border-blue-400/60 hover:border-amber-400 text-[11px] font-bold text-left transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[10px]">
                        D
                      </span>
                      <span className="truncate">Mentor Davie</span>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-blue-200 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-blue-400 bg-blue-950 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                    />
                    <span className="font-semibold">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotNotice(!showForgotNotice)}
                    className="font-semibold text-blue-300 hover:text-amber-400 transition underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Log In Button (Flat, High-Contrast Solid) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-sm tracking-wide border-2 border-blue-300 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight size={18} className="stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Guidance Note */}
              <div className="mt-6 pt-5 border-t border-blue-800/80 text-center">
                <p className="text-[11px] font-semibold text-blue-300">
                  Built with care by Mentor Davie for Nisa Mubuwa Mboloma.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs font-semibold text-blue-300/70">
        <p>StudyBuddy &bull; Personalized Learning &bull; Built for Excellence</p>
      </footer>

    </div>
  );
}
