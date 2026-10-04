'use client';

import React, { useState } from 'react';
import {
  Plus,
  Video,
  FileText,
  Edit3,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Subject, TopicWithCounts } from '@/backend/repositories/adminRepository';
import { TopicEditor } from './TopicEditor';

interface TopicManagerProps {
  initialTopics: TopicWithCounts[];
  subjects: Subject[];
  onNavigateToQuiz?: (topicId: string) => void;
  onNavigateToShortAnswer?: (topicId: string) => void;
}

export const TopicManager: React.FC<TopicManagerProps> = ({
  initialTopics,
  subjects,
  onNavigateToQuiz,
  onNavigateToShortAnswer,
}) => {
  const [topics, setTopics] = useState<TopicWithCounts[]>(initialTopics);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [activeEditorTopic, setActiveEditorTopic] = useState<TopicWithCounts | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refreshTopics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/topics');
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error('Failed to refresh topics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTopics = topics.filter((t) => {
    if (selectedSubjectId === 'ALL') return true;
    return t.subjectId === selectedSubjectId;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-md p-5 sm:p-6 border border-blue-300/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Curriculum &amp; Topic Notes
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Create modules, author microlearning notes, and attach video lectures for each topic.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Topic</span>
        </button>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSubjectId('ALL')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition cursor-pointer shrink-0 ${
            selectedSubjectId === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-blue-50 border border-blue-200/80'
          }`}
        >
          All Subjects ({topics.length})
        </button>
        {subjects.map((s) => {
          const count = topics.filter((t) => t.subjectId === s.id).length;
          const isSelected = selectedSubjectId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-bold transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-blue-200/80'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="bg-white rounded-md p-12 text-center border border-blue-200/80 text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No topics found for this subject</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add New Topic&quot; to author notes and attach videos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-md p-5 border border-blue-200/80 shadow-xs hover:border-blue-400/80 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                {/* Subject & Week Info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200/60">
                    {topic.subjectName} • Week {topic.weekNumber}
                  </span>
                  {topic.hasVideo ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <Video className="w-3 h-3" />
                      Video Lesson
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">No video attached</span>
                  )}
                </div>

                {/* Title & Summary */}
                <h3 className="text-base font-black text-slate-950 leading-snug">
                  {topic.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2">
                  {topic.summary}
                </p>

                {/* Question Counts */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2 h-2 rounded-xs bg-blue-500" />
                    <span>{topic.mcqCount} MCQs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span className="w-2 h-2 rounded-xs bg-purple-500" />
                    <span>{topic.shortAnswerCount} Short Answers</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveEditorTopic(topic)}
                  className="px-2.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Edit Notes & Video"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Notes/Video</span>
                </button>

                <button
                  onClick={() => onNavigateToQuiz && onNavigateToQuiz(topic.id)}
                  className="px-2.5 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/60"
                  title="Manage MCQ Quizzes"
                >
                  <span>MCQs ({topic.mcqCount})</span>
                </button>

                <button
                  onClick={() => onNavigateToShortAnswer && onNavigateToShortAnswer(topic.id)}
                  className="px-2.5 py-2 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200/60"
                  title="Manage Short Answer Questions"
                >
                  <span>One-Word ({topic.shortAnswerCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Editor Modal (Create or Edit) */}
      {(activeEditorTopic || isCreatingNew) && (
        <TopicEditor
          topic={activeEditorTopic}
          subjects={subjects}
          onClose={() => {
            setActiveEditorTopic(null);
            setIsCreatingNew(false);
          }}
          onSaved={() => {
            setActiveEditorTopic(null);
            setIsCreatingNew(false);
            refreshTopics();
          }}
          onDeleted={() => {
            setActiveEditorTopic(null);
            setIsCreatingNew(false);
            refreshTopics();
          }}
        />
      )}
    </div>
  );
};
