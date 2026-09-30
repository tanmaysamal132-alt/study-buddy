import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Plus,
  ArrowRight,
  BookmarkPlus,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Topic, Subject } from '../../types';
import { AIService } from '../../services/ai';
import { SpeechService } from '../../services/audio';
import { NoteRenderer } from './NoteRenderer';

interface SuggestedTopic {
  title: string;
  description: string;
}

function parseAnswerForTopic(content: string): {
  cleanAnswer: string;
  suggestedTopic: SuggestedTopic | null;
} {
  const match = content.match(/\[SUGGESTED_NEW_TOPIC:\s*([^|]+)\|\s*([^\]]+)\]/i);
  if (match) {
    return {
      cleanAnswer: content.replace(match[0], '').trim(),
      suggestedTopic: {
        title: match[1].trim(),
        description: match[2].trim(),
      },
    };
  }
  return {
    cleanAnswer: content,
    suggestedTopic: null,
  };
}

interface ExplainTabProps {
  topic: Topic;
  subject?: Subject;
  allTopics?: Topic[];
  onUpdateTopicExplanation: (level: string, text: string) => void;
  onCreateTopic?: (topData: Omit<Topic, 'id' | 'lastStudiedAt' | 'masteryLevel'>, autoSelect?: boolean) => void;
  onSelectTopic?: (topicId: string) => void;
  onSwitchToChat?: () => void;
}

