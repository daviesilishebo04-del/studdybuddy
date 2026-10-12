'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface CurriculumUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess?: () => void;
}

interface ImageItem {
  id: string;
  dataUrl: string;
  fileSizeKb: number;
}

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Literature',
  'Science',
  'English Structure',
  'History',
  'Civic Education',
];

export const CurriculumUploadModal: React.FC<CurriculumUploadModalProps> = ({
  isOpen,
  onClose,
  userId = '',
  onSuccess,
}) => {
  const [subject, setSubject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Universal Canvas Downsampling Utility
  // - JPEG format for universal compatibility across iOS Safari, Android, and desktop
  // - Caps dimension to 1400px to maintain crisp equations while reducing payload size
  const processImageFile = (file: File): Promise<ImageItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const sizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

          resolve({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: compressedDataUrl,
            fileSizeKb: sizeKb,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image into canvas'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsCompressing(true);

    try {
      const processed: ImageItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Resilient MIME check: Some mobile browsers / webviews leave file.type empty
        const isImage = !file.type || file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name);
        if (!isImage) continue;
        const item = await processImageFile(file);
        processed.push(item);
      }

      if (processed.length === 0) {
        setError('No valid photos detected. Please try snapping again.');
      } else {
        setImages((prev) => [...prev, ...processed]);
      }
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Could not process photo. Please try snapping again.');
    } finally {
      setIsCompressing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCompressing) {
      setError('Still processing photo. Please wait a second...');
      return;
    }

    if (images.length === 0) {
      setError('Please snap or choose at least one photo first.');
      return;
    }

    if (!subject.trim()) {
      setError('Please choose or type a subject (e.g. Mathematics) so your mentor knows what to make notes for.');
      if (subjectInputRef.current) {
        subjectInputRef.current.focus();
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        userId,
        subjectName: subject.trim(),
        notes: notes.trim(),
        images: images.map((img) => img.dataUrl),
      };

      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send pages');
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const msg = err instanceof Error ? err.message : 'Submission failed. Please check your connection.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setNotes('');
    setImages([]);
    setIsSuccess(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80">
      {/* Modal Container: Flat, high-contrast, zero-shadow design */}
      <div className="relative w-full max-w-xl bg-white border-2 border-slate-900 max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b-2 border-slate-900 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center border-2 border-slate-900 flex-shrink-0">
              <Camera className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight uppercase">
                Send Class Pages
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Snap textbook pages so your mentor can build your notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 border-2 border-slate-900 hover:bg-slate-100 text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isSuccess ? (
            /* Success Feedback State */
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-600 text-white border-2 border-slate-900 flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-950 tracking-tight uppercase">
                  Pages Sent to Your Mentor!
                </h3>
                <p className="text-sm font-bold text-slate-700 max-w-md leading-relaxed">
                  Your mentor will review what you are learning at school and build your custom study notes and quizzes.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 hover:bg-blue-700 transition cursor-pointer"
                >
                  Send Another Page
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-900 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert Box */}
              {error && (
                <div className="p-3 border-2 border-rose-600 bg-rose-50 flex items-center gap-2.5 text-rose-950 text-xs font-black">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 stroke-[2.6]" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Which Subject: Quick Tap Chips + Custom Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                    Which Subject? <span className="text-rose-600">*</span>
                  </label>
                  {subject.trim() && (
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                      Selected: {subject}
                    </span>
                  )}
                </div>

                {/* One-Tap Subject Quick Selection Chips */}
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUBJECTS.map((subjName) => {
                    const isSelected = subject.toLowerCase() === subjName.toLowerCase();
                    return (
                      <button
                        key={subjName}
                        type="button"
                        onClick={() => {
                          setSubject(subjName);
                          setError(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-slate-900'
                            : 'bg-white text-slate-800 border-slate-300 hover:border-slate-900'
                        }`}
                      >
                        {subjName}
                      </button>
                    );
                  })}
                </div>

                {/* Free Text Input for specific subjects or custom topics */}
                <input
                  ref={subjectInputRef}
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Or type subject/topic (e.g. Mathematics, Science, Biology...)"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-slate-900 text-sm font-bold text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none transition"
                />
              </div>

              {/* 2. Photo Capture & Upload Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                    Capture or Upload Pages <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
                    {images.length} {images.length === 1 ? 'page' : 'pages'} added
                  </span>
                </div>

                {/* Hidden Native File Inputs */}
                {/* 1) Direct Camera Input for Mobile */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                {/* 2) Gallery/File Picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                {/* Action Buttons: Snap Photo / Choose from Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isCompressing || isSubmitting}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-900 hover:bg-blue-700 active:bg-blue-800 transition cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 stroke-[2.4]" />
                    <span>{images.length > 0 ? '+ Snap Another Page' : 'Take Photo (Camera)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing || isSubmitting}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white text-slate-900 border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 stroke-[2.4]" />
                    <span>Choose from Photos</span>
                  </button>
                </div>

                {/* Compression Status indicator */}
                {isCompressing && (
                  <div className="mt-2.5 p-2.5 bg-blue-50 border-2 border-blue-600 flex items-center gap-2 text-blue-950 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Processing page photo for crystal-clear text...</span>
                  </div>
                )}

                {/* Snapped Images Preview Grid */}
                {images.length > 0 && (
                  <div className="mt-3.5 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative border-2 border-slate-900 bg-white overflow-hidden flex flex-col"
                        >
                          <div className="h-32 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.dataUrl}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 bg-white flex items-center justify-between border-t-2 border-slate-900">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900">
                                Page {idx + 1}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">
                                {img.fileSizeKb} KB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="p-1.5 border border-slate-300 text-slate-700 hover:text-rose-600 hover:border-rose-600 transition cursor-pointer"
                              title="Delete photo"
                              aria-label={`Remove Page ${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.2]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Note for Mentor (Optional) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5">
                  Note for Mentor <span className="text-slate-500 font-bold normal-case">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Teacher said question 4 will be on Friday's test. I had trouble with this formula."
                  className="w-full px-4 py-2.5 border-2 border-slate-300 focus:border-slate-900 text-sm font-bold text-slate-900 placeholder:text-slate-400 bg-white resize-none transition focus:outline-none"
                />
              </div>

              {/* Footer Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t-2 border-slate-900">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-900 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Send Pages Submit Button: Always responsive to click, never silently disabled! */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer border-2 border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending {images.length} {images.length === 1 ? 'Page' : 'Pages'}...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Send Pages to Mentor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
