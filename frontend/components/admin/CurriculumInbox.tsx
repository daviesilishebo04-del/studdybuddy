'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  RefreshCw,
  BookOpen,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { CurriculumSubmission, SubmissionStatus } from '@/backend/domain/types';

interface CurriculumInboxProps {
  onNavigateToNotes?: (subjectId?: string, suggestedTitle?: string) => void;
}

export const CurriculumInbox: React.FC<CurriculumInboxProps> = ({ onNavigateToNotes }) => {
  const [submissions, setSubmissions] = useState<CurriculumSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/curriculum');
      const data = await res.json();
      if (res.ok && data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: SubmissionStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/curriculum/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeFilter === 'ALL') return true;
    return s.status === activeFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
              Class Syllabus Ingestion
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-700 text-white text-xs font-black uppercase">
                {pendingCount} New
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1">
            Review textbook and syllabus pages sent by Alex to craft tailored study notes and quizzes.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3.5 py-2 border-2 border-slate-900 bg-white hover:bg-slate-100 text-xs font-black text-slate-900 uppercase tracking-wider transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-300 pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 ${
            activeFilter === 'ALL'
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
          }`}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 ${
            activeFilter === 'PENDING'
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
          }`}
        >
          Needs Review ({pendingCount})
        </button>
        <button
          onClick={() => setActiveFilter('REVIEWED')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer border-2 ${
            activeFilter === 'REVIEWED'
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
          }`}
        >
          Reviewed ({submissions.filter((s) => s.status === 'REVIEWED').length})
        </button>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-300 bg-white">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-700 mb-2" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Loading student submissions...
          </p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-300 bg-white">
          <Camera className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
            No pages found
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm mx-auto">
            {activeFilter === 'PENDING'
              ? 'All caught up! No pending class pages from Alex.'
              : 'When Alex snaps photos of his school textbook, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isPending = sub.status === 'PENDING';
            const formattedDate = new Date(sub.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sub.id}
                className={`border-2 bg-white transition ${
                  isPending ? 'border-slate-900' : 'border-slate-300 opacity-90'
                }`}
              >
                {/* Submission Header */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                      {sub.subjectName || 'Subject'}
                    </span>

                    {isPending ? (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                        Pending Mentor Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Reviewed
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <button
                        onClick={() => handleUpdateStatus(sub.id, 'REVIEWED')}
                        disabled={updatingId === sub.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Reviewed</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(sub.id, 'PENDING')}
                        disabled={updatingId === sub.id}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-bold underline cursor-pointer"
                      >
                        Mark Unreviewed
                      </button>
                    )}

                    {onNavigateToNotes && (
                      <button
                        onClick={() =>
                          onNavigateToNotes(sub.subjectId, sub.chapterTitle)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Create Notes</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Body: Chapter & Notes */}
                <div className="p-4 space-y-3">
                  {sub.chapterTitle && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Chapter / Topic
                      </span>
                      <p className="text-sm font-black text-slate-950 mt-0.5">
                        {sub.chapterTitle}
                      </p>
                    </div>
                  )}

                  {sub.notes && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-700">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                        Alex&apos;s Note for Mentor
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed">
                        &ldquo;{sub.notes}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Image Grid */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Captured Pages ({sub.imageUrls.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {sub.imageUrls.map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setLightboxImage(url)}
                          className="relative border-2 border-slate-900 bg-slate-100 group cursor-pointer overflow-hidden aspect-3/4 flex flex-col justify-between"
                        >
                          <div className="w-full h-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Page ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 bg-slate-950 text-white px-2 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-opacity">
                              <Maximize2 className="w-3 h-3" />
                              View Large
                            </span>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-white px-2 py-1 text-[10px] font-black uppercase flex items-center justify-between">
                            <span>Page {imgIdx + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80">
          <div className="relative max-w-4xl w-full max-h-[95vh] bg-white border-2 border-slate-900 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-900 bg-slate-100">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider">
                Textbook Page Inspection
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 border border-slate-900 text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                aria-label="Close image"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-200 flex items-center justify-center min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage}
                alt="Enlarged page"
                className="max-w-full max-h-[80vh] object-contain border border-slate-400 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
