import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Layers,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { Topic, Subject, Flashcard, QuizAttempt } from '../../types';
import { AIService } from '../../services/ai';
import { ExplainTab } from './ExplainTab';
import { FlashcardsTab } from './FlashcardsTab';
import { QuizTab } from './QuizTab';
import { ChatTab } from './ChatTab';

export type StudioTab = 'explain' | 'flashcards' | 'quiz' | 'chat';

interface TopicStudioProps {
  topic: Topic;
  subject?: Subject;
  allTopics: Topic[];
  flashcards: Flashcard[];
  onSelectTopic: (topicId: string) => void;
  onCreateTopic?: (topData: Omit<Topic, 'id' | 'lastStudiedAt' | 'masteryLevel'>, autoSelect?: boolean) => void;
  onBackToDashboard: () => void;
  onUpdateTopicExplanation: (level: string, text: string) => void;
  onSaveTopicQuestionAnswer?: (topicId: string, qa: { id: string; question: string; answer: string; timestamp: number }) => void;
  onDeleteTopicQuestionAnswer?: (topicId: string, questionId: string) => void;
  onAddFlashcards: (cards: Flashcard[]) => void;
  onUpdateFlashcard: (card: Flashcard) => void;
  onDeleteFlashcard: (cardId: string) => void;
  onSaveQuizAttempt: (attempt: QuizAttempt) => void;
  onTopicMasteryChange: (delta: number) => void;
  initialTab?: StudioTab;
}

export const TopicStudio: React.FC<TopicStudioProps> = ({
  topic,
  subject,
  allTopics,
  flashcards,
  onSelectTopic,
  onCreateTopic,
  onBackToDashboard,
  onUpdateTopicExplanation,
  onSaveTopicQuestionAnswer,
  onDeleteTopicQuestionAnswer,
  onAddFlashcards,
  onUpdateFlashcard,
  onDeleteFlashcard,
  onSaveQuizAttempt,
  onTopicMasteryChange,
  initialTab = 'explain',
}) => {
  const [currentTab, setCurrentTab] = useState<StudioTab>(initialTab);
  const [isTopicPickerOpen, setIsTopicPickerOpen] = useState(false);
  const generatingCardsTopicIdRef = useRef<string | null>(null);

  const topicCardsCount = flashcards.filter((c) => c.topicId === topic.id).length;

  // AUTOMATIC FLASHCARD GENERATION IN BACKGROUND (Don't ask, prepare cards immediately!)
  useEffect(() => {
    const existingCards = flashcards.filter((c) => c.topicId === topic.id);
    if (existingCards.length === 0 && generatingCardsTopicIdRef.current !== topic.id) {
      generatingCardsTopicIdRef.current = topic.id;
      AIService.generateFlashcards({
        topic: topic.title,
        subject: subject?.name,
        count: 6,
      })
        .then((generated) => {
          if (generated && generated.length > 0) {
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
          }
        })
        .catch((err) => {
          console.warn('Auto flashcards generation fallback:', err);
        });
    }
  }, [topic.id, flashcards.length]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Studio Header & Topic Selector */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={onBackToDashboard}
                className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {subject?.name || 'General'}
              </span>
            </div>

            {/* Topic Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTopicPickerOpen(!isTopicPickerOpen)}
                className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
              >
                <span>{topic.title}</span>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>

              {isTopicPickerOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Switch Topic
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {allTopics.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTopic(t.id);
                          setIsTopicPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                          t.id === topic.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="text-[10px] text-slate-400">{t.masteryLevel}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-2xl line-clamp-1">
              {topic.description}
            </p>
          </div>

          {/* Mastery Progress Badge */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Topic Mastery
              </div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {topic.masteryLevel}%
              </div>
            </div>
            <div className="w-24">
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${topic.masteryLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentTab('explain')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'explain'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Explain</span>
          </button>

          <button
            onClick={() => setCurrentTab('flashcards')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Flashcards</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentTab === 'flashcards'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {topicCardsCount}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('quiz')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3. Quiz</span>
          </button>

          <button
            onClick={() => setCurrentTab('chat')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>4. Ask Questions & Tutor</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {currentTab === 'explain' && (
        <ExplainTab
          topic={topic}
          subject={subject}
          allTopics={allTopics}
          onUpdateTopicExplanation={onUpdateTopicExplanation}
          onSaveQuestionAnswer={onSaveTopicQuestionAnswer}
          onDeleteQuestionAnswer={onDeleteTopicQuestionAnswer}
          onCreateTopic={onCreateTopic}
          onSelectTopic={onSelectTopic}
          onSwitchToChat={() => setCurrentTab('chat')}
        />
      )}

      {currentTab === 'flashcards' && (
        <FlashcardsTab
          topic={topic}
          subject={subject}
          flashcards={flashcards}
          onAddFlashcards={onAddFlashcards}
          onUpdateFlashcard={onUpdateFlashcard}
          onDeleteFlashcard={onDeleteFlashcard}
          onTopicMasteryChange={onTopicMasteryChange}
        />
      )}

      {currentTab === 'quiz' && (
        <QuizTab
          topic={topic}
          subject={subject}
          onSaveQuizAttempt={onSaveQuizAttempt}
          onTopicMasteryChange={onTopicMasteryChange}
        />
      )}

      {currentTab === 'chat' && (
        <ChatTab
          topic={topic}
          subject={subject}
          allTopics={allTopics}
          onSaveQuestionAnswer={onSaveTopicQuestionAnswer}
          onCreateTopic={onCreateTopic}
          onSelectTopic={onSelectTopic}
        />
      )}
    </div>
  );
};
