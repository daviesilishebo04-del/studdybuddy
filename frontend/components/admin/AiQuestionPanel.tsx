'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  Trash2,
  RefreshCw,
  FileText,
  HelpCircle,
  Eye,
} from 'lucide-react';
import {
  AiGeneratedQuestion,
  QuestionGenerationResult,
  QuestionType,
  CurriculumSubmission,
} from '@/backend/domain/types';

interface AiQuestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  questionType: QuestionType;
  onQuestionAccepted: () => void;
}

export const AiQuestionPanel: React.FC<AiQuestionPanelProps> = ({
  isOpen,
  onClose,
  topicId,
  topicTitle,
  subjectId,
  subjectName,
  questionType,
  onQuestionAccepted,
}) => {
  // Snaps & selection
  const [submissions, setSubmissions] = useState<CurriculumSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');

  // Teaching profile
  const [teachingProfile, setTeachingProfile] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Generation options
  const [count, setCount] = useState<number>(5);
  const [mentorGuidance, setMentorGuidance] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [generationResult, setGenerationResult] = useState<QuestionGenerationResult | null>(null);
  const [drafts, setDrafts] = useState<AiGeneratedQuestion[]>([]);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);
  const [acceptedCount, setAcceptedCount] = useState<number>(0);
  const [savingTempId, setSavingTempId] = useState<string | null>(null);

  // Load submissions and teaching profile when opened
  useEffect(() => {
    if (!isOpen) return;

    // Fetch submissions
    const loadData = async () => {
      setIsLoadingSubmissions(true);
      try {
        const [subRes, profRes] = await Promise.all([
          fetch('/api/curriculum'),
          fetch(`/api/admin/subjects/${subjectId}/profile`),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          const items: CurriculumSubmission[] = subData.submissions || [];
          setSubmissions(items);

          // Auto-select first matching submission by subject, or first available
          const matching = items.find(
            (s) =>
              s.subjectId === subjectId ||
              (s.subjectName && s.subjectName.toLowerCase() === subjectName.toLowerCase())
          );
          if (matching) {
            setSelectedSubmissionId(matching.id);
          } else if (items.length > 0) {
            setSelectedSubmissionId(items[0].id);
          }
        }

        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.teachingProfile) {
            setTeachingProfile(profData.teachingProfile);
          }
        }
      } catch (err) {
        console.error('Failed to load panel dependencies:', err);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    loadData();
  }, [isOpen, subjectId, subjectName]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachingProfile }),
      });
      if (res.ok) {
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save teaching profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubmissionId) {
      setErrorMsg('Please select a class page submission photo first.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep('Step 1/3: Reading class pages and extracting text...');

    // Progress updates to give visual feedback during 3-step chain
    const timer1 = setTimeout(() => {
      setGenerationStep('Step 2/3: Drafting questions aligned to your golden examples...');
    }, 7000);

    const timer2 = setTimeout(() => {
      setGenerationStep('Step 3/3: Running exam auditor self-check against the source...');
    }, 15000);

    try {
      const res = await fetch('/api/admin/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          submissionId: selectedSubmissionId,
          type: questionType,
          count,
          mentorGuidance,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setGenerationResult(data);
      setDrafts(data.questions || []);
      setAcceptedCount(0);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleAcceptQuestion = async (q: AiGeneratedQuestion) => {
    setSavingTempId(q.tempId);
    setErrorMsg(null);
    try {
      const payload: any = {
        topicId,
        prompt: q.prompt.trim(),
        type: q.type,
        explanation: q.explanation.trim(),
        order: 1,
      };

      if (q.type === 'MCQ') {
        payload.options = q.options;
        payload.correctOptionIndex = q.correctOptionIndex ?? 0;
      } else {
        payload.acceptableAnswers = q.acceptableAnswers;
      }

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save question');
      }

      // Mark local draft as accepted
      setDrafts((prev) =>
        prev.map((item) =>
          item.tempId === q.tempId ? { ...item, isAccepted: true } : item
        )
      );
      setAcceptedCount((prev) => prev + 1);
      onQuestionAccepted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept question');
    } finally {
      setSavingTempId(null);
    }
  };

  const handleDiscardQuestion = (tempId: string) => {
    setDrafts((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleUpdateDraft = (tempId: string, updates: Partial<AiGeneratedQuestion>) => {
    setDrafts((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  };

  const selectedSubmission = submissions.find((s) => s.id === selectedSubmissionId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-lg border-2 border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight leading-tight">
                  Generate {questionType === 'MCQ' ? 'MCQs' : 'Short Answers'} with AI
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/30 border border-blue-300/40 text-blue-100">
                  Prompt v1
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                Topic: <strong className="text-white">{topicTitle}</strong> &bull; Subject:{' '}
                <strong className="text-white">{subjectName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/60">
          {errorMsg && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Configuration Card */}
          <div className="bg-white rounded-md border border-slate-300 p-4 space-y-4 shadow-2xs">
            {/* 1. Snap Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Class Page Snap Source</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  {submissions.length} available snaps
                </span>
              </div>

              {isLoadingSubmissions ? (
                <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs text-slate-600 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading class snaps...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold">
                  No class snaps found yet. Have the pupil upload photos of this topic via the student app!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-40 overflow-y-auto p-1 bg-slate-50/80 rounded border border-slate-200">
                  {submissions.map((sub) => {
                    const isSelected = sub.id === selectedSubmissionId;
                    const previewThumb = sub.imageUrls?.[0];
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubmissionId(sub.id)}
                        className={`p-2.5 rounded text-left transition flex items-center gap-2.5 border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 shadow-2xs ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {previewThumb ? (
                          <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewThumb}
                              alt="Snap thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {sub.chapterTitle || sub.subjectName || 'Class Page'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {sub.imageUrls.length} image{sub.imageUrls.length > 1 ? 's' : ''} &bull;{' '}
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Questions Count & Custom Guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Questions to Draft
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`py-1.5 text-xs font-black rounded border transition cursor-pointer ${
                        count === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Mentor Custom Guidance (Optional)
                </label>
                <input
                  type="text"
                  value={mentorGuidance}
                  onChange={(e) => setMentorGuidance(e.target.value)}
                  placeholder="e.g. Focus on key definitions and tricky concepts..."
                  className="w-full text-xs font-medium px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>

            {/* 3. Teaching Profile Accordion */}
            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/70">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-slate-800">
                    Subject Teaching Profile: {subjectName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    (Informs question tone &amp; cognitive balance)
                  </span>
                </div>
                {isProfileOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {isProfileOpen && (
                <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                  <p className="text-[11px] text-slate-600">
                    Write notes on your teaching style, local Zambian context, or specific areas the pupil finds challenging. The AI uses this alongside your golden examples.
                  </p>
                  <textarea
                    rows={3}
                    value={teachingProfile}
                    onChange={(e) => setTeachingProfile(e.target.value)}
                    placeholder="e.g. Grade 8 Junior Secondary level. Use simple English sentences. Zambian examples (Kwacha, Lusaka, maize). Focus on 60% recall, 30% understanding, 10% application."
                    className="w-full text-xs font-medium p-2.5 rounded border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {profileSaveSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Uses 3-step prompt chain: OCR Transcribe &rarr; Style Generation &rarr; Self-Check Audit
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedSubmissionId}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Chain...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Draft Questions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Animation Box */}
          {isGenerating && (
            <div className="p-6 rounded-md bg-white border border-blue-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div>
                <p className="text-sm font-black text-slate-900">{generationStep}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cross-referencing textbook images against your Grade 8 curriculum standards...
                </p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {generationResult && !isGenerating && (
            <div className="space-y-4">
              {/* Transcript Viewer Accordion */}
              <div className="bg-white rounded-md border border-slate-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                  className="w-full p-3 bg-slate-100/80 flex items-center justify-between hover:bg-slate-100 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-black text-slate-900">
                      What the AI Read (OCR Transcript)
                    </span>
                    {generationResult.unclearCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        {generationResult.unclearCount} [unclear] tokens
                      </span>
                    )}
                  </div>
                  {isTranscriptOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {isTranscriptOpen && (
                  <div className="p-3.5 bg-white text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto border-t border-slate-200 leading-relaxed">
                    {generationResult.transcript}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="text-xs font-bold text-slate-700">
                  {drafts.length} draft questions &bull;{' '}
                  <span className="text-emerald-700 font-black">
                    {acceptedCount} accepted
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  Review each question below. Nothing is saved until you click Accept!
                </div>
              </div>

              {/* Draft Question Cards */}
              <div className="space-y-3.5">
                {drafts.map((q, idx) => (
                  <div
                    key={q.tempId}
                    className={`rounded-md border p-4 space-y-3 transition ${
                      q.isAccepted
                        ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900 uppercase">
                          {q.type === 'MCQ' ? 'Multiple Choice' : 'Short Answer'}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {q.bloomLevel}
                        </span>
                      </div>

                      {q.isAccepted ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accepted &amp; Saved</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDiscardQuestion(q.tempId)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Discard suggestion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Self-Check Warning Flag */}
                    {!q.selfCheckPass && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black">Auditor Note: </span>
                          {q.selfCheckReason}
                        </div>
                      </div>
                    )}

                    {/* Prompt Text Input */}
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">
                        Question Prompt:
                      </label>
                      <textarea
                        rows={2}
                        disabled={q.isAccepted}
                        value={q.prompt}
                        onChange={(e) =>
                          handleUpdateDraft(q.tempId, { prompt: e.target.value })
                        }
                        className="w-full text-xs font-bold p-2 rounded border border-slate-300 focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-100"
                      />
                    </div>

                    {/* Options (MCQ) or Acceptable Answers (Short Answer) */}
                    {q.type === 'MCQ' ? (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-700 block">
                          Options (Select the correct radio button):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                            const isCorrect = q.correctOptionIndex === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-1.5 rounded border ${
                                  isCorrect
                                    ? 'bg-blue-50/70 border-blue-500'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct_${q.tempId}`}
                                  checked={isCorrect}
                                  disabled={q.isAccepted}
                                  onChange={() =>
                                    handleUpdateDraft(q.tempId, {
                                      correctOptionIndex: optIdx,
                                    })
                                  }
                                  className="cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  disabled={q.isAccepted}
                                  onChange={(e) => {
                                    const nextOpts = [...(q.options || [])];
                                    nextOpts[optIdx] = e.target.value;
                                    handleUpdateDraft(q.tempId, {
                                      options: nextOpts,
                                    });
                                  }}
                                  className="w-full text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none focus:border-blue-600 disabled:bg-transparent"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-black text-slate-700 block mb-1">
                          Acceptable Answer Variants (Comma-separated):
                        </label>
                        <input
                          type="text"
                          disabled={q.isAccepted}
                          value={(q.acceptableAnswers || []).join(', ')}
                          onChange={(e) => {
                            const split = e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean);
                            handleUpdateDraft(q.tempId, {
                              acceptableAnswers: split,
                            });
                          }}
                          className="w-full text-xs font-bold px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-100"
                        />
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">
                        Mentor Explanation:
                      </label>
                      <input
                        type="text"
                        disabled={q.isAccepted}
                        value={q.explanation}
                        onChange={(e) =>
                          handleUpdateDraft(q.tempId, { explanation: e.target.value })
                        }
                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-600 bg-white disabled:bg-slate-100"
                      />
                    </div>

                    {/* Source Quote Grounding Bar */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-500">
                      <div className="truncate max-w-md italic">
                        &ldquo;{q.sourceQuote}&rdquo;
                      </div>

                      {!q.isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleAcceptQuestion(q)}
                          disabled={savingTempId === q.tempId}
                          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          {savingTempId === q.tempId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Accept &amp; Save Question</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-bold">
            Antigravity AI Assessment Assistant &bull; Client-side review mode
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
