import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Topic } from '../types';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export const MODE_CONFIG: Record<TimerMode, { label: string; defaultMinutes: number; color: string }> = {
  focus: { label: 'Deep Focus', defaultMinutes: 25, color: '#6366f1' },
  shortBreak: { label: 'Short Break', defaultMinutes: 5, color: '#10b981' },
  longBreak: { label: 'Long Break', defaultMinutes: 15, color: '#06b6d4' },
};

export const formatTime = (secs: number) => {
  const mins = Math.floor(secs / 60);
  const remainder = secs % 60;
  return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
};

export interface PomodoroTimerProps {
  topics: Topic[];
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  selectedTopicId: string;
  sessionsCompletedToday: number;
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitchMode: (mode: TimerMode) => void;
  onSelectTopic: (topicId: string) => void;
  onOpenTopicInStudio?: (topicId: string) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  topics,
  mode,
  timeLeft,
  isActive,
  selectedTopicId,
  sessionsCompletedToday,
  onToggle,
  onReset,
  onSkip,
  onSwitchMode,
  onSelectTopic,
  onOpenTopicInStudio,
}) => {
  const initialTime = MODE_CONFIG[mode].defaultMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((initialTime - timeLeft) / initialTime) * 100));

  // SVG Circle parameters
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentTopic = topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800">
          <Timer className="w-3.5 h-3.5" />
          <span>Continuous Background Pomodoro Clock</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Pomodoro Study Clock
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          25 minutes of deep undistracted study followed by 5 minutes of rest. The timer continues running uninterrupted even when navigating through subjects, flashcards, or quizzes.
        </p>
      </div>

      {/* Main Timer Container */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/40 flex flex-col items-center">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-8">
          <button
            onClick={() => onSwitchMode('focus')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Deep Focus (25m)
          </button>
          <button
            onClick={() => onSwitchMode('shortBreak')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => onSwitchMode('longBreak')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'longBreak'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Circular SVG Progress Display */}
        <div className="relative w-72 h-72 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke={MODE_CONFIG[mode].color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-linear"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
              {MODE_CONFIG[mode].label}
            </span>
          </div>
        </div>

        {/* Topic Tag Assignment */}
        {mode === 'focus' && topics.length > 0 && (
          <div className="mt-6 mb-8 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Topic Focus:</span>
              <select
                value={selectedTopicId}
                onChange={(e) => onSelectTopic(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {currentTopic && onOpenTopicInStudio && (
              <button
                type="button"
                onClick={() => onOpenTopicInStudio(currentTopic.id)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                title="Study this topic in Studio while Pomodoro ticks in background"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onReset}
            title="Reset timer"
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onToggle}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={onSkip}
            title="Skip to next interval"
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Completed Intervals Count */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Completed Focus Intervals Today
            </h4>
            <p className="text-[11px] text-slate-500">
              Each completed block automatically records a study session and keeps your study streak active!
            </p>
          </div>
        </div>
        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
          {sessionsCompletedToday}
        </div>
      </div>
    </div>
  );
};
