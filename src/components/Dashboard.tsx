import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Brain,
  Timer,
  Award,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  MessageSquare,
  Play,
  TrendingUp,
  Target,
  Edit3,
  Check,
  Trophy,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, Topic, Flashcard, QuizAttempt, StudySession } from '../types';
import { calculateBadges } from '../services/badges';
import { BadgesShowcase } from './BadgesShowcase';
import { getTodayDateString } from '../services/storage';

function formatGoalDuration(mins: number): string {
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  if (hrs > 0 && m > 0) return `${hrs}h ${m}m (${mins} min)`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} (${mins} min)`;
  return `${mins} minutes`;
}

function formatTime12h(time24?: string): string {
  if (!time24) return '6:00 PM';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return '6:00 PM';
  const period = h >= 12 ? 'PM' : 'AM';
  const adjustedH = h % 12 || 12;
  return `${adjustedH}:${m.toString().padStart(2, '0')} ${period}`;
}

interface DashboardProps {
  subjects: Subject[];
  topics: Topic[];
  flashcards: Flashcard[];
  quizAttempts: QuizAttempt[];
  studySessions: StudySession[];
  streakDays: number;
  dailyGoalMinutes: number;
  dailyStudyTimeOfDay?: string;
  onUpdateDailyGoal: (minutes: number, scheduledTime?: string) => void;
  onSelectTopic: (topicId: string, initialTab?: 'explain' | 'flashcards' | 'quiz' | 'chat') => void;
  onNavigateToSubjects: () => void;
  onStartPomodoro: () => void;
  onQuickExplain: (topicTitle: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subjects,
  topics,
  flashcards,
  quizAttempts,
  studySessions,
  streakDays,
  dailyGoalMinutes = 60,
  dailyStudyTimeOfDay = '18:00',
  onUpdateDailyGoal,
  onSelectTopic,
  onNavigateToSubjects,
  onStartPomodoro,
  onQuickExplain,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalMinutes, setTempGoalMinutes] = useState(dailyGoalMinutes);
  const [tempStudyTimeOfDay, setTempStudyTimeOfDay] = useState(dailyStudyTimeOfDay);

  // Today's focus time
  const today = getTodayDateString();
  const todaySessions = studySessions.filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const goalProgressPercent = Math.min(100, Math.round((todayMinutes / (dailyGoalMinutes || 1)) * 100));
  const isGoalAchieved = todayMinutes >= dailyGoalMinutes;

  // Stats calculation
  const totalTopics = topics.length;
  const masteredTopics = topics.filter((t) => t.masteryLevel >= 80).length;
  const avgMastery = totalTopics > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.masteryLevel, 0) / totalTopics)
    : 0;

  const totalCardsReviewed = flashcards.reduce((acc, c) => acc + (c.reviewCount || 0), 0);
  
  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(
        quizAttempts.reduce((acc, q) => acc + (q.score / (q.totalQuestions || 1)) * 100, 0) /
          quizAttempts.length
      )
    : 85;

  const totalFocusMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Badges
  const badges = calculateBadges(
    studySessions,
    streakDays,
    topics,
    flashcards,
    quizAttempts,
    dailyGoalMinutes
  );
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  // Most recent topic
  const sortedTopics = [...topics].sort((a, b) => b.lastStudiedAt - a.lastStudiedAt);
  const recentTopic = sortedTopics[0];
  const recentSubject = subjects.find((s) => s.id === recentTopic?.subjectId);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onQuickExplain(quickInput.trim());
      setQuickInput('');
    }
  };

  const handleSaveGoal = (mins: number, scheduledTime?: string) => {
    const timeToSave = scheduledTime !== undefined ? scheduledTime : tempStudyTimeOfDay;
    onUpdateDailyGoal(mins, timeToSave);
    setIsEditingGoal(false);
    if (todayMinutes >= mins) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Circular SVG parameters for Goal Progress Ring
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (goalProgressPercent / 100) * ringCircumference;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Powered Active Recall Studio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {totalTopics > 0 ? 'Welcome back to Study Buddy' : 'Welcome to Study Buddy'}
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mb-6 leading-relaxed">
            Turn complex topics into crystal-clear explanations, 3D active recall flashcards, and diagnostic AI quizzes in seconds.
          </p>

          {/* Quick AI Search/Generate Box */}
          <form onSubmit={handleQuickSubmit} className="flex gap-2 max-w-lg">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="What do you want to master today? (e.g. Quantum Computing)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>Explain</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none hidden md:block" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Stats Row: Highlights Daily Goal Ring & Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Daily Study Goal with Circular Progress Ring (Spans 2 columns on medium+ screens) */}
        <div className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/60 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Daily Study Goal
              </span>
            </div>

            <button
              onClick={() => {
                setTempGoalMinutes(dailyGoalMinutes);
                setTempStudyTimeOfDay(dailyStudyTimeOfDay);
                setIsEditingGoal(!isEditingGoal);
              }}
              title="Select Goal Duration & Study Time"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isEditingGoal ? 'Close' : 'Select Time'}</span>
            </button>
          </div>

          {/* Goal Editor Panel */}
          {isEditingGoal ? (
            <div className="p-4 my-2 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3.5 animate-fade-in">
              {/* Duration Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Target className="w-3 h-3 text-indigo-500" />
                    <span>Target Study Duration</span>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatGoalDuration(tempGoalMinutes)}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTempGoalMinutes(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        tempGoalMinutes === mins
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>

                {/* Slider & Custom number */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="15"
                    max="360"
                    step="15"
                    value={tempGoalMinutes}
                    onChange={(e) => setTempGoalMinutes(parseInt(e.target.value, 10))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={tempGoalMinutes}
                      onChange={(e) => setTempGoalMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                      className="w-16 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-mono text-center text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-400">mins</span>
                  </div>
                </div>
              </div>

              {/* Scheduled Study Time of Day */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Daily Study Time (Schedule)</span>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatTime12h(tempStudyTimeOfDay)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Morning', time: '08:00' },
                    { label: 'Afternoon', time: '14:00' },
                    { label: 'Evening', time: '18:30' },
                    { label: 'Night', time: '21:00' },
                  ].map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setTempStudyTimeOfDay(slot.time)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        tempStudyTimeOfDay === slot.time
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {slot.label} ({slot.time})
                    </button>
                  ))}

                  <input
                    type="time"
                    value={tempStudyTimeOfDay}
                    onChange={(e) => setTempStudyTimeOfDay(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-mono text-slate-900 dark:text-white ml-auto"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveGoal(tempGoalMinutes, tempStudyTimeOfDay)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Daily Time & Goal</span>
                </button>
              </div>
            </div>
          ) : (
            /* Progress Ring & Stats Display */
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {todayMinutes} <span className="text-base font-normal text-slate-500">/ {dailyGoalMinutes} min</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Daily at {formatTime12h(dailyStudyTimeOfDay)}</span>
                  </span>
                  <p className="text-xs text-slate-500">
                    {isGoalAchieved ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Goal Met Today! 🌟</span>
                      </span>
                    ) : (
                      <span>{Math.max(0, dailyGoalMinutes - todayMinutes)}m remaining</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    stroke={isGoalAchieved ? '#10b981' : '#6366f1'}
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {goalProgressPercent}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} recorded today</span>
            <button
              onClick={onStartPomodoro}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Focus Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {streakDays} <span className="text-sm font-normal text-slate-500">days</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Consecutive</span>
            </div>
          </div>
        </div>

        {/* Mastery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mastery</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {avgMastery}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {masteredTopics}/{totalTopics} mastered
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviews</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalCardsReviewed}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {flashcards.length} in deck
            </div>
          </div>
        </div>

        {/* Honors Badges Count */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Badges</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {unlockedBadgesCount} <span className="text-sm font-normal text-slate-500">/ {badges.length}</span>
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              {Math.round((unlockedBadgesCount / badges.length) * 100)}% unlocked
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Continue Studying & Recent Topics (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Studying Card */}
          {recentTopic ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
                  Jump Back In
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {recentSubject?.name || 'Subject'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {recentTopic.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 line-clamp-2">
                {recentTopic.description}
              </p>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Topic Mastery</span>
                  <span>{recentTopic.masteryLevel}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${recentTopic.masteryLevel}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => onSelectTopic(recentTopic.id, 'explain')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={() => onSelectTopic(recentTopic.id, 'flashcards')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={() => onSelectTopic(recentTopic.id, 'quiz')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Take Quiz</span>
                </button>
                <button
                  onClick={() => onSelectTopic(recentTopic.id, 'chat')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Tutor</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-indigo-200 dark:border-indigo-900/60 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ready to Start Learning?
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Create your first subject and topic to get personalized AI notes, active recall flashcards, and diagnostic quizzes.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToSubjects}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Add First Subject / Topic</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Topics List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Your Study Topics</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {topics.length}
                </span>
              </h3>
              {topics.length > 0 && (
                <button
                  onClick={onNavigateToSubjects}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {topics.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>No study topics added yet.</p>
                <button
                  onClick={onNavigateToSubjects}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Create your first topic</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.slice(0, 4).map((topic) => {
                const sub = subjects.find((s) => s.id === topic.subjectId);
                return (
                  <div
                    key={topic.id}
                    onClick={() => onSelectTopic(topic.id)}
                    className="group p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          {sub?.name || 'General'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[11px] text-slate-500">
                          {topic.masteryLevel}% Mastery
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                        {topic.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 hidden sm:block">
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${topic.masteryLevel}%` }}
                          />
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        {/* Right Column: Focus & Tips (1 col) */}
        <div className="space-y-6">
          {/* Pomodoro Quick Launch */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Focus Mode (Pomodoro)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Boost retention with 25-minute intervals
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Research confirms that short, distraction-free study blocks followed by active recall drastically improve long-term memory consolidation.
            </p>

            <button
              onClick={onStartPomodoro}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start 25-Min Focus</span>
            </button>
          </div>

          {/* Evidence-Based Learning Tip */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Study Tip of the Day</span>
            </div>

            <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">
              The Feynman Technique
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              To test if you truly understand a concept, try explaining it in the simplest possible terms as if teaching a sixth-grader. Notice where you reach for jargon—that is where your understanding has gaps.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              💡 <strong>Pro Tip:</strong> Use the <strong>ELI5 / Simple</strong> mode inside the Topic Studio Explain tab to see Feynman-style explanations instantly!
            </div>
          </div>
        </div>
      </div>

      {/* Badges System Showcase Section */}
      <BadgesShowcase badges={badges} />
    </div>
  );
};
