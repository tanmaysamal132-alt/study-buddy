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
  saveStudySessions,
  recordStudySession,
  loadSettings,
  saveSettings,
  calculateStudyStreak,
  resetToSampleData,
  fetchUserCloudData,
  debouncedCloudSync,
} from './services/storage';
import { AIService } from './services/ai';
import { getSupabaseClient } from './services/supabase';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SubjectsManager } from './components/SubjectsManager';
import { TopicStudio, StudioTab } from './components/TopicStudio/TopicStudio';
import { AIAssistant } from './components/AIAssistant';
import { PomodoroTimer, TimerMode, MODE_CONFIG, formatTime } from './components/PomodoroTimer';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { EmailStartModal } from './components/EmailStartModal';

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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('studybuddy_user_email_v1');
    } catch {
      return true;
    }
  });
  const isCloudDataLoadedRef = useRef<boolean>(!userEmail);

  const triggerSync = (
    subs = subjects,
    tops = topics,
    cards = flashcards,
    quizzes = quizAttempts,
    sessions = studySessions,
    sets = settings
  ) => {
    if (userEmail) {
      debouncedCloudSync({
        email: userEmail,
        subjects: subs,
        topics: tops,
        flashcards: cards,
        quizAttempts: quizzes,
        studySessions: sessions,
        settings: sets,
      });
    }
  };

  // Continuous background auto-sync whenever progression state updates
  useEffect(() => {
    if (!userEmail || !isCloudDataLoadedRef.current) return;
    debouncedCloudSync({
      email: userEmail,
      subjects,
      topics,
      flashcards,
      quizAttempts,
      studySessions,
      settings,
    }, 500);
  }, [subjects, topics, flashcards, quizAttempts, studySessions, settings, userEmail]);

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

  const handleEmailConfirm = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    handleUserChange(cleanEmail);

    try {
      const cloud = await fetchUserCloudData(cleanEmail);
      isCloudDataLoadedRef.current = true;
      if (cloud && cloud.subjects) {
        setSubjects(cloud.subjects);
        setTopics(cloud.topics || []);
        setFlashcards(cloud.flashcards || []);
        setQuizAttempts(cloud.quizAttempts || []);
        setStudySessions(cloud.studySessions || []);
        saveSubjects(cloud.subjects);
        saveTopics(cloud.topics || []);
        saveFlashcards(cloud.flashcards || []);
        saveStudySessions(cloud.studySessions || []);

        if (cloud.topics?.length > 0) {
          setSelectedTopicId(cloud.topics[0].id);
          setPomodoroTopicId(cloud.topics[0].id);
        }
      } else {
        debouncedCloudSync({
          email: cleanEmail,
          subjects,
          topics,
          flashcards,
          quizAttempts,
          studySessions,
          settings,
        }, 50);
      }
    } catch (e) {
      isCloudDataLoadedRef.current = true;
      console.warn('Failed to load cloud data on login:', e);
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

    // If an email was previously saved, fetch the latest progression from the cloud
    if (userEmail) {
      fetchUserCloudData(userEmail)
        .then((cloud) => {
          isCloudDataLoadedRef.current = true;
          if (cloud && cloud.subjects) {
            setSubjects(cloud.subjects);
            setTopics(cloud.topics || []);
            setFlashcards(cloud.flashcards || []);
            setQuizAttempts(cloud.quizAttempts || []);
            setStudySessions(cloud.studySessions || []);
            saveSubjects(cloud.subjects);
            saveTopics(cloud.topics || []);
            saveFlashcards(cloud.flashcards || []);
            saveStudySessions(cloud.studySessions || []);
            if (cloud.topics?.length > 0) {
              setSelectedTopicId(cloud.topics[0].id);
              setPomodoroTopicId(cloud.topics[0].id);
            }
          }
        })
        .catch((e) => {
          isCloudDataLoadedRef.current = true;
          console.warn('Cloud load error on mount:', e);
        });
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
    setTopics((prev) => {
      const updatedTopics = prev.map((t) =>
        t.id === topicId ? { ...t, lastStudiedAt: Date.now() } : t
      );
      saveTopics(updatedTopics);
      return updatedTopics;
    });
  };

  const handleQuickExplain = async (topicTitle: string) => {
    const cleanQuery = topicTitle.trim();
    if (!cleanQuery) return;

    // Check if topic exists
    const existing = topics.find((t) => t.title.toLowerCase() === cleanQuery.toLowerCase());
    if (existing) {
      handleSelectTopic(existing.id, 'explain');
      return;
    }

    try {
      // Analyze subject query to see where it belongs & auto-generate topics!
      const analysis = await AIService.analyzeSubject(cleanQuery);

      const newSub: Subject = {
        id: `sub_${Date.now()}`,
        name: analysis.name || cleanQuery,
        description: analysis.description || `Study curriculum for ${cleanQuery}`,
        color: analysis.color || 'indigo',
        icon: analysis.icon || 'BookOpen',
        createdAt: Date.now(),
      };

      const updatedSubs = [...subjects, newSub];
      setSubjects(updatedSubs);
      saveSubjects(updatedSubs);

      const generatedTopics: Topic[] = (analysis.topics || []).map((top, idx) => ({
        id: `top_${Date.now()}_${idx}`,
        subjectId: newSub.id,
        title: top.title,
        description: top.description,
        masteryLevel: 10,
        lastStudiedAt: Date.now() - idx * 1000,
        explanationCache: {},
        savedQuestions: [],
      }));

      const finalTopics = generatedTopics.length > 0 ? generatedTopics : [
        {
          id: `top_${Date.now()}`,
          subjectId: newSub.id,
          title: cleanQuery,
          description: `Key concepts and fundamentals of ${cleanQuery}.`,
          masteryLevel: 10,
          lastStudiedAt: Date.now(),
          explanationCache: {},
          savedQuestions: [],
        },
      ];

      const updatedTopics = [...finalTopics, ...topics];
      setTopics(updatedTopics);
      saveTopics(updatedTopics);

      setSelectedTopicId(finalTopics[0].id);
      setStudioInitialTab('explain');
      setActiveTab('studio');

      triggerSync(updatedSubs, updatedTopics);
    } catch (err) {
      console.warn('Quick explain fallback:', err);
      const defaultSubject = subjects[0] || {
        id: `sub_${Date.now()}`,
        name: 'General Studies',
        description: 'General study topics',
        color: 'indigo' as const,
        icon: 'BookOpen',
        createdAt: Date.now(),
      };

      if (!subjects.some((s) => s.id === defaultSubject.id)) {
        setSubjects((prev) => [...prev, defaultSubject]);
        saveSubjects([...subjects, defaultSubject]);
      }

      const newTopic: Topic = {
        id: `top_${Date.now()}`,
        subjectId: defaultSubject.id,
        title: cleanQuery,
        description: `Exploring key concepts and principles of ${cleanQuery}.`,
        masteryLevel: 10,
        lastStudiedAt: Date.now(),
        explanationCache: {},
        savedQuestions: [],
      };

      setTopics((prev) => {
        const updated = [newTopic, ...prev.filter((t) => t.id !== newTopic.id)];
        saveTopics(updated);
        triggerSync(subjects, updated);
        return updated;
      });

      setSelectedTopicId(newTopic.id);
      setStudioInitialTab('explain');
      setActiveTab('studio');
    }
  };

  // Topic mastery changer
  const handleTopicMasteryChange = (topicId: string, delta: number) => {
    setTopics((prev) => {
      const updated = prev.map((t) => {
        if (t.id === topicId) {
          const nextVal = Math.min(100, Math.max(0, t.masteryLevel + delta));
          return { ...t, masteryLevel: nextVal };
        }
        return t;
      });
      saveTopics(updated);
      triggerSync(subjects, updated);
      return updated;
    });
  };

  // Explanation cache updater
  const handleUpdateTopicExplanation = (topicId: string, level: string, text: string) => {
    setTopics((prev) => {
      const updated = prev.map((t) => {
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
      saveTopics(updated);
      triggerSync(subjects, updated);
      return updated;
    });
  };

  // Save question & answer directly into the topic so it persists across devices!
  const handleSaveTopicQuestionAnswer = (
    topicId: string,
    qa: { id: string; question: string; answer: string; timestamp: number }
  ) => {
    setTopics((prev) => {
      const updated = prev.map((t) => {
        if (t.id === topicId) {
          const prevQuestions = t.savedQuestions || [];
          return {
            ...t,
            savedQuestions: [qa, ...prevQuestions.filter((q) => q.id !== qa.id)],
          };
        }
        return t;
      });
      saveTopics(updated);
      triggerSync(subjects, updated);
      return updated;
    });
  };

  const handleDeleteTopicQuestionAnswer = (topicId: string, questionId: string) => {
    setTopics((prev) => {
      const updated = prev.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            savedQuestions: (t.savedQuestions || []).filter((q) => q.id !== questionId),
          };
        }
        return t;
      });
      saveTopics(updated);
      triggerSync(subjects, updated);
      return updated;
    });
  };

  // Flashcards CRUD
  const handleAddFlashcards = (newCards: Flashcard[]) => {
    const updated = [...flashcards, ...newCards];
    setFlashcards(updated);
    saveFlashcards(updated);
    triggerSync(subjects, topics, updated);
  };

  const handleUpdateFlashcard = (card: Flashcard) => {
    const updated = flashcards.map((c) => (c.id === card.id ? card : c));
    setFlashcards(updated);
    saveFlashcards(updated);
    triggerSync(subjects, topics, updated);
  };

  const handleDeleteFlashcard = (cardId: string) => {
    const updated = flashcards.filter((c) => c.id !== cardId);
    setFlashcards(updated);
    saveFlashcards(updated);
    triggerSync(subjects, topics, updated);
  };

  // Quiz Attempt Saver
  const handleSaveQuizAttempt = (attempt: QuizAttempt) => {
    saveQuizAttempt(attempt);
    setQuizAttempts((prev) => {
      const updated = [attempt, ...prev];
      triggerSync(subjects, topics, flashcards, updated);
      return updated;
    });
  };

  // Session complete (Pomodoro)
  const handleSessionComplete = (session: StudySession) => {
    recordStudySession(session);
    setStudySessions((prev) => {
      const updated = [session, ...prev];
      triggerSync(subjects, topics, flashcards, quizAttempts, updated);
      return updated;
    });
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
  const handleCreateSubject = (
    subData: Omit<Subject, 'id' | 'createdAt'>,
    initialTopics?: Array<{ title: string; description: string }>
  ) => {
    const newSub: Subject = {
      ...subData,
      id: `sub_${Date.now()}`,
      createdAt: Date.now(),
    };
    const updatedSubs = [...subjects, newSub];
    setSubjects(updatedSubs);
    saveSubjects(updatedSubs);

    if (initialTopics && initialTopics.length > 0) {
      const newTopicsList: Topic[] = initialTopics.map((top, idx) => ({
        id: `top_${Date.now()}_${idx}`,
        subjectId: newSub.id,
        title: top.title,
        description: top.description,
        masteryLevel: 10,
        lastStudiedAt: Date.now() - idx * 1000,
        explanationCache: {},
        savedQuestions: [],
      }));

      const updatedTopics = [...newTopicsList, ...topics];
      setTopics(updatedTopics);
      saveTopics(updatedTopics);

      setSelectedTopicId(newTopicsList[0].id);
      setStudioInitialTab('explain');
      setActiveTab('studio');

      triggerSync(updatedSubs, updatedTopics);
    } else {
      triggerSync(updatedSubs);
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    const updatedSubs = subjects.filter((s) => s.id !== subjectId);
    const topicsToDelete = topics.filter((t) => t.subjectId === subjectId);
    const topicIdsToDelete = new Set(topicsToDelete.map((t) => t.id));
    const updatedTopics = topics.filter((t) => t.subjectId !== subjectId);
    const updatedCards = flashcards.filter((c) => !topicIdsToDelete.has(c.topicId));

    setSubjects(updatedSubs);
    setTopics(updatedTopics);
    setFlashcards(updatedCards);

    saveSubjects(updatedSubs);
    saveTopics(updatedTopics);
    saveFlashcards(updatedCards);

    if (selectedTopicId && topicIdsToDelete.has(selectedTopicId)) {
      setSelectedTopicId(updatedTopics[0]?.id || '');
    }

    triggerSync(updatedSubs, updatedTopics, updatedCards);
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

    setTopics((prev) => {
      const updated = [newTop, ...prev.filter((t) => t.id !== newTop.id)];
      saveTopics(updated);
      return updated;
    });

    if (autoSelect) {
      setSelectedTopicId(newTop.id);
      setStudioInitialTab('explain');
      setActiveTab('studio');
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics((prev) => {
      const updated = prev.filter((t) => t.id !== topicId);
      saveTopics(updated);
      if (selectedTopicId === topicId) {
        setSelectedTopicId(updated[0]?.id || '');
      }
      return updated;
    });

    setFlashcards((prev) => {
      const updatedCards = prev.filter((c) => c.topicId !== topicId);
      saveFlashcards(updatedCards);
      return updatedCards;
    });
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
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
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
              onSaveTopicQuestionAnswer={handleSaveTopicQuestionAnswer}
              onDeleteTopicQuestionAnswer={handleDeleteTopicQuestionAnswer}
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

      {/* Email Start Modal for cross-device progression sync */}
      <EmailStartModal
        isOpen={isEmailModalOpen}
        onConfirmEmail={handleEmailConfirm}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={userEmail}
      />
    </div>
  );
}
