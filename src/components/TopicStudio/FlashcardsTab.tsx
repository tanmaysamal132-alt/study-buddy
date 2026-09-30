import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Plus,
  Check,
  X,
  HelpCircle,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { Flashcard, Topic, Subject } from '../../types';
import { AIService } from '../../services/ai';
import SoundService from '../../services/audio';

interface FlashcardsTabProps {
  topic: Topic;
  subject?: Subject;
  flashcards: Flashcard[];
  onAddFlashcards: (cards: Flashcard[]) => void;
  onUpdateFlashcard: (card: Flashcard) => void;
  onDeleteFlashcard: (cardId: string) => void;
  onTopicMasteryChange: (delta: number) => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  topic,
  subject,
  flashcards,
  onAddFlashcards,
  onUpdateFlashcard,
  onDeleteFlashcard,
  onTopicMasteryChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [aiCardCount, setAiCardCount] = useState(6);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual card state
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [manualHint, setManualHint] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState<Flashcard['difficulty']>('medium');

  // Topic specific cards
  const topicCards = flashcards.filter((c) => c.topicId === topic.id);
  const currentCard = topicCards[currentIndex];

  // Mastered stats
  const masteredCount = topicCards.filter((c) => c.status === 'mastered').length;
  const masteryPercentage = topicCards.length > 0 ? Math.round((masteredCount / topicCards.length) * 100) : 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, topicCards.length]);

  const handleFlip = () => {
    SoundService.playCardFlipSound();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < topicCards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(Math.floor(Math.random() * topicCards.length));
  };

  const handleMarkStatus = (status: 'learning' | 'mastered') => {
    if (!currentCard) return;

    if (status === 'mastered') {
      SoundService.playSuccessSound();
      if (currentCard.status !== 'mastered') {
        onTopicMasteryChange(5);
      }
    }

    onUpdateFlashcard({
      ...currentCard,
      status,
      reviewCount: (currentCard.reviewCount || 0) + 1,
    });

    handleNext();
  };

  const handleGenerateAiCards = async () => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const generated = await AIService.generateFlashcards({
        topic: topic.title,
        subject: subject?.name,
        count: aiCardCount,
      });

      const newCards: Flashcard[] = generated.map((c, idx) => ({
        id: `fc_${Date.now()}_${idx}`,
        topicId: topic.id,
        question: c.question,
        answer: c.answer,
        hint: c.hint,
        difficulty: (c.difficulty as Flashcard['difficulty']) || 'medium',
        status: 'new',
        reviewCount: 0,
      }));

      onAddFlashcards(newCards);
      setIsAiModalOpen(false);
      setCurrentIndex(topicCards.length);
      setIsFlipped(false);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate flashcards');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim() || !manualAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `fc_manual_${Date.now()}`,
      topicId: topic.id,
      question: manualQuestion.trim(),
      answer: manualAnswer.trim(),
      hint: manualHint.trim() || undefined,
      difficulty: manualDifficulty,
      status: 'new',
      reviewCount: 0,
    };

    onAddFlashcards([newCard]);
    setManualQuestion('');
    setManualAnswer('');
    setManualHint('');
    setIsManualModalOpen(false);
    setCurrentIndex(topicCards.length);
  };

  return (
    <div className="space-y-6">
      {/* Deck Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Flashcard Deck
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              {topicCards.length} cards
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {masteredCount} mastered ({masteryPercentage}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px]">Space</kbd> to flip, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-[10px]">→</kbd> to navigate
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Generate Cards</span>
          </button>
        </div>
      </div>

      {topicCards.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No flashcards in this deck
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            Generate active-recall flashcards using Gemini AI or create your own custom study cards.
          </p>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Flashcards with AI</span>
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 3D Flip Card Container */}
          <div
            className="perspective-1000 w-full min-h-[300px] sm:min-h-[340px] cursor-pointer"
            onClick={handleFlip}
          >
            <div
              className={`relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200 dark:border-slate-800 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 backface-hidden flex flex-col justify-between select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                    Question • {currentCard.difficulty}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Card {currentIndex + 1} of {topicCards.length}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this flashcard?')) {
                          onDeleteFlashcard(currentCard.id);
                          if (currentIndex >= topicCards.length - 1) {
                            setCurrentIndex(Math.max(0, currentIndex - 1));
                          }
                        }
                      }}
                      className="p-1 hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    {currentCard.question}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click card to reveal answer</span>
                  </div>
                  {currentCard.hint && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                  )}
                </div>

                {showHint && currentCard.hint && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs"
                  >
                    💡 <strong>Hint:</strong> {currentCard.hint}
                  </div>
                )}
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/90 rotate-y-180 backface-hidden flex flex-col justify-between select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                    Correct Answer
                  </span>
                  <span className="text-xs text-slate-400">
                    Card {currentIndex + 1} of {topicCards.length}
                  </span>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-base sm:text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>How well did you know this?</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Flip back to question
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recall Review Feedback Bar (shown when flipped or directly) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleMarkStatus('learning')}
              className="py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <X className="w-4 h-4 text-rose-500" />
              <span>Need Review (Again)</span>
            </button>
            <button
              onClick={() => handleMarkStatus('mastered')}
              className="py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Got It (Mastered)</span>
            </button>
          </div>

          {/* Deck Navigation Controls */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentIndex + 1} / {topicCards.length}
              </span>
              <button
                onClick={handleShuffle}
                title="Shuffle card"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === topicCards.length - 1}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* AI Generate Cards Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate AI Flashcards</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Topic: {topic.title}
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Gemini will distill core definitions, mechanisms, and key relationships into targeted flashcards with hints.
            </p>

            {aiError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Number of Cards
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAiCardCount(num)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      aiCardCount === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {num} Cards
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isAiLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiCards}
                disabled={isAiLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {isAiLoading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Card Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Add Custom Flashcard
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Write a question and answer for active recall.
            </p>

            <form onSubmit={handleCreateManualCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question (Front)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. What is the time complexity of QuickSort?"
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Answer (Back)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. O(n log n) average, O(n^2) worst case."
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Think about pivot choice"
                  value={manualHint}
                  onChange={(e) => setManualHint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={manualDifficulty}
                  onChange={(e) => setManualDifficulty(e.target.value as Flashcard['difficulty'])}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
