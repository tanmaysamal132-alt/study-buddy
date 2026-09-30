export interface Subject {
  id: string;
  name: string;
  description: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'blue';
  icon: string;
  createdAt: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  masteryLevel: number; // 0 to 100
  lastStudiedAt: number;
  explanationCache?: Record<string, string>; // level -> explanation
}

export interface Flashcard {
  id: string;
  topicId: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'new' | 'learning' | 'mastered';
  reviewCount: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  topicId: string;
  score: number;
  totalQuestions: number;
  date: string;
  questions: QuizQuestion[];
  userAnswers: { questionIndex: number; selectedIndex: number; isCorrect: boolean }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface StudySession {
  id: string;
  topicId?: string;
  topicTitle?: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface UserSettings {
  apiKey?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  darkMode: boolean;
  dailyAiQuotaLimit: number;
  dailyAiQuotaUsed: number;
  quotaResetDate: string;
  pomodoroFocusMins: number;
  pomodoroBreakMins: number;
  dailyGoalMinutes: number; // Daily study target in minutes
  dailyStudyTimeOfDay?: string; // Scheduled daily study time (HH:MM)
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'focus' | 'streak' | 'mastery' | 'quiz' | 'cards';
  icon: string;
  color: string;
  unlocked: boolean;
  progress: number; // 0 to 100
  progressText: string;
  requirement: string;
  unlockedAt?: number;
}