export const ExplainTab: React.FC<ExplainTabProps> = ({
  topic,
  subject,
  allTopics = [],
  onUpdateTopicExplanation,
  onCreateTopic,
  onSelectTopic,
  onSwitchToChat,
}) => {
  const [level, setLevel] = useState<'simple' | 'standard' | 'deep' | 'analogies'>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Q&A and New Topic Explorer State
  const [qaInput, setQaInput] = useState('');
  const [isQaLoading, setIsQaLoading] = useState(false);
  const [qaItems, setQaItems] = useState<
    Array<{
      id: string;
      question: string;
      answer: string;
      suggestedTopic: SuggestedTopic | null;
    }>
  >([]);
  const [addedTopics, setAddedTopics] = useState<Record<string, string>>({});

  // Cached or generated text
  const currentExplanation = topic.explanationCache?.[level] || '';

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    SpeechService.stop();
    setIsSpeaking(false);

    try {
      const result = await AIService.generateExplanation({
        topic: topic.title,
        subject: subject?.name,
        level,
      });
      onUpdateTopicExplanation(level, result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate explanation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentExplanation) return;
    navigator.clipboard.writeText(currentExplanation);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      SpeechService.stop();
      setIsSpeaking(false);
    } else {
      if (!currentExplanation) return;
      setIsSpeaking(true);
      SpeechService.speak(currentExplanation, () => {
        setIsSpeaking(false);
      });
    }
  };

  // Add a topic to the main topics list
  const handleAddTopicToMain = (newTitle: string, newDesc?: string) => {
    if (!onCreateTopic) return;
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    // Check if topic with same title already exists
    const existing = allTopics.find(
      (t) => t.title.toLowerCase() === cleanTitle.toLowerCase()
    );
    if (existing) {
      setAddedTopics((prev) => ({ ...prev, [cleanTitle]: existing.id }));
      return;
    }

    onCreateTopic(
      {
        subjectId: topic.subjectId,
        title: cleanTitle,
        description: newDesc || `Study notes and active recall deck for ${cleanTitle}.`,
      },
      false // Keep the student in the current topic studio so they can keep reading
    );

    setAddedTopics((prev) => ({ ...prev, [cleanTitle]: 'added' }));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Ask a question in the Q&A section
  const handleAskQuestion = async (customQuestion?: string) => {
    const q = customQuestion || qaInput;
    if (!q.trim() || isQaLoading) return;

    const questionText = q.trim();
    setQaInput('');
    setIsQaLoading(true);

    try {
      const response = await AIService.sendChatMessage({
        messages: [
          {
            role: 'user',
            content: `Regarding the topic "${topic.title}" (${subject?.name || 'General'}): ${questionText}. Please answer clearly, and if this asks about or introduces a new topic to study, include [SUGGESTED_NEW_TOPIC: Title | Description] at the end.`,
          },
        ],
        topic: topic.title,
        subject: subject?.name,
      });

      const { cleanAnswer, suggestedTopic } = parseAnswerForTopic(response);

      setQaItems((prev) => [
        {
          id: `qa_${Date.now()}`,
          question: questionText,
          answer: cleanAnswer,
          suggestedTopic,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setQaItems((prev) => [
        {
          id: `qa_err_${Date.now()}`,
          question: questionText,
          answer: `⚠️ Error: ${err.message || 'Could not answer at this moment.'}`,
          suggestedTopic: null,
        },
        ...prev,
      ]);
    } finally {
      setIsQaLoading(false);
    }
  };

  const sampleQuestionPrompts = [
    'What related topic should I study next?',
    'What is the most common misconception here?',
    'How does this apply in a real-world production system?',
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Depth Level Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Depth:
          </span>
          {(
            [
              { id: 'simple', label: 'ELI5 (Simple)' },
              { id: 'standard', label: 'Standard' },
              { id: 'deep', label: 'Deep Dive' },
              { id: 'analogies', label: 'Analogies' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setLevel(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                level === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {currentExplanation && (
            <>
              <button
                onClick={handleToggleSpeech}
                title={isSpeaking ? 'Stop speaking' : 'Read explanation aloud'}
                className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors ${
                  isSpeaking
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-indigo-600 animate-pulse" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={handleCopy}
                title="Copy markdown text"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentExplanation ? 'Regenerate Notes' : 'Generate Notes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-5/6" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-4/6" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full my-6" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
        </div>
      ) : currentExplanation ? (
        <NoteRenderer
          content={currentExplanation}
          topicTitle={topic.title}
          subjectName={subject?.name}
          depthLevel={level}
        />
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No explanation generated yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
            Click &ldquo;Generate Notes&rdquo; to have Gemini produce structured study notes with concept diagrams, code blocks, and visual models.
          </p>
          <button
            onClick={handleGenerate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate {level.toUpperCase()} Notes</span>
          </button>
        </div>
      )}

      {/* Dedicated Q&A & New Topic Discovery Section */}
      <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-lg shadow-indigo-500/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ask Questions & Explore Related Topics</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Topic Q&A
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Ask about {topic.title} or any brand new topic to automatically add it to your main study list!
              </p>
            </div>
          </div>

          {onSwitchToChat && (
            <button
              onClick={onSwitchToChat}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Full AI Tutor Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Question Starters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Quick:</span>
          </span>
          {sampleQuestionPrompts.map((qText, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isQaLoading}
              onClick={() => handleAskQuestion(qText)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[11px] border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            >
              {qText}
            </button>
          ))}
        </div>

        {/* Question Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={qaInput}
            onChange={(e) => setQaInput(e.target.value)}
            disabled={isQaLoading}
            placeholder={`Ask any question about ${topic.title} or ask to learn a new topic...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isQaLoading || !qaInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            {isQaLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {/* Loading Indicator */}
        {isQaLoading && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-500 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Consulting AI Tutor and checking for related study topics...</span>
          </div>
        )}

        {/* Q&A Responses List */}
        {qaItems.length > 0 && (
          <div className="space-y-4 pt-2">
            {qaItems.map((item) => {
              const hasSuggested = item.suggestedTopic;
              const isAdded = hasSuggested && !!addedTopics[hasSuggested.title];

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fade-in"
                >
                  {/* User Question */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                        Q
                      </span>
                      <span>{item.question}</span>
                    </div>

                    {onCreateTopic && (
                      <button
                        type="button"
                        onClick={() => handleAddTopicToMain(item.question)}
                        title="Add this question as a new main topic"
                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add as Topic</span>
                      </button>
                    )}
                  </div>

                  {/* AI Answer */}
                  <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 pl-6 border-l-2 border-indigo-200 dark:border-indigo-800 whitespace-pre-wrap">
                    {item.answer}
                  </div>

                  {/* Suggested New Topic Card */}
                  {hasSuggested && (
                    <div className="ml-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Discovered New Topic: &ldquo;{hasSuggested.title}&rdquo;</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Course: {subject?.name || 'Main Course'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {hasSuggested.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        {isAdded ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Main Topics!</span>
                            </span>
                            {onSelectTopic && (
                              <button
                                type="button"
                                onClick={() => {
                                  const found = allTopics.find(
                                    (t) =>
                                      t.title.toLowerCase() ===
                                      hasSuggested.title.toLowerCase()
                                  );
                                  if (found) onSelectTopic(found.id);
                                }}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 ml-2"
                              >
                                <span>Open Topic Studio</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddTopicToMain(
                                hasSuggested.title,
                                hasSuggested.description
                              )
                            }
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add &ldquo;{hasSuggested.title}&rdquo; to Main Topics</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
