import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCw,
  Lightbulb,
  Copy,
  Check,
  Plus,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatMessage, Topic, Subject } from '../../types';
import { AIService } from '../../services/ai';

interface ChatTabProps {
  topic: Topic;
  subject?: Subject;
  allTopics?: Topic[];
  onCreateTopic?: (topData: Omit<Topic, 'id' | 'lastStudiedAt' | 'masteryLevel'>, autoSelect?: boolean) => void;
  onSelectTopic?: (topicId: string) => void;
  onSaveQuestionAnswer?: (topicId: string, qa: { id: string; question: string; answer: string; timestamp: number }) => void;
}

interface SuggestedTopic {
  title: string;
  description: string;
}

function parseMessageWithSuggestedTopic(content: string): {
  cleanContent: string;
  suggestedTopic: SuggestedTopic | null;
} {
  const match = content.match(/\[SUGGESTED_NEW_TOPIC:\s*([^|]+)\|\s*([^\]]+)\]/i);
  if (match) {
    return {
      cleanContent: content.replace(match[0], '').trim(),
      suggestedTopic: {
        title: match[1].trim(),
        description: match[2].trim(),
      },
    };
  }
  return {
    cleanContent: content,
    suggestedTopic: null,
  };
}

export const ChatTab: React.FC<ChatTabProps> = ({
  topic,
  subject,
  allTopics = [],
  onCreateTopic,
  onSelectTopic,
  onSaveQuestionAnswer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialList: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'model',
        content: `Hello! I'm your Socratic AI Tutor for **${topic.title}**. What would you like to explore or clarify today? You can ask me to break down difficult steps, quiz you interactively, or ask questions that will be saved to your account!`,
        timestamp: Date.now(),
      },
    ];

    if (topic.savedQuestions && topic.savedQuestions.length > 0) {
      // Re-hydrate previously asked questions and answers
      topic.savedQuestions.slice().reverse().forEach((sq) => {
        initialList.push({
          id: `saved_q_${sq.id}`,
          role: 'user',
          content: sq.question,
          timestamp: sq.timestamp,
        });
        initialList.push({
          id: `saved_a_${sq.id}`,
          role: 'model',
          content: sq.answer,
          timestamp: sq.timestamp + 500,
        });
      });
    }

    return initialList;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedTopics, setAddedTopics] = useState<Record<string, string>>({}); // title -> newly created topicId or 'added'
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What related topic should I study next?',
    'Explain the trickiest mechanism simply',
    'Give me a memorable real-world analogy',
    'Test my understanding with a challenging scenario',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAddTopic = (newTitle: string, newDesc?: string) => {
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
      false // Do not immediately navigate away so user can keep asking questions
    );

    setAddedTopics((prev) => ({ ...prev, [cleanTitle]: 'added' }));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await AIService.sendChatMessage({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        topic: topic.title,
        subject: subject?.name,
      });

      const modelMessage: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);

      if (onSaveQuestionAnswer) {
        onSaveQuestionAnswer(topic.id, {
          id: `qa_${Date.now()}`,
          question: text.trim(),
          answer: reply,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `⚠️ Error: ${err.message || 'Could not reach AI tutor. Please check settings or try again.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[650px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Socratic AI Coach & Question Studio</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </h4>
            <p className="text-[10px] text-slate-500 truncate max-w-xs">
              Context: {topic.title} ({subject?.name || 'General'})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `reset_${Date.now()}`,
                role: 'model',
                content: `Chat cleared. What aspect of **${topic.title}** or new topic shall we tackle next?`,
                timestamp: Date.now(),
              },
            ]);
          }}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const { cleanContent, suggestedTopic } = parseMessageWithSuggestedTopic(msg.content);
          const isAlreadyAdded = suggestedTopic && !!addedTopics[suggestedTopic.title];

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{cleanContent}</div>

                {/* If AI Suggested a New Topic to Add to Main Topics */}
                {suggestedTopic && (
                  <div className="mt-3 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Discovered New Topic: {suggestedTopic.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Subject: {subject?.name || 'Main Course'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {suggestedTopic.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {isAlreadyAdded ? (
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
                                    suggestedTopic.title.toLowerCase()
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
                            handleAddTopic(
                              suggestedTopic.title,
                              suggestedTopic.description
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add &ldquo;{suggestedTopic.title}&rdquo; to Main Topics</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Actions */}
                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-black/5 dark:border-white/5">
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, cleanContent)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Manual Add as Topic Button on question or answer */}
                  {onCreateTopic && isUser && (
                    <button
                      type="button"
                      onClick={() => handleAddTopic(cleanContent)}
                      title="Save this question as a new main topic"
                      className="text-[10px] text-indigo-200 hover:text-white flex items-center gap-1 transition-colors ml-auto"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>Add as Topic</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Thinking pedagogical response & checking for new topics...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none bg-slate-50/30 dark:bg-slate-900/40">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[11px] whitespace-nowrap transition-colors border border-slate-200/60 dark:border-slate-700/60 shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask about ${topic.title} or any new topic to add...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
