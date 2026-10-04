'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Video,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Link as LinkIcon,
  Plus,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Subject, TopicWithCounts } from '@/backend/repositories/adminRepository';
import { StudyNotePage, parseTopicPages, serializeTopicPages } from '@/frontend/lib/studyPages';

interface TopicEditorProps {
  topic?: TopicWithCounts | null;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

export const TopicEditor: React.FC<TopicEditorProps> = ({
  topic,
  subjects,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = !!topic;

  // Form states
  const [subjectId, setSubjectId] = useState<string>(
    topic?.subjectId || (subjects.length > 0 ? subjects[0].id : '')
  );
  const [title, setTitle] = useState<string>(topic?.title || '');
  const [summary, setSummary] = useState<string>(topic?.summary || '');
  const [weekNumber, setWeekNumber] = useState<number>(topic?.weekNumber || 1);
  const [order, setOrder] = useState<number>(topic?.order || 1);

  // Multi-page notes state
  const [pages, setPages] = useState<StudyNotePage[]>([
    {
      id: 'page-1',
      title: '1. Introduction & Core Concept',
      content: '',
      hasWorkedExample: false,
      exampleTitle: 'WORKED EXAMPLE',
      exampleProblem: '',
      exampleSolution: '',
    },
  ]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(true);

  // Video states
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(topic?.videoUrl || '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState<boolean>(false);

  // General loading & error
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If editing, load the full topic notes and parse into pages
  useEffect(() => {
    if (topic?.id) {
      setIsLoadingNotes(true);
      fetch(`/api/admin/topics/${topic.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.notesMarkdown) {
            const parsedPages = parseTopicPages(data.notesMarkdown, topic.title);
            setPages(parsedPages);
          }
          if (data.videoUrl) {
            setCurrentVideoUrl(data.videoUrl);
          }
        })
        .catch((err) => console.error('Error fetching topic notes:', err))
        .finally(() => setIsLoadingNotes(false));
    }
  }, [topic?.id, topic?.title]);

  // Active page helpers
  const activePage = pages[activePageIndex] || pages[0];

  const updateActivePage = (updates: Partial<StudyNotePage>) => {
    setPages((prev) => {
      const next = [...prev];
      next[activePageIndex] = { ...next[activePageIndex], ...updates };
      return next;
    });
  };

  const handleAddPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: StudyNotePage = {
      id: `page-${Date.now()}`,
      title: `${newPageNum}. Topic Overview`,
      content: '',
      hasWorkedExample: false,
      exampleTitle: 'WORKED EXAMPLE',
      exampleProblem: '',
      exampleSolution: '',
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleDeleteActivePage = () => {
    if (pages.length <= 1) {
      alert('A topic must have at least one study page.');
      return;
    }
    if (!confirm(`Are you sure you want to delete Page ${activePageIndex + 1}: "${activePage.title}"?`)) {
      return;
    }
    const nextPages = pages.filter((_, idx) => idx !== activePageIndex);
    setPages(nextPages);
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  const handleMovePage = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activePageIndex - 1 : activePageIndex + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    const nextPages = [...pages];
    const temp = nextPages[activePageIndex];
    nextPages[activePageIndex] = nextPages[targetIdx];
    nextPages[targetIdx] = temp;

    setPages(nextPages);
    setActivePageIndex(targetIdx);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please select a valid video file (.mp4, .webm, etc.)');
        return;
      }
      setVideoFile(file);
      setErrorMsg(null);
    }
  };

  const handleRemoveExistingVideo = async () => {
    if (!topic?.id) {
      setCurrentVideoUrl('');
      setVideoFile(null);
      return;
    }

    if (!confirm('Are you sure you want to delete this video?')) return;

    setIsDeletingVideo(true);
    try {
      const res = await fetch(`/api/admin/topics/${topic.id}/video`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCurrentVideoUrl('');
        setVideoFile(null);
        setSuccessMsg('Video removed successfully');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to remove video');
      }
    } catch (err) {
      setErrorMsg('Error deleting video file');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Topic title is required');
      return;
    }
    if (!subjectId) {
      setErrorMsg('Please select a subject');
      return;
    }

    // Validate pages have titles
    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].title.trim()) {
        setErrorMsg(`Page ${i + 1} requires a title`);
        setActivePageIndex(i);
        return;
      }
    }

    const serializedNotes = serializeTopicPages(pages);

    setIsSaving(true);
    try {
      let savedTopicId = topic?.id;

      if (isEditing && topic) {
        // Update topic
        const res = await fetch(`/api/admin/topics/${topic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            summary: summary.trim(),
            weekNumber: Number(weekNumber),
            order: Number(order),
            notesMarkdown: serializedNotes,
            videoUrl: currentVideoUrl.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update topic');
        }
      } else {
        // Create new topic
        const res = await fetch('/api/admin/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            title: title.trim(),
            summary: summary.trim(),
            weekNumber: Number(weekNumber),
            order: Number(order),
            notesMarkdown: serializedNotes,
            videoUrl: currentVideoUrl.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create topic');
        }

        const newTopic = await res.json();
        savedTopicId = newTopic.id;
      }

      // If user selected a new video file to upload
      if (videoFile && savedTopicId) {
        setIsUploadingVideo(true);
        const formData = new FormData();
        formData.append('video', videoFile);

        const uploadRes = await fetch(`/api/admin/topics/${savedTopicId}/video`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || 'Topic saved, but video upload failed');
        }
      }

      setSuccessMsg('Topic & all study pages saved successfully!');
      setTimeout(() => {
        onSaved();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving');
    } finally {
      setIsSaving(false);
      setIsUploadingVideo(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic?.id) return;
    if (!confirm(`Are you sure you want to delete "${topic.title}"? This cannot be undone.`)) {
      return;
    }

    setIsDeletingTopic(true);
    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (onDeleted) onDeleted();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete topic');
      }
    } catch (err) {
      setErrorMsg('Error deleting topic');
    } finally {
      setIsDeletingTopic(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-md shadow-2xl border border-blue-200/80 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                {isEditing ? `Edit Topic: ${topic.title}` : 'Create New Topic'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Author multi-page microlearning notes, worked examples, and attach video lessons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-3 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Subject Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={isEditing}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Curriculum Week</label>
              <input
                type="number"
                min="1"
                max="52"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Topic Order */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Display Order</label>
              <input
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Topic Title</label>
            <input
              type="text"
              placeholder="e.g. Linear Equations &amp; Balance Method"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-sm font-bold text-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          {/* Summary */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Brief Overview</label>
            <input
              type="text"
              placeholder="A short one-line summary displayed on the dashboard cards"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          {/* ========================================================= */}
          {/* MULTI-PAGE NOTE STUDIO                                     */}
          {/* ========================================================= */}
          <div className="p-4 sm:p-5 rounded-md bg-blue-50/40 border border-blue-200/80 space-y-4">
            
            {/* Header with Page Count & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-black text-slate-950">
                  Study Note Pages (Page-by-Page Studio)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-extrabold border border-blue-200">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddPage}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Page</span>
                </button>
              </div>
            </div>

            {/* Page Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {pages.map((p, idx) => (
                <button
                  key={p.id || idx}
                  type="button"
                  onClick={() => setActivePageIndex(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    activePageIndex === idx
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border-slate-300'
                  }`}
                >
                  <span>Page {idx + 1}</span>
                  {p.hasWorkedExample && (
                    <span className={`w-2 h-2 rounded-xs ${activePageIndex === idx ? 'bg-amber-300' : 'bg-amber-500'}`} title="Has worked example" />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={handleAddPage}
                className="px-2.5 py-1.5 rounded-md text-xs font-bold text-blue-700 hover:bg-blue-100/60 border border-dashed border-blue-300 transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Active Page Editor Box */}
            {isLoadingNotes ? (
              <div className="p-8 text-center bg-white rounded-md border border-slate-200 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading pages...</span>
              </div>
            ) : (
              <div className="bg-white rounded-md p-4 border border-blue-200/70 space-y-4 shadow-2xs">
                
                {/* Active Page Bar with Reorder & Delete actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      Editing Page {activePageIndex + 1} of {pages.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Move Left */}
                    <button
                      type="button"
                      onClick={() => handleMovePage('left')}
                      disabled={activePageIndex === 0}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                      title="Move Page Earlier"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Move Left</span>
                    </button>

                    {/* Move Right */}
                    <button
                      type="button"
                      onClick={() => handleMovePage('right')}
                      disabled={activePageIndex === pages.length - 1}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                      title="Move Page Later"
                    >
                      <span className="hidden sm:inline">Move Right</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Delete Page */}
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDeleteActivePage}
                        className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 flex items-center gap-1 cursor-pointer ml-1"
                        title="Delete this page"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Page Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Page Title / Header
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1. The Balance Scale Concept or Introduction to Theme"
                    value={activePage.title}
                    onChange={(e) => updateActivePage({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Brief Notes Textarea */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Brief Notes &amp; Concepts (Markdown supported)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Supports bullet points (-), bold (**), and headings (###)
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Write the core concepts, definitions, or principles for this page..."
                    value={activePage.content}
                    onChange={(e) => updateActivePage({ content: e.target.value })}
                    className="w-full p-3 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                  />
                </div>

                {/* WORKED EXAMPLE TOGGLE & FIELDS */}
                <div className="pt-2 border-t border-slate-100">
                  <div
                    onClick={() => updateActivePage({ hasWorkedExample: !activePage.hasWorkedExample })}
                    className="flex items-center gap-2 cursor-pointer select-none py-1 group"
                  >
                    <div className="text-blue-600">
                      {activePage.hasWorkedExample ? (
                        <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      Include Worked Example / Step-by-Step Problem Solving on this page
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                      (Recommended for Maths &amp; Chemistry problems)
                    </span>
                  </div>

                  {/* Worked Example Inputs (Revealed when checked) */}
                  {activePage.hasWorkedExample && (
                    <div className="mt-3 p-3.5 rounded-md bg-amber-50/50 border border-amber-200/80 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                          Worked Example Configuration
                        </span>
                      </div>

                      {/* Callout Badge Title */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-900">
                          Callout Title / Badge
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. WORKED EXAMPLE, STEP-BY-STEP SOLUTION, or EXAMPLE ANALYSIS"
                          value={activePage.exampleTitle || 'WORKED EXAMPLE'}
                          onChange={(e) => updateActivePage({ exampleTitle: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-md bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* Problem Statement */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-900">
                          Problem / Equation to Solve
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Solve for x: 2x + 4 = 12"
                          value={activePage.exampleProblem || ''}
                          onChange={(e) => updateActivePage({ exampleProblem: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-md bg-white border border-amber-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* Step-by-Step Solution */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-900">
                          Step-by-Step Solution &amp; Working
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Step 1: Subtract 4 from both sides → 2x = 8&#10;Step 2: Divide both sides by 2 → x = 4"
                          value={activePage.exampleSolution || ''}
                          onChange={(e) => updateActivePage({ exampleSolution: e.target.value })}
                          className="w-full p-2.5 rounded-md bg-white border border-amber-200 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LIVE PREVIEW OF THIS PAGE */}
                {showPreview && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Live Student Slide Preview (Page {activePageIndex + 1} of {pages.length})
                    </span>
                    <div className="p-4 rounded-md bg-blue-50/30 border border-blue-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase tracking-wider">
                          Page {activePageIndex + 1} of {pages.length}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-950">
                        {activePage.title || 'Untitled Page'}
                      </h4>

                      <div className="text-xs text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                        {activePage.content || '(Brief notes will appear here...)'}
                      </div>

                      {activePage.hasWorkedExample && (
                        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                            {activePage.exampleTitle || 'WORKED EXAMPLE'}
                          </span>
                          {activePage.exampleProblem && (
                            <p className="text-xs font-black text-slate-900">
                              {activePage.exampleProblem}
                            </p>
                          )}
                          {activePage.exampleSolution && (
                            <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                              {activePage.exampleSolution}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* VIDEO ATTACHMENT SECTION                                  */}
          {/* ========================================================= */}
          <div className="p-4 rounded-md bg-blue-50/40 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-900">
                  Video Lesson (NotebookLM or MP4/WebM)
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Direct URL or File Upload
              </span>
            </div>

            {/* Direct Video URL / Path input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Video Path or URL:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="/videos/math_linear_equations.mp4"
                  value={currentVideoUrl}
                  onChange={(e) => setCurrentVideoUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                {currentVideoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveExistingVideo}
                    disabled={isDeletingVideo}
                    className="px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video File Picker Button */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload New Video File</span>
              </button>
              {videoFile && (
                <span className="text-xs font-bold text-emerald-700">
                  Ready to upload: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
              onChange={handleVideoFileChange}
              className="hidden"
            />

            {/* Embedded Video Preview if URL exists */}
            {currentVideoUrl && (
              <div className="mt-2 p-2.5 bg-white rounded-md border border-blue-200/70 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Preview Video:
                </span>
                <div className="w-full max-h-48 bg-black rounded-md overflow-hidden flex items-center justify-center">
                  <video
                    src={currentVideoUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
            {isEditing && (
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={isDeletingTopic || isSaving}
                className="px-3.5 py-2 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 cursor-pointer disabled:opacity-50"
              >
                {isDeletingTopic ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Topic</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-md hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer border border-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingVideo}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving || isUploadingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isUploadingVideo ? 'Uploading Video...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{isEditing ? `Save Changes (${pages.length} Pages)` : `Create Topic (${pages.length} Pages)`}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
