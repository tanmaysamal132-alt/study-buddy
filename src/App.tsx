import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Timer } from 'lucide-react';
import { Subject, Topic, Flashcard, QuizAttempt, StudySession, UserSettings } from './types';
import SoundService from './services/audio';
import {
  loadSubjects,
  saveSubjects,
  loadTopics,
  saveTopics,
  loadFlashcards,
  saveFlashcards,
  loadQuizAttempts,
  saveQuizAttempt,
  loadStudySessions,
  recordStudySession,
  loadSettings,
  saveSettings,
  calculateStudyStreak,
  resetToSampleData,
} from './services/storage';
import { getSupabaseClient } from './services/supabase';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SubjectsManager } from './components/SubjectsManager';
import { TopicStudio, StudioTab } from './components/TopicStudio/TopicStudio';
import { AIAssistant } from './components/AIAssistant';
import { PomodoroTimer, TimerMode, MODE_CONFIG, formatTime } from './components/PomodoroTimer';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [studioInitialTab, setStudioInitialTab] = useState<StudioTab>('explain');

  // Pomodoro Persistent State (never resets when navigating across topics or tabs)
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>('focus');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState<number>(MODE_CONFIG.focus.defaultMinutes * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState<boolean>(false);
  const [pomodoroTopicId, setPomodoroTopicId] = useState<string>('');
  const [pomodoroCompletedToday, setPomodoroCompletedToday] = useState<number>(0);
  const pomodoroTargetTimeRef = useRef<number | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup' | 'forgot' | 'update_password'>('signin');
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('studybuddy_user_email_v1') || null;
    } catch {
      return null;
    }
  });

  const handleUserChange = (email: string | null) => {
    setUserEmail(email);
    try {
      if (email) {
        localStorage.setItem('studybuddy_user_email_v1', email);
      } else {
        localStorage.removeItem('studybuddy_user_email_v1');
      }
    } catch (e) {
      console.warn('Failed to save user email in localStorage', e);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const loadedSubs = loadSubjects();
    const loadedTops = loadTopics();
    const loadedCards = loadFlashcards();
    const loadedQuizzes = loadQuizAttempts();
    const loadedSessions = loadStudySessions();
    const loadedSets = loadSettings();

    setSubjects(loadedSubs);
    setTopics(loadedTops);
    setFlashcards(loadedCards);
    setQuizAttempts(loadedQuizzes);
    setStudySessions(loadedSessions);
    setSettings(loadedSets);

    if (loadedTops.length > 0) {
      setSelectedTopicId(loadedTops[0].id);
      setPomodoroTopicId(loadedTops[0].id);
    }

    // Check Supabase session & recovery events
    const supabase = getSupabaseClient(loadedSets.supabaseUrl, loadedSets.supabaseAnonKey);
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          handleUserChange(data.session.user.email);
        }
      }).catch((e) => console.warn('Supabase session check error:', e));

      // Listen for PASSWORD_RECOVERY or session changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthInitialMode('update_password');
          setIsAuthOpen(true);
        } else if (session?.user?.email) {
          handleUserChange(session.user.email);
        }
      });

      // Check if URL hash or query contains recovery redirect from password reset email
      if (
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery')
      ) {
        setAuthInitialMode('update_password');
        setIsAuthOpen(true);
      }

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleToggleTheme = () => {
    const updated = { ...settings, darkMode: !settings.darkMode };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleSelectTopic = (topicId: string, initialTab: StudioTab = 'explain') => {
    setSelectedTopicId(topicId);
    setStudioInitialTab(initialTab);
    setActiveTab('studio');

    // Update lastStudiedAt
    const updatedTopics = topics.map((t) =>
      t.id === topicId ? { ...t, lastStudiedAt: Date.now() } : t
    );
    setTopics(updatedTopics);
    saveTopics(updatedTopics);
  };

  const handleQuickExplain = (topicTitle: string) => {
    // Check if topic exists
    const existing = topics.find((t) => t.title.toLowerCase() === topicTitle.toLowerCase());
    if (existing) {
      handleSelectTopic(existing.id, 'explain');
      return;
    }

    // Otherwise create topic under first subject
    const defaultSubject = subjects[0] || {
      id: 'sub_general',
      name: 'General Studies',
      description: 'General study topics',
      color: 'indigo',
      icon: 'BookOpen',
      createdAt: Date.now(),
    };

    const newTopic: Topic = {
      id: `top_${Date.now()}`,
      subjectId: defaultSubject.id,
      title: topicTitle,
      description: `Exploring key concepts and principles of ${topicTitle}.`,
      masteryLevel: 10,
      lastStudiedAt: Date.now(),
    };

    const updated = [newTopic, ...topics];
    setTopics(updated);
    saveTopics(updated);

    setSelectedTopicId(newTopic.id);
    setStudioInitialTab('explain');
    setActiveTab('studio');
  };

  // Topic mastery changer
  const handleTopicMasteryChange = (topicId: string, delta: number) => {
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        const nextVal = Math.min(100, Math.max(0, t.masteryLevel + delta));
        return { ...t, masteryLevel: nextVal };
      }
      return t;
    });
    setTopics(updated);
    saveTopics(updated);
  };

  // Explanation cache updater
  const handleUpdateTopicExplanation = (topicId: string, level: string, text: string) => {
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          explanationCache: {
            ...(t.explanationCache || {}),
            [level]: text,
          },
        };
      }
      return t;
    });
    setTopics(updated);
    saveTopics(updated);
  };

  // Flashcards CRUD
  const handleAddFlashcards = (newCards: Flashcard[]) => {
    const updated = [...flashcards, ...newCards];
    setFlashcards(updated);
    saveFlashcards(updated);
  };

  const handleUpdateFlashcard = (card: Flashcard) => {
    const updated = flashcards.map((c) => (c.id === card.id ? card : c));
    setFlashcards(updated);
    saveFlashcards(updated);
  };

  const handleDeleteFlashcard = (cardId: string) => {
    const updated = flashcards.filter((c) => c.id !== cardId);
    setFlashcards(updated);
    saveFlashcards(updated);
  };

  // Quiz Attempt Saver
  const handleSaveQuizAttempt = (attempt: QuizAttempt) => {
    saveQuizAttempt(attempt);
    setQuizAttempts((prev) => [attempt, ...prev]);
  };

  // Session complete (Pomodoro)
  const handleSessionComplete = (session: StudySession) => {
    recordStudySession(session);
    setStudySessions((prev) => [session, ...prev]);
  };

  // Continuous background Pomodoro timer that NEVER resets when navigating across topics or tabs
  useEffect(() => {
    let interval: any = null;

    if (isPomodoroActive) {
      if (!pomodoroTargetTimeRef.current) {
        pomodoroTargetTimeRef.current = Date.now() + pomodoroTimeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!pomodoroTargetTimeRef.current) return;
        const remaining = Math.max(0, Math.round((pomodoroTargetTimeRef.current - Date.now()) / 1000));
        setPomodoroTimeLeft(remaining);

        if (remaining <= 0) {
          pomodoroTargetTimeRef.current = null;
          setIsPomodoroActive(false);
          SoundService.playTimerChime();

          if (pomodoroMode === 'focus') {
            const currentTopic = topics.find((t) => t.id === pomodoroTopicId);
            const session: StudySession = {
              id: `sess_${Date.now()}`,
              topicId: pomodoroTopicId || undefined,
              topicTitle: currentTopic?.title,
              durationMinutes: MODE_CONFIG.focus.defaultMinutes,
              date: new Date().toISOString().slice(0, 10),
              timestamp: Date.now(),
            };
            handleSessionComplete(session);
            const nextCount = pomodoroCompletedToday + 1;
            setPomodoroCompletedToday(nextCount);

            if (nextCount % 4 === 0) {
              setPomodoroMode('longBreak');
              setPomodoroTimeLeft(MODE_CONFIG.longBreak.defaultMinutes * 60);
            } else {
              setPomodoroMode('shortBreak');
              setPomodoroTimeLeft(MODE_CONFIG.shortBreak.defaultMinutes * 60);
            }
          } else {
            setPomodoroMode('focus');
            setPomodoroTimeLeft(MODE_CONFIG.focus.defaultMinutes * 60);
          }
        }
      }, 500);
    } else {
      pomodoroTargetTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroActive, pomodoroMode, pomodoroTopicId, pomodoroCompletedToday, topics]);

  const handleTogglePomodoro = () => {
    if (isPomodoroActive) {
      setIsPomodoroActive(false);
      pomodoroTargetTimeRef.current = null;
    } else {
      pomodoroTargetTimeRef.current = Date.now() + pomodoroTimeLeft * 1000;
      setIsPomodoroActive(true);
    }
  };

  const handleResetPomodoro = () => {
    setIsPomodoroActive(false);
    pomodoroTargetTimeRef.current = null;
    setPomodoroTimeLeft(MODE_CONFIG[pomodoroMode].defaultMinutes * 60);
  };

  const handleSwitchPomodoroMode = (newMode: TimerMode) => {
    setIsPomodoroActive(false);
    pomodoroTargetTimeRef.current = null;
    setPomodoroMode(newMode);
    setPomodoroTimeLeft(MODE_CONFIG[newMode].defaultMinutes * 60);
  };

  const handleSkipPomodoro = () => {
    setIsPomodoroActive(false);
    pomodoroTargetTimeRef.current = null;
    if (pomodoroMode === 'focus') {
      handleSwitchPomodoroMode('shortBreak');
    } else {
      handleSwitchPomodoroMode('focus');
    }
  };

  const handleOpenTopicFromPomodoro = (topicId: string) => {
    setSelectedTopicId(topicId);
    setStudioInitialTab('explain');
    setActiveTab('studio');
  };

  const handleUpdateDailyGoal = (minutes: number, scheduledTime?: string) => {
    const updated = {
      ...settings,
      dailyGoalMinutes: minutes,
      dailyStudyTimeOfDay: scheduledTime !== undefined ? scheduledTime : settings.dailyStudyTimeOfDay,
    };
    setSettings(updated);
    saveSettings(updated);
  };

  // Subject CRUD
  const handleCreateSubject = (subData: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSub: Subject = {
      ...subData,
      id: `sub_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    saveSubjects(updated);
  };

  const handleDeleteSubject = (subjectId: string) => {
    const updatedSubs = subjects.filter((s) => s.id !== subjectId);
    const updatedTopics = topics.filter((t) => t.subjectId !== subjectId);
    setSubjects(updatedSubs);
    setTopics(updatedTopics);
    saveSubjects(updatedSubs);
    saveTopics(updatedTopics);
  };

  // Topic CRUD
  const handleCreateTopic = (
    topData: Omit<Topic, 'id' | 'lastStudiedAt' | 'masteryLevel'>,
    autoSelect: boolean = true
  ) => {
    const newTop: Topic = {
      ...topData,
      id: `top_${Date.now()}`,
      masteryLevel: 10,
      lastStudiedAt: Date.now(),
    };
    const updated = [newTop, ...topics];
    setTopics(updated);
    saveTopics(updated);
    if (autoSelect) {
      handleSelectTopic(newTop.id);
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    const updated = topics.filter((t) => t.id !== topicId);
    const updatedCards = flashcards.filter((c) => c.topicId !== topicId);
    setTopics(updated);
    setFlashcards(updatedCards);
    saveTopics(updated);
    saveFlashcards(updatedCards);

    if (selectedTopicId === topicId && updated.length > 0) {
      setSelectedTopicId(updated[0].id);
    }
  };

  // Backup & Restore
  const handleExportData = () => {
    const data = {
      subjects,
      topics,
      flashcards,
      quizAttempts,
      studySessions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_buddy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.subjects) {
          setSubjects(parsed.subjects);
          saveSubjects(parsed.subjects);
        }
        if (parsed.topics) {
          setTopics(parsed.topics);
          saveTopics(parsed.topics);
        }
        if (parsed.flashcards) {
          setFlashcards(parsed.flashcards);
          saveFlashcards(parsed.flashcards);
        }
        if (parsed.studySessions) {
          setStudySessions(parsed.studySessions);
        }
        alert('Data imported successfully!');
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    resetToSampleData();
    setSubjects(loadSubjects());
    setTopics(loadTopics());
    setFlashcards(loadFlashcards());
    setQuizAttempts([]);
    setStudySessions(loadStudySessions());
  };

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const currentSubject = subjects.find((s) => s.id === currentTopic?.subjectId);
  const streakDays = calculateStudyStreak(studySessions);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTopicTitle={currentTopic?.title}
        streakDays={streakDays}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setIsAuthOpen(true);
        }}
        onToggleTheme={handleToggleTheme}
        userEmail={userEmail}
        pomodoroState={{
          isActive: isPomodoroActive,
          timeLeft: pomodoroTimeLeft,
          mode: pomodoroMode,
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            subjects={subjects}
            topics={topics}
            flashcards={flashcards}
            quizAttempts={quizAttempts}
            studySessions={studySessions}
            streakDays={streakDays}
            dailyGoalMinutes={settings.dailyGoalMinutes || 60}
            dailyStudyTimeOfDay={settings.dailyStudyTimeOfDay || '18:00'}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onSelectTopic={(id, tab) => handleSelectTopic(id, tab || 'explain')}
            onNavigateToSubjects={() => setActiveTab('subjects')}
            onStartPomodoro={() => setActiveTab('pomodoro')}
            onQuickExplain={handleQuickExplain}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsManager
            subjects={subjects}
            topics={topics}
            onSelectTopic={(id) => handleSelectTopic(id, 'explain')}
            onCreateSubject={handleCreateSubject}
            onDeleteSubject={handleDeleteSubject}
            onCreateTopic={handleCreateTopic}
            onDeleteTopic={handleDeleteTopic}
          />
        )}

        {activeTab === 'studio' && (
          currentTopic ? (
            <TopicStudio
              topic={currentTopic}
              subject={currentSubject}
              allTopics={topics}
              flashcards={flashcards}
              onSelectTopic={(id) => setSelectedTopicId(id)}
              onCreateTopic={handleCreateTopic}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onUpdateTopicExplanation={(lvl, txt) => handleUpdateTopicExplanation(currentTopic.id, lvl, txt)}
              onAddFlashcards={handleAddFlashcards}
              onUpdateFlashcard={handleUpdateFlashcard}
              onDeleteFlashcard={handleDeleteFlashcard}
              onSaveQuizAttempt={handleSaveQuizAttempt}
              onTopicMasteryChange={(delta) => handleTopicMasteryChange(currentTopic.id, delta)}
              initialTab={studioInitialTab}
            />
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-bold mb-2">No topic selected</h3>
              <p className="text-xs text-slate-500 mb-4">Please select or create a topic to enter the studio.</p>
              <button
                onClick={() => setActiveTab('subjects')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Go to Subjects & Topics
              </button>
            </div>
          )
        )}

        {activeTab === 'assistant' && <AIAssistant topics={topics} />}

        {activeTab === 'pomodoro' && (
          <PomodoroTimer
            topics={topics}
            mode={pomodoroMode}
            timeLeft={pomodoroTimeLeft}
            isActive={isPomodoroActive}
            selectedTopicId={pomodoroTopicId}
            sessionsCompletedToday={pomodoroCompletedToday}
            onToggle={handleTogglePomodoro}
            onReset={handleResetPomodoro}
            onSkip={handleSkipPomodoro}
            onSwitchMode={handleSwitchPomodoroMode}
            onSelectTopic={setPomodoroTopicId}
            onOpenTopicInStudio={handleOpenTopicFromPomodoro}
          />
        )}
      </main>

      {/* Floating Pomodoro Bar when navigating other tabs */}
      {activeTab !== 'pomodoro' && (isPomodoroActive || pomodoroTimeLeft < MODE_CONFIG[pomodoroMode].defaultMinutes * 60) && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-xl shadow-indigo-500/10 animate-fade-in">
          <div
            onClick={() => setActiveTab('pomodoro')}
            className={`p-2 rounded-xl text-white cursor-pointer ${
              pomodoroMode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-600'
            } ${isPomodoroActive ? 'animate-pulse' : ''}`}
            title="Click to view full Pomodoro clock"
          >
            <Timer className="w-4 h-4" />
          </div>
          <div className="flex flex-col cursor-pointer" onClick={() => setActiveTab('pomodoro')}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                {formatTime(pomodoroTimeLeft)}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {MODE_CONFIG[pomodoroMode].label}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
              {topics.find((t) => t.id === pomodoroTopicId)?.title || 'Study Session'}
            </span>
          </div>
          <button
            onClick={handleTogglePomodoro}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={isPomodoroActive ? 'Pause Timer' : 'Resume Timer'}
          >
            {isPomodoroActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pl-0.5"
          >
            View
          </button>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(sets) => {
          setSettings(sets);
          saveSettings(sets);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userEmail={userEmail}
        onUserChange={handleUserChange}
        initialMode={authInitialMode}
      />
    </div>
  );
}
