'use client';

import React, { useState } from 'react';
import { UserPlus, X, Lock, User, GraduationCap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface RegisterStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRegistered: (student: { id: string; name: string; grade: string }) => void;
}

export const RegisterStudentModal: React.FC<RegisterStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentRegistered,
}) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('Grade 8 / Form One');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setError('Please enter the student\'s name.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          password: cleanPassword,
          grade: grade.trim() || 'Grade 8 / Form One',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student.');
      }

      setSuccessMessage(`Student "${cleanName}" registered successfully!`);
      
      setTimeout(() => {
        onStudentRegistered({
          id: data.student.id,
          name: data.student.name,
          grade: data.student.grade || grade,
        });
        setName('');
        setPassword('');
        setSuccessMessage(null);
        setIsLoading(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Network error while registering student.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="w-full max-w-md bg-white border-2 border-blue-900 rounded-xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Register New Student</h2>
              <p className="text-xs font-semibold text-slate-500">Create login credentials for a pupil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Student Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah K. or Alex"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border-2 border-slate-300 focus:border-blue-600 text-sm font-bold text-slate-900 bg-white outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              This is the exact name the student will type to log in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Simple Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. 1234 or study123"
                required
                minLength={4}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border-2 border-slate-300 focus:border-blue-600 text-sm font-bold text-slate-900 bg-white outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Minimum 4 characters. Keep it simple and memorable for the pupil.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Grade / Form Level
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Grade 8 / Form One"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border-2 border-slate-300 focus:border-blue-600 text-sm font-bold text-slate-900 bg-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Registering...' : 'Register Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
