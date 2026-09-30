import { Subject, Topic, Flashcard, QuizAttempt, StudySession, UserSettings } from '../types';
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from './supabase';

const STORAGE_KEYS = {
  SUBJECTS: 'studybuddy_subjects_v2',
  TOPICS: 'studybuddy_topics_v2',
  FLASHCARDS: 'studybuddy_flashcards_v2',
  QUIZ_ATTEMPTS: 'studybuddy_quiz_attempts_v2',
  STUDY_SESSIONS: 'studybuddy_study_sessions_v2',
  SETTINGS: 'studybuddy_settings_v2',
};

// Pure empty initial data for all fresh accounts/logins
const INITIAL_SUBJECTS: Subject[] = [];
const INITIAL_TOPICS: Topic[] = [];
const INITIAL_FLASHCARDS: Flashcard[] = [];
const INITIAL_SESSIONS: StudySession[] = [];

// Clean up any legacy v1 demo data from prior runs
function cleanLegacyDemoData() {
  try {
    const legacyKeys = [
      'studybuddy_subjects_v1',
      'studybuddy_topics_v1',
      'studybuddy_flashcards_v1',
      'studybuddy_quiz_attempts_v1',
      'studybuddy_study_sessions_v1',
    ];
    for (const k of legacyKeys) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}
cleanLegacyDemoData();

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const today = getTodayDateString();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.quotaResetDate !== today) {
        parsed.dailyAiQuotaUsed = 0;
        parsed.quotaResetDate = today;
      }
      if (!parsed.dailyGoalMinutes) {
        parsed.dailyGoalMinutes = 60;
      }
      if (!parsed.dailyStudyTimeOfDay) {
        parsed.dailyStudyTimeOfDay = '18:00';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }

  const defaultSettings: UserSettings = {
    apiKey: '',
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
    darkMode: true,
    dailyAiQuotaLimit: 999999,
    dailyAiQuotaUsed: 0,
    quotaResetDate: getTodayDateString(),
    pomodoroFocusMins: 25,
    pomodoroBreakMins: 5,
    dailyGoalMinutes: 60,
    dailyStudyTimeOfDay: '18:00',
  };
  saveSettings(defaultSettings);
  return defaultSettings;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function incrementAiQuota(): boolean {
  const settings = loadSettings();
  settings.dailyAiQuotaUsed = (settings.dailyAiQuotaUsed || 0) + 1;
  saveSettings(settings);
  return true;
}

export function loadSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load subjects:', e);
  }
  return [];
}

export function saveSubjects(subjects: Subject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('Failed to save subjects:', e);
  }
}

export function loadTopics(): Topic[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPICS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load topics:', e);
  }
  return [];
}

export function saveTopics(topics: Topic[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  } catch (e) {
    console.error('Failed to save topics:', e);
  }
}

export function loadFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load flashcards:', e);
  }
  return [];
}

export function saveFlashcards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save flashcards:', e);
  }
}

export function loadQuizAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load quiz attempts:', e);
  }
  return [];
}

export function saveQuizAttempt(attempt: QuizAttempt): void {
  try {
    const attempts = loadQuizAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(attempts.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save quiz attempt:', e);
  }
}

export function loadStudySessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load study sessions:', e);
  }
  return [];
}

export function saveStudySessions(sessions: StudySession[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save study sessions:', e);
  }
}

export function recordStudySession(session: StudySession): void {
  const sessions = loadStudySessions();
  sessions.unshift(session);
  saveStudySessions(sessions);
}

export function calculateStudyStreak(sessions: StudySession[]): number {
  if (!sessions || sessions.length === 0) return 0;
  
  const dates = Array.from(new Set(sessions.map((s) => s.date))).sort().reverse();
  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (!dates.includes(today) && !dates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let checkDate = dates.includes(today) ? new Date() : new Date(Date.now() - 86400000);

  for (let i = 0; i < 365; i++) {
    const dStr = checkDate.toISOString().slice(0, 10);
    if (dates.includes(dStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function clearAllUserData(): void {
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.TOPICS);
  localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
  localStorage.removeItem(STORAGE_KEYS.STUDY_SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
}

export const resetToSampleData = clearAllUserData;
