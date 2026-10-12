'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  BookOpen,
  Lock,
  LogOut,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StudentAvatar, AvatarConfig } from '@/frontend/components/StudentAvatar';
import { AvatarCustomizerModal } from '@/frontend/components/profile/AvatarCustomizerModal';
import { CollectibleItem } from '@/frontend/lib/unlocks';
import { transitions } from '@/frontend/lib/motion';
import { applyTextSize, applyReducedMotion } from '@/frontend/lib/accessibility';

interface ProfileViewProps {
  onNavigateToTab: (tabId: string) => void;
  onLogout: () => void;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    grade: string;
    role: string;
    memberSince: string;
    lastLoginAt?: string | null;
  };
  profile: {
    id: string;
    dailyGoalMinutes: number;
    preferredStudyTime: string | null;
    textSize: string;
    soundEnabled: boolean;
    reducedMotion: boolean;
    avatarConfig?: AvatarConfig | null;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  unlockedItems: CollectibleItem[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateToTab, onLogout }) => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok && !ignore) {
          const json = await res.json();
          setData(json);
          if (json.profile?.textSize) {
            applyTextSize(json.profile.textSize);
          }
          if (json.profile?.reducedMotion !== undefined) {
            applyReducedMotion(json.profile.reducedMotion);
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const updatePreference = async (partial: Partial<ProfileData['profile']>) => {
    if (!data) return;

    // Apply immediate global DOM side effects
    if (partial.textSize) {
      applyTextSize(partial.textSize);
    }
    if (partial.reducedMotion !== undefined) {
      applyReducedMotion(partial.reducedMotion);
    }

    // Optimistic UI update
    setData({
      ...data,
      profile: {
        ...data.profile,
        ...partial,
      },
    });

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      if (res.ok) {
        setSaveMessage('Preferences saved!');
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        loadData(); // Rollback on failure
      }
    } catch (err) {
      console.error('Save failed:', err);
      loadData();
    }
  };

  const handleSaveAvatar = async (avatarConfig: AvatarConfig) => {
    if (!data) return;
    setData({
      ...data,
      profile: {
        ...data.profile,
        avatarConfig,
      },
    });

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarConfig }),
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPasswordError(json.error || 'Failed to update password');
      } else {
        setPasswordSuccess(true);
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
      }
    } catch (err) {
      console.error('Password error:', err);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="rounded-2xl p-6 bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-sm text-slate-800">Loading your profile...</span>
        </div>
      </div>
    );
  }

  const { user, profile, streak, unlockedItems } = data;
  const memberDate = new Date(user.memberSince).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-full flex flex-col gap-5 max-w-4xl pb-12">
      {/* Save Toast Notification */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{saveMessage}</span>
        </motion.div>
      )}

      {/* 1. IDENTITY CARD */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group">
            <StudentAvatar
              config={profile.avatarConfig || { baseStyle: 'scholar', bgColor: '#4f46e5', accessoryId: null }}
              size="xl"
            />
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Change Look</span>
            </button>
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {user.name}
            </h1>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">
              {user.grade}
            </span>
            <span className="text-xs font-medium text-slate-500 mt-1">
              Pupil account • Member since {memberDate}
            </span>
          </div>
        </div>

        {/* Streak Quick Link */}
        <div
          onClick={() => onNavigateToTab('progress')}
          className="bg-amber-50 hover:bg-amber-100/80 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all w-full sm:w-auto shrink-0 shadow-xs"
        >
          <div className="w-11 h-11 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-xs">
            <Flame className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-slate-900 leading-none">
              {streak.currentStreak}-Day Streak
            </span>
            <span className="text-[11px] font-semibold text-amber-900/80 mt-1">
              View study progress →
            </span>
          </div>
        </div>
      </section>

      {/* 2. STUDY SETTINGS */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Study Settings
          </h2>
        </div>

        {/* Daily Study Goal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Daily Study Goal</span>
            <span className="text-xs font-medium text-slate-500">
              Sets your target minutes on the Home dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[20, 30, 45, 60].map((mins) => {
              const active = profile.dailyGoalMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => updatePreference({ dailyGoalMinutes: mins })}
                  className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Study Time */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Preferred Study Window</span>
            <span className="text-xs font-medium text-slate-500">
              When you focus best during the day
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'MORNING', label: 'Morning' },
              { id: 'AFTERNOON', label: 'Afternoon' },
              { id: 'EVENING', label: 'Evening' },
            ].map((win) => {
              const active = profile.preferredStudyTime === win.id;
              return (
                <button
                  key={win.id}
                  onClick={() => updatePreference({ preferredStudyTime: win.id })}
                  className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {win.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assigned Subjects (Mentor Managed) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Active Subjects</span>
            <span className="text-xs font-medium text-slate-500">
              Assigned and calibrated by your mentor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Mathematics
            </span>
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              English Literature
            </span>
          </div>
        </div>
      </section>

      {/* 3. DISPLAY & ACCESSIBILITY */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sliders className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Display & Accessibility
          </h2>
        </div>

        {/* Text Size Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Lesson Text Size</span>
            <span className="text-xs font-medium text-slate-500">
              Adjust size for comfortable reading on phone screens
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'SMALL', label: 'A- Small' },
              { id: 'NORMAL', label: 'A Normal' },
              { id: 'LARGE', label: 'A+ Large' },
            ].map((ts) => {
              const active = profile.textSize === ts.id;
              return (
                <button
                  key={ts.id}
                  onClick={() => updatePreference({ textSize: ts.id })}
                  className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ts.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Lesson Reading Preview Card */}
        <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2.5 py-1 rounded-lg w-fit">
              Live Lesson Preview
            </span>
            <span className="text-xs font-bold text-slate-600">
              {profile.textSize === 'SMALL' && '14px Compact • Fits more content on small smartphone screens'}
              {profile.textSize === 'NORMAL' && '16px Standard • Default comfortable reading size'}
              {profile.textSize === 'LARGE' && '20px Large Print • High legibility without zooming'}
            </span>
          </div>

          {/* Sample Lesson Box that physically scales in real time */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-2.5 transition-all">
            <span
              style={{ fontSize: 'var(--lesson-text-sm)' }}
              className="font-black text-indigo-600 block transition-all uppercase tracking-wide"
            >
              Grade 8 Mathematics • Algebra Worked Example
            </span>
            <p
              style={{
                fontSize: 'var(--lesson-text-base)',
                lineHeight: 'var(--lesson-line-height)',
              }}
              className="text-slate-800 font-medium transition-all"
            >
              Like terms have the exact same variables and exponents. You can combine 3x and 5x into 8x by adding their coefficients.
            </p>
            <div
              style={{ fontSize: 'var(--lesson-text-sm)' }}
              className="bg-amber-50/90 text-amber-950 rounded-lg p-2.5 font-mono font-bold transition-all"
            >
              3x + 5x = (3 + 5)x = 8x
            </div>
          </div>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Reduce Motion</span>
            <span className="text-xs font-medium text-slate-500">
              Turn off bouncy animations and transitions
            </span>
          </div>
          <button
            onClick={() => updatePreference({ reducedMotion: !profile.reducedMotion })}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              profile.reducedMotion
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {profile.reducedMotion ? 'ON' : 'OFF'}
          </button>
        </div>
      </section>

      {/* 4. ACCOUNT & SECURITY */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Account & Security
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-slate-900 block">Password</span>
            <span className="text-xs font-medium text-slate-500">
              Must enter your current password to choose a new one
            </span>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Change Password
          </button>
        </div>

        {/* Last Login Info & Sign Out */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              {user.lastLoginAt
                ? `Last active session: ${new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Active on this device'}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="py-2.5 px-5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4 stroke-[2.2]" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* AVATAR CUSTOMIZER MODAL */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentConfig={profile.avatarConfig || undefined}
        unlockedItems={unlockedItems}
        onSave={handleSaveAvatar}
      />

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsPasswordModalOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={transitions.snappy}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 z-10 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xl font-black text-slate-900">Change Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3.5 bg-rose-50 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-bold text-center">
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="Re-type new password"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="py-2.5 px-4 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
