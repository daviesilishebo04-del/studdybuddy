'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { TopicWithCounts } from '@/backend/repositories/adminRepository';
import { Question } from '@/backend/domain/types';

interface QuizBuilderProps {
  topics: TopicWithCounts[];
  selectedTopicId?: string;
  onTopicChange?: (topicId: string) => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  topics,
  selectedTopicId,
  onTopicChange,
}) => {
  const [topicId, setTopicId] = useState<string>(
    selectedTopicId || (topics.length > 0 ? topics[0].id : '')
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Form fields
  const [prompt, setPrompt] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [order, setOrder] = useState<number>(1);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prevSelectedTopicId, setPrevSelectedTopicId] = useState(selectedTopicId);
  if (selectedTopicId !== prevSelectedTopicId) {
    setPrevSelectedTopicId(selectedTopicId);
    if (selectedTopicId && selectedTopicId !== topicId) {
      setTopicId(selectedTopicId);
    }
  }

  const loadQuestions = async (tId: string) => {
    if (!tId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/questions?topicId=${tId}&type=MCQ`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error('Failed to load MCQ questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!topicId) return;
    let ignore = false;

    Promise.resolve().then(async () => {
      if (ignore) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/questions?topicId=${topicId}&type=MCQ`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setQuestions(data);
        }
      } catch (err) {
        if (!ignore) console.error('Failed to load MCQ questions:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [topicId]);


  const handleTopicSelect = (newTopicId: string) => {
    setTopicId(newTopicId);
    setIsFormOpen(false);
    setEditingQuestionId(null);
    if (onTopicChange) onTopicChange(newTopicId);
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleOpenCreateForm = () => {
    setEditingQuestionId(null);
    setPrompt('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setExplanation('');
    setOrder(questions.length + 1);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (q: Question) => {
    setEditingQuestionId(q.id);
    setPrompt(q.prompt);
    setOptions(q.options && q.options.length >= 4 ? q.options : [...(q.options || []), '', '', '', ''].slice(0, 4));
    setCorrectOptionIndex(q.correctOptionIndex ?? 0);
    setExplanation(q.explanation || '');
    setOrder(q.order);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFormOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!prompt.trim()) {
      setErrorMsg('Question prompt is required');
      return;
    }

    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      setErrorMsg('Please fill in all 4 multiple choice options');
      return;
    }

    setIsSaving(true);
    try {
      if (editingQuestionId) {
        // Update existing question
        const res = await fetch(`/api/admin/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim(),
            options: filledOptions,
            correctOptionIndex,
            explanation: explanation.trim(),
            order,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update question');
        }
      } else {
        // Create new question
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId,
            prompt: prompt.trim(),
            type: 'MCQ',
            options: filledOptions,
            correctOptionIndex,
            explanation: explanation.trim(),
            order,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create question');
        }
      }

      setSuccessMsg(editingQuestionId ? 'Question updated!' : 'Question added!');
      setIsFormOpen(false);
      setEditingQuestionId(null);
      await loadQuestions(topicId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save question';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadQuestions(topicId);
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const currentTopic = topics.find((t) => t.id === topicId);

  return (
    <div className="flex flex-col gap-5">
      {/* Header with Topic Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-md p-5 sm:p-6 border border-blue-300/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Multiple Choice (MCQ) Quiz Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Build 4-option questions with explanations for Alex to test his understanding.
          </p>
        </div>

        {/* Topic Selector */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Select Topic
            </span>
            <select
              value={topicId}
              onChange={(e) => handleTopicSelect(e.target.value)}
              className="px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-xs truncate"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subjectName}: {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreateForm}
            className="px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer mt-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add MCQ</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add / Edit Form Modal or Inline Box */}
      {isFormOpen && (
        <div className="bg-blue-50/50 rounded-md p-5 border border-blue-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              {editingQuestionId ? 'Edit MCQ Question' : 'Add New MCQ Question'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveQuestion} className="space-y-4">
            {/* Prompt */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Question Prompt</label>
              <textarea
                rows={2}
                placeholder="e.g. Solve for x: 3x + 7 = 22"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            {/* 4 Options with Radio for Correct Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Answer Options &amp; Correct Answer Selection
              </label>
              <p className="text-[11px] text-slate-500 font-medium mb-2">
                Type the 4 options below and select the radio button corresponding to the correct answer.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, idx) => {
                  const isCorrect = correctOptionIndex === idx;
                  const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCorrectOptionIndex(idx)}
                      className={`flex items-center gap-3 p-3 rounded-md border transition cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctOption"
                        checked={isCorrect}
                        onChange={() => setCorrectOptionIndex(idx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {labels[idx]} {isCorrect && '• Correct Answer'}
                        </span>
                        <input
                          type="text"
                          placeholder={`Enter ${labels[idx]}`}
                          value={opt}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOptionChange(idx, e.target.value);
                          }}
                          className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Explanation (Shown to student after answering)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Subtract 7 from both sides: 3x = 15, then divide by 3: x = 5."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-3 rounded-md bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-md text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{editingQuestionId ? 'Update Question' : 'Save Question'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Questions List */}
      {isLoading ? (
        <div className="bg-white rounded-md p-12 text-center border border-blue-200/80 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-md p-12 text-center border border-blue-200/80 text-slate-400">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No MCQ questions yet for this topic</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add MCQ&quot; above to add multiple choice questions.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-md p-5 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-xs bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center border border-blue-200/60">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question
                  </span>
                </div>

                <p className="text-sm font-black text-slate-950 leading-snug">{q.prompt}</p>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options?.map((opt, optIdx) => {
                    const isCorrect = q.correctOptionIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 font-bold'
                            : 'bg-slate-50 text-slate-700 border border-slate-200/70'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation preview */}
                {q.explanation && (
                  <p className="text-xs text-slate-600 bg-blue-50/30 p-2.5 rounded-md border border-blue-200/60 font-medium">
                    <span className="font-bold text-slate-800">Explanation:</span>{' '}
                    {q.explanation}
                  </p>
                )}
              </div>

              {/* Edit / Delete actions */}
              <div className="flex items-center gap-2 self-end sm:self-start">
                <button
                  onClick={() => handleOpenEditForm(q)}
                  className="p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-transparent hover:border-slate-200"
                  title="Edit question"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  disabled={deletingId === q.id}
                  className="p-2 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer border border-transparent hover:border-rose-200 disabled:opacity-50"
                  title="Delete question"
                >
                  {deletingId === q.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
