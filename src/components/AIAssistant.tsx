import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Calendar,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Check,
  Copy,
  RotateCw,
} from 'lucide-react';
import { AIService } from '../services/ai';
import { Topic } from '../types';

interface AIAssistantProps {
  topics: Topic[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ topics }) => {
  const [activeMode, setActiveMode] = useState<'chat' | 'plan'>('chat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content: "Hello! I'm your global Study Buddy AI Assistant. Ask me to break down any complex academic concept, critique an essay draft, devise an exam study schedule, or explain any STEM/humanities problem!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Study Plan Generator State
  const [goal, setGoal] = useState('Ace my upcoming exams with active recall');
  const [availableHours, setAvailableHours] = useState('6');
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || isLoading) return;

    const newMsgs = [...messages, { role: 'user' as const, content: text.trim() }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await AIService.sendChatMessage({
        messages: newMsgs,
      });
      setMessages([...newMsgs, { role: 'model', content: reply }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        { role: 'model', content: `⚠️ Error: ${err.message || 'Failed to connect to AI.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsPlanLoading(true);
    try {
      const plan = await AIService.generateStudyPlan({
        goal,
        availableHours,
        topics: topics.map((t) => t.title),
      });
      setGeneratedPlan(plan);
    } catch (err: any) {
      setGeneratedPlan(`Error generating study plan: ${err.message}`);
    } finally {
      setIsPlanLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Gemini 3.6 Flash Study Assistant</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Academic Coach
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            General tutoring, study routine planning, and multi-disciplinary conceptual explanations.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeMode === 'chat'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Tutor Chat</span>
          </button>
          <button
            onClick={() => setActiveMode('plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeMode === 'plan'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study Plan Maker</span>
          </button>
        </div>
      </div>

      {activeMode === 'chat' ? (
        /* Chat Mode */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      isUser
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Reasoning your answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none bg-slate-50/40 dark:bg-slate-800/20">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {[
              'How to structure a 2-week exam revision timetable?',
              'Explain Bayes theorem intuitively with an example',
              'What are the 3 most effective spaced repetition intervals?',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
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
                placeholder="Ask any question, request a concept comparison, or paste homework..."
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
      ) : (
        /* Plan Maker Mode */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Custom Study Schedule Generator
            </h3>
            <p className="text-xs text-slate-500">
              Provide your study target and weekly available hours to generate a high-retention Pomodoro study roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Goal / Exam Name
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Master Data Structures and Cellular Respiration for Midterms"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hours Available Per Week
              </label>
              <select
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="3">3 hours / week (Light review)</option>
                <option value="6">6 hours / week (Standard routine)</option>
                <option value="12">12 hours / week (Intensive prep)</option>
                <option value="20">20+ hours / week (Exam sprint)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isPlanLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            {isPlanLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Generating Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Optimized Study Plan</span>
              </>
            )}
          </button>

          {generatedPlan && (
            <div className="mt-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>Your Evidence-Based Study Plan</span>
                </h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPlan);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy Plan'}</span>
                </button>
              </div>

              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {generatedPlan}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
