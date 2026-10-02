import React from 'react';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  MessageSquareCode,
  Timer,
  Settings,
  Flame,
  User,
  Sun,
  Moon,
  Zap,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { UserSettings } from '../types';
import { formatTime } from './PomodoroTimer';

export type ActiveTab = 'dashboard' | 'subjects' | 'studio' | 'assistant' | 'pomodoro';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeTopicTitle?: string;
  streakDays: number;
  settings: UserSettings;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenEmailModal?: () => void;
  onToggleTheme: () => void;
  userEmail?: string | null;
  pomodoroState?: {
    isActive: boolean;
    timeLeft: number;
    mode: 'focus' | 'shortBreak' | 'longBreak';
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeTopicTitle,
  streakDays,
  settings,
  onOpenSettings,
  onOpenAuth,
  onOpenEmailModal,
  onToggleTheme,
  userEmail,
  pomodoroState,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  Study Buddy
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Master any topic faster
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'subjects'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Subjects & Topics</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 relative ${
                activeTab === 'studio'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Topic Studio</span>
              {activeTopicTitle && (
                <span className="hidden xl:inline-block max-w-[120px] truncate text-[11px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeTopicTitle}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'assistant'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquareCode className="w-4 h-4" />
              <span>AI Tutor</span>
            </button>

            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'pomodoro'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Pomodoro</span>
            </button>
          </nav>

          {/* Right Utility Badges & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Streak */}
            <div
              title={`${streakDays} days consecutive study streak!`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-semibold"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streakDays}d</span>
            </div>

            {/* Live Pomodoro Timer Widget (When Active on other tabs) */}
            {pomodoroState && pomodoroState.isActive && activeTab !== 'pomodoro' && (
              <button
                type="button"
                onClick={() => setActiveTab('pomodoro')}
                title="Pomodoro timer is running! Click to view full clock."
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all animate-pulse shadow-2xs"
              >
                <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono">{formatTime(pomodoroState.timeLeft)}</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cross-Device Email Cloud Sync */}
            <button
              onClick={onOpenEmailModal || onOpenAuth}
              title={
                userEmail
                  ? `Synced to ${userEmail} across all devices. Click to switch email or check status.`
                  : 'Enter your email to sync study progression across devices'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                userEmail
                  ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors animate-pulse'
              }`}
            >
              {userEmail ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden md:inline max-w-[110px] truncate">
                    {userEmail.split('@')[0]}
                  </span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 hidden sm:inline" />
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden md:inline">Sync Email</span>
                </>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 py-2 justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'subjects' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            Subjects
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'studio' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
            Studio
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'assistant' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`}
          >
            <MessageSquareCode className="w-4 h-4 mb-0.5" />
            Tutor
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'pomodoro' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Timer className="w-4 h-4 mb-0.5" />
            Timer
          </button>
        </div>
      </div>
    </header>
  );
};
