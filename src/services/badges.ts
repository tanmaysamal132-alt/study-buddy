import { Badge, StudySession, Topic, Flashcard, QuizAttempt } from '../types';
import { getTodayDateString } from './storage';

export function calculateBadges(
  studySessions: StudySession[],
  streakDays: number,
  topics: Topic[],
  flashcards: Flashcard[],
  quizAttempts: QuizAttempt[],
  dailyGoalMinutes: number = 50
): Badge[] {
  const today = getTodayDateString();
  const todaySessions = studySessions.filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const totalFocusMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalReviews = flashcards.reduce((acc, c) => acc + (c.reviewCount || 0), 0);
  const masteredTopicsCount = topics.filter((t) => t.masteryLevel >= 80).length;
  const highScoringQuizzes = quizAttempts.filter((q) => (q.score / (q.totalQuestions || 1)) >= 0.8).length;
  const topicsWithModerateMastery = topics.filter((t) => t.masteryLevel >= 50).length;
  const maxSingleTopicMastery = topics.length > 0 ? Math.max(...topics.map((t) => t.masteryLevel)) : 0;

  const badgesList: Badge[] = [
    // 1. Daily Achiever (Daily goal reached)
    {
      id: 'badge_daily_achiever',
      name: 'Daily Achiever',
      description: 'Met or exceeded your target study duration for today.',
      category: 'focus',
      icon: 'Target',
      color: '#6366f1',
      unlocked: todayMinutes >= dailyGoalMinutes,
      progress: Math.min(100, Math.round((todayMinutes / (dailyGoalMinutes || 1)) * 100)),
      progressText: `${todayMinutes} / ${dailyGoalMinutes} mins today`,
      requirement: `Study for ${dailyGoalMinutes} minutes in a single day`,
    },

    // 2. First Focus Block
    {
      id: 'badge_first_step',
      name: 'First Step',
      description: 'Completed your very first focused study session.',
      category: 'focus',
      icon: 'Sparkles',
      color: '#10b981',
      unlocked: studySessions.length >= 1,
      progress: studySessions.length >= 1 ? 100 : 0,
      progressText: `${Math.min(1, studySessions.length)} / 1 session`,
      requirement: 'Complete 1 Pomodoro focus block',
    },

    // 3. Deep Diver (1 Hour Focus)
    {
      id: 'badge_deep_diver',
      name: 'Deep Diver',
      description: 'Accumulated over 60 minutes of uninterrupted study time.',
      category: 'focus',
      icon: 'Clock',
      color: '#06b6d4',
      unlocked: totalFocusMinutes >= 60,
      progress: Math.min(100, Math.round((totalFocusMinutes / 60) * 100)),
      progressText: `${totalFocusMinutes} / 60 mins`,
      requirement: 'Accumulate 60 minutes of total study time',
    },

    // 4. Centurion of Focus (3 Hours)
    {
      id: 'badge_centurion',
      name: 'Centurion of Focus',
      description: 'Accumulated 180+ minutes (3 hours) of dedicated focus.',
      category: 'focus',
      icon: 'Award',
      color: '#8b5cf6',
      unlocked: totalFocusMinutes >= 180,
      progress: Math.min(100, Math.round((totalFocusMinutes / 180) * 100)),
      progressText: `${totalFocusMinutes} / 180 mins`,
      requirement: 'Reach 180 minutes of total study time',
    },

    // 5. Consistency Spark (3-Day Streak)
    {
      id: 'badge_streak_3',
      name: 'Consistency Spark',
      description: 'Maintained a consecutive study streak for 3 days.',
      category: 'streak',
      icon: 'Flame',
      color: '#f59e0b',
      unlocked: streakDays >= 3,
      progress: Math.min(100, Math.round((streakDays / 3) * 100)),
      progressText: `${streakDays} / 3 days`,
      requirement: 'Study on 3 consecutive days',
    },

    // 6. Habit Master (7-Day Streak)
    {
      id: 'badge_streak_7',
      name: 'Habit Master',
      description: 'An elite 7-day study streak! Active recall is now second nature.',
      category: 'streak',
      icon: 'Zap',
      color: '#f43f5e',
      unlocked: streakDays >= 7,
      progress: Math.min(100, Math.round((streakDays / 7) * 100)),
      progressText: `${streakDays} / 7 days`,
      requirement: 'Maintain a 7-day consecutive streak',
    },

    // 7. Curious Mind (Moderate Mastery across 3 topics)
    {
      id: 'badge_curious_mind',
      name: 'Curious Mind',
      description: 'Reached 50%+ mastery across at least 3 distinct topics.',
      category: 'mastery',
      icon: 'Brain',
      color: '#3b82f6',
      unlocked: topicsWithModerateMastery >= 3,
      progress: Math.min(100, Math.round((topicsWithModerateMastery / 3) * 100)),
      progressText: `${topicsWithModerateMastery} / 3 topics (50%+ mastery)`,
      requirement: 'Reach 50% mastery in 3 topics',
    },

    // 8. Topic Conqueror (90%+ mastery on 1 topic)
    {
      id: 'badge_topic_conqueror',
      name: 'Topic Conqueror',
      description: 'Reached near-flawless mastery (90%+) on a complex topic.',
      category: 'mastery',
      icon: 'Trophy',
      color: '#eab308',
      unlocked: maxSingleTopicMastery >= 90,
      progress: Math.min(100, maxSingleTopicMastery),
      progressText: `${maxSingleTopicMastery}% / 90% highest mastery`,
      requirement: 'Achieve 90% mastery on any single topic',
    },

    // 9. Polymath Scholar (3 Mastered Topics)
    {
      id: 'badge_polymath',
      name: 'Polymath Scholar',
      description: 'Mastered 3 or more topics with an 80%+ rating.',
      category: 'mastery',
      icon: 'GraduationCap',
      color: '#8b5cf6',
      unlocked: masteredTopicsCount >= 3,
      progress: Math.min(100, Math.round((masteredTopicsCount / 3) * 100)),
      progressText: `${masteredTopicsCount} / 3 topics mastered`,
      requirement: 'Master 3 topics (80%+ mastery level)',
    },

    // 10. Memory Architect (15 Flashcard Reviews)
    {
      id: 'badge_card_flipper',
      name: 'Memory Architect',
      description: 'Engaged in spaced repetition with 15+ flashcard reviews.',
      category: 'cards',
      icon: 'Layers',
      color: '#10b981',
      unlocked: totalReviews >= 15,
      progress: Math.min(100, Math.round((totalReviews / 15) * 100)),
      progressText: `${totalReviews} / 15 reviews`,
      requirement: 'Review flashcards 15 times',
    },

    // 11. Quiz Whiz (80%+ on Diagnostic Quiz)
    {
      id: 'badge_quiz_whiz',
      name: 'Quiz Whiz',
      description: 'Scored 80% or higher on an AI diagnostic quiz.',
      category: 'quiz',
      icon: 'CheckCircle2',
      color: '#06b6d4',
      unlocked: highScoringQuizzes >= 1,
      progress: highScoringQuizzes >= 1 ? 100 : (quizAttempts.length > 0 ? 50 : 0),
      progressText: `${highScoringQuizzes} high score quizzes`,
      requirement: 'Score 80%+ on any diagnostic quiz',
    },

    // 12. Assessment Veteran (3 Quizzes Taken)
    {
      id: 'badge_assessment_veteran',
      name: 'Assessment Veteran',
      description: 'Completed 3 diagnostic quizzes to expose and eliminate knowledge gaps.',
      category: 'quiz',
      icon: 'HelpCircle',
      color: '#6366f1',
      unlocked: quizAttempts.length >= 3,
      progress: Math.min(100, Math.round((quizAttempts.length / 3) * 100)),
      progressText: `${quizAttempts.length} / 3 quizzes completed`,
      requirement: 'Take 3 diagnostic quizzes',
    },
  ];

  return badgesList;
}
