'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Award, CheckCircle2, AlertCircle, ArrowRight, Sparkles, BookOpen, Video } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Topic, Question, MetacognitiveRating } from '@/backend/domain/types';
import { parseTopicPages } from '@/frontend/lib/studyPages';
import { useStudyTelemetry } from '../hooks/useStudyTelemetry';

interface StudyModalProps {
  topic: Topic;
  questions: Question[];
  userId: string;
  onClose: () => void;
  onQuizCompleted: () => void;
}

type ModalStage = 'NOTES' | 'QUIZ' | 'METACOGNITIVE' | 'RESULTS';

export const StudyModal: React.FC<StudyModalProps> = ({
  topic,
  questions,
  userId,
  onClose,
  onQuizCompleted,
}) => {
  const [stage, setStage] = useState<ModalStage>('NOTES');
  const [notesViewMode, setNotesViewMode] = useState<'NOTES' | 'VIDEO'>('NOTES');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [answeredStates, setAnsweredStates] = useState<{ [qId: string]: boolean }>({});
  const [selfRating, setSelfRating] = useState<MetacognitiveRating | null>(null);
  const [quizResults, setQuizResults] = useState<{
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
    calibrationMessage: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [notePageIndex, setNotePageIndex] = useState<number>(0);

  // Active study duration tracking hook
  const { activeSeconds, flushHeartbeat } = useStudyTelemetry({
    userId,
    topicId: topic.id,
    enabled: true,
  });

  // Multi-page study slide generator dynamically parsed from topic.notesMarkdown
  const getTopicSlides = () => {
    const isMath =
      topic.subjectId?.includes('math') ||
      topic.slug?.includes('math') ||
      topic.slug?.includes('algebra');
    const badgeText = isMath ? 'MATHEMATICS' : 'LITERATURE';
    const badgeBg = isMath ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white';

    const parsedPages = parseTopicPages(topic.notesMarkdown, topic.title);

    return parsedPages.map((page) => {
      const paragraphs = page.content.split('\n\n').filter(Boolean);

      return {
        badge: badgeText,
        badgeBg,
        title: page.title,
        paragraphs: paragraphs.length > 0 ? paragraphs : [page.content || ''],
        hasWorkedExample: Boolean(page.hasWorkedExample),
        calloutTitle: page.exampleTitle || 'WORKED EXAMPLE',
        exampleProblem: page.exampleProblem || '',
        exampleSolution: page.exampleSolution || '',
        calloutText: page.exampleProblem
          ? `${page.exampleProblem}${page.exampleSolution ? `\n\n${page.exampleSolution}` : ''}`
          : page.exampleSolution || '',
      };
    });
  };

  const slides = getTopicSlides();
  const currentSlide = slides[notePageIndex] || slides[0];

  const currentQuestion = questions[currentQIndex];

  const handleSelectOption = (idx: number) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx.toString() }));
  };

  const handleTypedAnswer = (val: string) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleConfirmQuestionAnswer = () => {
    if (!currentQuestion) return;
    setAnsweredStates((prev) => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNextOrFinishQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setStage('METACOGNITIVE');
    }
  };

  const handleSelectRatingAndSubmit = async (rating: MetacognitiveRating) => {
    setSelfRating(rating);
    setIsSubmitting(true);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        userResponse: userAnswers[q.id] || '',
        timeTakenSec: Math.round(activeSeconds / Math.max(1, questions.length)),
      }));

      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topicId: topic.id,
          durationSeconds: activeSeconds,
          selfRating: rating,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResults({
          scorePercent: data.evaluation.scorePercent,
          correctCount: data.evaluation.correctCount,
          totalQuestions: data.evaluation.totalQuestions,
          calibrationMessage: data.calibration.message,
        });

        if (data.evaluation.scorePercent >= 60) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

        setStage('RESULTS');
      }
    } catch (err) {
      console.error('Quiz submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Educational video fallback resolver
  const getVideoUrl = () => {
    if (topic.videoUrl) return topic.videoUrl;
    const isMath =
      topic.subjectId?.includes('math') ||
      topic.slug?.includes('math') ||
      topic.slug?.includes('algebra');
    if (isMath) {
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  return (
    <AnimatePresence>
      {/* Full Screen View: Covers the whole screen on mobile and desktop without curved window edges */}
      <div className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-[#cce0fb] flex flex-col overflow-y-auto antialiased">
        
        {/* Full-width Top Header Bar (Covers 100% of viewport width) */}
        <header className="w-full px-4 sm:px-8 py-3.5 bg-white/90 backdrop-blur-md border-b border-[#b3d1f8] flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatTime(activeSeconds)} active</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 truncate max-w-[200px] sm:max-w-md">
              {topic.title}
            </span>
          </div>

          <button
            onClick={() => {
              flushHeartbeat();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Exit Study</span>
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Full Screen Content Workspace (Max-w-4xl for comfortable readability on widescreen) */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-5 sm:py-7 flex flex-col justify-between">
          
          {/* Stage 1: Study Content & Video Mode */}
          {stage === 'NOTES' && (
            <div className="flex flex-col gap-4">
              
              {/* Always Available View Mode Toggle: Study Notes vs Watch Video */}
              <div className="flex items-center gap-2 p-1 bg-white border border-[#b3d1f8] rounded-md shadow-2xs">
                <button
                  type="button"
                  onClick={() => setNotesViewMode('NOTES')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs sm:text-sm font-black transition cursor-pointer ${
                    notesViewMode === 'NOTES'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Study Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesViewMode('VIDEO')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs sm:text-sm font-black transition cursor-pointer ${
                    notesViewMode === 'VIDEO'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Watch Video Lesson</span>
                </button>
              </div>

              {/* View 1A: Watch Video Lesson View (Rectangular Box) */}
              {notesViewMode === 'VIDEO' ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-md overflow-hidden bg-black border border-slate-700 shadow-md flex items-center justify-center">
                    <video
                      src={getVideoUrl()}
                      controls
                      autoPlay
                      playsInline
                      className="w-full max-h-[460px] object-contain rounded-md"
                    />
                  </div>

                  <div className="bg-white rounded-md p-5 sm:p-6 border border-[#b3d1f8] shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider mb-1">
                      <span>Video Lesson</span>
                      <span>•</span>
                      <span>Grade 8 Curriculum</span>
                    </div>
                    <h3 className="font-black text-slate-950 text-lg sm:text-xl">
                      {topic.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2">
                      Watch the complete lesson above. You can switch back to the Study Notes at any time using the toggle to review key formulas and worked examples.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotesViewMode('NOTES')}
                    className="w-full py-3.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Return to Study Notes (Pages 1 to {slides.length})</span>
                  </button>
                </div>
              ) : (
                /* View 1B: Paginated Topic Notes (Rectangular Box) */
                <div className="flex flex-col gap-4">
                  {/* Page Header Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md ${currentSlide.badgeBg}`}
                    >
                      {currentSlide.badge}
                    </span>

                    {/* Page X of Y with Step Pills */}
                    <div className="flex items-center gap-2 bg-white border border-blue-200/90 px-3 py-1 rounded-md shadow-2xs">
                      <span className="text-xs font-black text-slate-700">
                        Page {notePageIndex + 1} of {slides.length}
                      </span>
                      <div className="flex items-center gap-1">
                        {slides.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-sm transition-all duration-300 ${
                              idx === notePageIndex
                                ? 'w-5 bg-blue-600'
                                : idx < notePageIndex
                                ? 'w-2 bg-blue-300'
                                : 'w-2 bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Slide Title */}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 leading-snug tracking-tight">
                    {currentSlide.title}
                  </h2>

                  {/* Pure White Study Card (Crisp Rectangular Box) */}
                  <div className="bg-white rounded-md p-6 sm:p-7 border border-[#b3d1f8] shadow-xs text-slate-800 text-sm sm:text-base leading-relaxed space-y-3 font-sans">
                    {currentSlide.paragraphs.map((para, pIdx) => (
                      <p
                        key={pIdx}
                        className="whitespace-pre-line text-xs sm:text-base font-medium text-slate-700 leading-relaxed"
                      >
                        {para}
                      </p>
                    ))}

                    {/* Worked Example Box (Rectangular Box) */}
                    {currentSlide.hasWorkedExample && (
                      <div className="bg-amber-50/80 rounded-md p-4 sm:p-5 border border-amber-200 mt-4 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-800 tracking-wider uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{currentSlide.calloutTitle || 'WORKED EXAMPLE'}</span>
                        </div>

                        {currentSlide.exampleProblem && (
                          <div className="text-xs sm:text-sm font-black text-slate-950 font-mono sm:font-sans">
                            {currentSlide.exampleProblem}
                          </div>
                        )}

                        {currentSlide.exampleSolution ? (
                          <div className="text-xs sm:text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-md border border-amber-200/60">
                            {currentSlide.exampleSolution}
                          </div>
                        ) : currentSlide.calloutText ? (
                          <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed font-mono sm:font-sans">
                            {currentSlide.calloutText}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Navigation Action Footer: Rectangular Previous, Next Page, or Final Quiz Button */}
                  <div className="flex items-center gap-3 pt-4">
                    {notePageIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotePageIndex((prev) => prev - 1)}
                        className="px-5 py-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                      >
                        <span>← Previous</span>
                      </button>
                    )}

                    {notePageIndex < slides.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setNotePageIndex((prev) => prev + 1)}
                        className="flex-1 py-3 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer ml-auto"
                      >
                        <span>Next Page ({notePageIndex + 2} of {slides.length})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      /* Quiz button strictly on the end of the last page */
                      <button
                        type="button"
                        onClick={() => setStage('QUIZ')}
                        className="flex-1 py-3.5 px-5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <span>Ready for Quick Quiz ({questions.length} Questions)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Quiz Runner (Rectangular Boxes) */}
          {stage === 'QUIZ' && currentQuestion && (
            <div className="flex flex-col gap-4">
              {/* Progress Bar Header */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Question {currentQIndex + 1} of {questions.length}</span>
                  <span>{Math.round(((currentQIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-sm overflow-hidden border border-blue-200/50">
                  <div
                    className="h-full bg-blue-600 rounded-sm transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Prompt */}
              <div className="bg-white border border-[#b3d1f8] rounded-md p-5 sm:p-6 shadow-xs">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.prompt}
                </h3>
              </div>

              {/* Question Inputs */}
              {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                <div className="flex flex-col gap-2.5">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentQuestion.id] === oIdx.toString();
                    const isConfirmed = answeredStates[currentQuestion.id];
                    const isCorrectOption = oIdx === currentQuestion.correctOptionIndex;

                    let buttonStyle = 'bg-white border-blue-200 hover:border-blue-400 text-slate-800 font-medium shadow-2xs';
                    if (isSelected) {
                      buttonStyle = 'bg-blue-100/90 border-blue-600 text-blue-950 font-bold shadow-xs';
                    }
                    if (isConfirmed) {
                      if (isCorrectOption) {
                        buttonStyle = 'bg-emerald-100/90 border-emerald-600 text-emerald-950 font-bold';
                      } else if (isSelected && !isCorrectOption) {
                        buttonStyle = 'bg-rose-100/90 border-rose-500 text-rose-950 font-bold';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isConfirmed}
                        onClick={() => handleSelectOption(oIdx)}
                        className={`p-4 rounded-md border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${buttonStyle}`}
                      >
                        <span className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs flex-shrink-0 text-blue-900">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer Input */}
              {currentQuestion.type === 'SHORT_ANSWER' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    disabled={answeredStates[currentQuestion.id]}
                    placeholder="Type your final answer..."
                    value={userAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleTypedAnswer(e.target.value)}
                    className="p-3.5 rounded-md border border-blue-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-900"
                  />
                  <p className="text-xs text-slate-700 font-medium">Work out on scratch paper, then type final answer.</p>
                </div>
              )}

              {/* Instant Feedback if answered */}
              {answeredStates[currentQuestion.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Feedback &amp; Explanation:</span>
                  </div>
                  <p>{currentQuestion.explanation}</p>
                </motion.div>
              )}

              {/* Bottom Action Button */}
              {!answeredStates[currentQuestion.id] ? (
                <button
                  disabled={!userAnswers[currentQuestion.id]}
                  onClick={handleConfirmQuestionAnswer}
                  className="w-full py-3.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleNextOrFinishQuestion}
                  className="w-full py-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>{currentQIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Stage 3: Metacognitive Self-Assessment (Rectangular Boxes) */}
          {stage === 'METACOGNITIVE' && (
            <div className="flex flex-col gap-4 text-center py-2 max-w-lg mx-auto w-full">
              <div className="w-14 h-14 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <Award className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Quiz Completed!</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Before seeing your score, how did this topic feel for you?
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleSelectRatingAndSubmit('EASY')}
                  className="p-4 rounded-md border-2 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-800 font-bold text-sm flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 inline-block" />
                    <span>Easy</span>
                  </div>
                  <span className="text-xs font-normal text-emerald-700">I felt totally confident!</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleSelectRatingAndSubmit('FAIR')}
                  className="p-4 rounded-md border-2 border-amber-300 bg-amber-50/70 hover:bg-amber-50 text-amber-800 font-bold text-sm flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 inline-block" />
                    <span>Fair</span>
                  </div>
                  <span className="text-xs font-normal text-amber-700">Understood most of it.</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleSelectRatingAndSubmit('HARD')}
                  className="p-4 rounded-md border-2 border-rose-300 bg-rose-50/70 hover:bg-rose-50 text-rose-800 font-bold text-sm flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 inline-block" />
                    <span>Hard</span>
                  </div>
                  <span className="text-xs font-normal text-rose-700">Felt challenging, need practice.</span>
                </button>
              </div>
            </div>
          )}

          {/* Stage 4: Results & Calibration (Rectangular Boxes) */}
          {stage === 'RESULTS' && quizResults && (
            <div className="flex flex-col gap-5 text-center py-4 max-w-lg mx-auto w-full">
              {/* Score Box */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-md bg-blue-600 text-white flex flex-col items-center justify-center shadow-md">
                  <span className="text-2xl font-black">{quizResults.scorePercent}%</span>
                  <span className="text-[10px] font-semibold opacity-90">Score</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg mt-3">
                  {quizResults.scorePercent >= 80 ? 'Outstanding Work!' : 'Good Effort, Champ!'}
                </h3>
                <p className="text-xs text-slate-600">
                  You got {quizResults.correctCount} of {quizResults.totalQuestions} questions correct.
                </p>
              </div>

              {/* Metacognitive Calibration Banner */}
              <div className="bg-white rounded-md p-4 border border-[#b3d1f8] text-left text-xs space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Metacognitive Insight:</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {quizResults.calibrationMessage}
                </p>
              </div>

              <button
                onClick={() => {
                  flushHeartbeat();
                  onQuizCompleted();
                  onClose();
                }}
                className="w-full py-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
              >
                Awesome! Return to Dashboard
              </button>
            </div>
          )}

        </main>
      </div>
    </AnimatePresence>
  );
};
