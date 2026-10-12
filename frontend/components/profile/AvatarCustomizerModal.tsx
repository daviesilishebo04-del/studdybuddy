'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';
import { StudentAvatar, AvatarConfig } from '@/frontend/components/StudentAvatar';
import { CollectibleItem } from '@/frontend/lib/unlocks';
import { transitions } from '@/frontend/lib/motion';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: AvatarConfig;
  unlockedItems: CollectibleItem[];
  onSave: (config: AvatarConfig) => Promise<void>;
}

const BASE_STYLES: { id: AvatarConfig['baseStyle']; label: string }[] = [
  { id: 'scholar', label: 'Scholar' },
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'maker', label: 'Maker' },
  { id: 'champion', label: 'Champion' },
];

const BG_COLORS = [
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#0284c7', label: 'Sky' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#e11d48', label: 'Rose' },
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig = { baseStyle: 'scholar', bgColor: '#4f46e5', accessoryId: null },
  unlockedItems,
  onSave,
}) => {
  const [config, setConfig] = useState<AvatarConfig>(currentConfig);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={transitions.bouncy}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 z-10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customise Avatar</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Earn accessories by learning and solving quizzes!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Live Preview Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl">
            <StudentAvatar config={config} size="xl" />
            <span className="text-xs font-bold text-slate-600 mt-3">
              Live Preview
            </span>
          </div>

          {/* Base Style Chooser */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Base Look
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASE_STYLES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setConfig({ ...config, baseStyle: b.id })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    config.baseStyle === b.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Chooser */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Badge Color
            </span>
            <div className="flex flex-wrap gap-2.5">
              {BG_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setConfig({ ...config, bgColor: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-all active:scale-95 shadow-xs ${
                    config.bgColor === c.hex ? 'ring-3 ring-indigo-600 ring-offset-2' : ''
                  }`}
                  aria-label={c.label}
                >
                  {config.bgColor === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Unlockable Accessories Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              3. Collectible Gear (Earned By Learning)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* None option */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, accessoryId: null })}
                className={`p-3.5 rounded-2xl text-left cursor-pointer flex items-center justify-between transition-all ${
                  !config.accessoryId
                    ? 'bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500 font-bold'
                    : 'bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200'
                }`}
              >
                <span className="text-xs font-bold">No Accessory</span>
                {!config.accessoryId && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
              </button>

              {/* Dynamic collectible items */}
              {unlockedItems.map((item) => {
                const isSelected = config.accessoryId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.isUnlocked}
                    onClick={() => {
                      if (item.isUnlocked) {
                        setConfig({ ...config, accessoryId: item.id });
                      }
                    }}
                    className={`p-3.5 rounded-2xl text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500 font-bold'
                        : item.isUnlocked
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-semibold'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{item.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                      {!item.isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {item.isUnlocked ? 'Unlocked!' : item.conditionDescription}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
