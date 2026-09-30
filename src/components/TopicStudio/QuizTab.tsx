import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCw,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, QuizAttempt, Topic, Subject } from '../../types';
import { AIService } from '../../services/ai';
import SoundService from '../../services/audio';

interface QuizTabProps {
  topic: Topic;
  subject?: Subject;
  onSaveQuizAttempt: (attempt: QuizAttempt) => void;
  onTopicMasteryChange: (delta: number) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  topic,
  subject,
  onSaveQuizAttempt,
  onTopicMasteryChange,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionIndex: number; selectedIndex: number; isCorrect: boolean }[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Generator settings
  const [isGenerating, setIsGenerating] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [genDifficulty, setGenDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);

  const currentQ = questions[currentQuestionIndex];

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setError(null);
    setIsQuizCompleted(false);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);

    try {
      const generated = await AIService.generateQuiz({
        topic: topic.title,
        subject: subject?.name,
        count: genCount,
        difficulty: genDifficulty,
      });

      if (!generated || generated.length === 0) {
        throw new Error('No questions received from AI');
      }

      setQuestions(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null || !currentQ || isAnswerSubmitted) return;

    const isCorrect = selectedOptionIndex === currentQ.correctOptionIndex;
    if (isCorrect) {
      SoundService.playSuccessSound();
    }

    const updatedAnswers = [
      ...userAnswers,
      {
        questionIndex: currentQuestionIndex,
        selectedIndex: selectedOptionIndex,
        isCorrect,
      },
    ];
    setUserAnswers(updatedAnswers);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      // Complete quiz
      const correctCount = userAnswers.filter((a) => a.isCorrect).length;
      const finalScore = correctCount;
      const percentage = Math.round((finalScore / questions.length) * 100);

      // Trigger confetti if high score
      if (percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        onTopicMasteryChange(10);
      } else {
        onTopicMasteryChange(3);
      }

      const attempt: QuizAttempt = {
        id: `qa_${Date.now()}`,
        topicId: topic.id,
        score: finalScore,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
        questions,
        userAnswers,
      };

      onSaveQuizAttempt(attempt);
      setIsQuizCompleted(true);
    }
  };

  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Quiz Header & Setup Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Interactive Diagnostic Quiz</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Auto-graded active recall quiz with in-depth question explanations.
          </p>
        </div>

        {/* Generator Controls */}
        <div className="flex items-center gap-2">
          <select
            value={genDifficulty}
            onChange={(e) => setGenDifficulty(e.target.value as any)}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value="easy">Easy (Foundational)</option>
            <option value="medium">Medium (Standard)</option>
            <option value="hard">Hard (Advanced)</option>
          </select>

          <select
            value={genCount}
            onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={8}>8 Questions</option>
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Crafting Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{questions.length > 0 ? 'New Quiz' : 'Generate Quiz'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main View Area */}
      {isGenerating ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <RotateCw className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Gemini 3.6 Flash is generating diagnostic questions...
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Formulating questions, plausible distractors, and pedagogical answer breakdowns for &ldquo;{topic.title}&rdquo;.
          </p>
        </div>
      ) : isQuizCompleted ? (
        /* Quiz Complete Results Screen */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Quiz Completed!
            </h3>
            <p className="text-xs text-slate-500">
              Diagnostic assessment for &ldquo;{topic.title}&rdquo;
            </p>
          </div>

          {/* Score Badge */}
          <div className="inline-block p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
              {scorePercent}%
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {correctCount} of {questions.length} questions correct
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {scorePercent >= 80
              ? '🌟 Fantastic mastery! You have solidified strong mental models of these core concepts.'
              : scorePercent >= 60
              ? '👍 Good work! Review the explanations below and hit the flashcard deck to cement the gaps.'
              : 'Keep practicing! Review the detailed explanations below and re-test when ready.'}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsQuizCompleted(false);
                setCurrentQuestionIndex(0);
                setSelectedOptionIndex(null);
                setIsAnswerSubmitted(false);
                setUserAnswers([]);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Retake Same Quiz
            </button>
            <button
              onClick={handleGenerateQuiz}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate Fresh Quiz</span>
            </button>
          </div>

          {/* Question Review Breakdown */}
          <div className="text-left pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Question-by-Question Review
            </h4>

            {questions.map((q, idx) => {
              const userAns = userAnswers.find((a) => a.questionIndex === idx);
              const isCorrect = userAns?.isCorrect;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      Q{idx + 1}: {q.question}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pl-6">
                    <div>
                      <strong>Your Answer:</strong>{' '}
                      <span className={isCorrect ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                        {userAns ? q.options[userAns.selectedIndex] : 'No answer'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <strong>Correct Answer:</strong>{' '}
                        <span className="text-emerald-600 font-semibold">
                          {q.options[q.correctOptionIndex]}
                        </span>
                      </div>
                    )}
                    <div className="pt-1.5 text-slate-500 italic">
                      💡 {q.explanation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : questions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Ready to test your knowledge?
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            Generate an AI quiz on &ldquo;{topic.title}&rdquo; to evaluate your comprehension and expose blind spots.
          </p>
          <button
            onClick={handleGenerateQuiz}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Quiz Now</span>
          </button>
        </div>
      ) : (
        /* Active Quiz Taking Interface */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Bar & Header */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>Score: {userAnswers.filter((a) => a.isCorrect).length} correct</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentQ.question}
            </h3>

            {/* 4 Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrect = idx === currentQ.correctOptionIndex;

                let optionStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 hover:border-indigo-300';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-semibold';
                  } else {
                    optionStyle = 'opacity-50 border-slate-200 dark:border-slate-800 text-slate-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Educational Explanation Box (Shown after submission) */}
            {isAnswerSubmitted && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 animate-fade-in space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pedagogical Breakdown</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Bottom Action Button */}
            <div className="flex justify-end pt-2">
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOptionIndex === null}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
