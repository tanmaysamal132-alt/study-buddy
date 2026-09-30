import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Clock,
  Target,
  Zap,
  Brain,
  Trophy,
  GraduationCap,
  Layers,
  CheckCircle2,
  HelpCircle,
  Lock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Badge } from '../types';

interface BadgesShowcaseProps {
  badges: Badge[];
}

export const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({ badges }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBadgeModal, setActiveBadgeModal] = useState<Badge | null>(null);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredBadges = badges.filter((b) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return b.unlocked;
    return b.category === selectedCategory;
  });

  const getBadgeIcon = (iconName: string, isUnlocked: boolean, color: string) => {
    const className = `w-6 h-6 ${isUnlocked ? 'text-white' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Target':
        return <Target className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Brain':
        return <Brain className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'HelpCircle':
        return <HelpCircle className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const handleBadgeClick = (badge: Badge) => {
    if (badge.unlocked) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
    setActiveBadgeModal(badge);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Header & Overall Level Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1 border border-amber-200/60 dark:border-amber-800/60">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Achievement Trophies</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Study Badges & Honors
          </h3>
          <p className="text-xs text-slate-500">
            Unlock distinctive accolades through deep focus, topic mastery, and active recall.
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Unlocked
            </span>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div className="w-20">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${unlockPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-medium block text-right mt-0.5">
              {unlockPercentage}% done
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All (${totalCount})` },
          { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
          { id: 'focus', label: 'Focus & Goals' },
          { id: 'streak', label: 'Streaks' },
          { id: 'mastery', label: 'Mastery' },
          { id: 'quiz', label: 'Quizzes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-800/90 dark:to-slate-900 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs hover:shadow-md hover:scale-[1.02]'
                  : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Badge Icon & Status */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                      badge.unlocked
                        ? 'shadow-indigo-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 shadow-none'
                    }`}
                    style={{
                      background: badge.unlocked
                        ? `linear-gradient(135deg, ${badge.color}, #4f46e5)`
                        : undefined,
                    }}
                  >
                    {getBadgeIcon(badge.icon, badge.unlocked, badge.color)}
                  </div>

                  {badge.unlocked ? (
                    <span className="p-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200/60 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Badge Name & Description */}
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1 leading-snug">
                  {badge.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar / Requirement */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                {badge.unlocked ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{badge.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {activeBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
              style={{
                background: activeBadgeModal.unlocked
                  ? `linear-gradient(135deg, ${activeBadgeModal.color}, #4f46e5)`
                  : '#64748b',
              }}
            >
              {getBadgeIcon(activeBadgeModal.icon, activeBadgeModal.unlocked, activeBadgeModal.color)}
            </div>

            <div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                  activeBadgeModal.unlocked
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {activeBadgeModal.unlocked ? '🏆 Badge Unlocked' : '🔒 Locked Achievement'}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {activeBadgeModal.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {activeBadgeModal.description}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left border border-slate-100 dark:border-slate-700/60 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Unlock Requirement
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                {activeBadgeModal.requirement}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                Current Status: {activeBadgeModal.progressText}
              </div>
            </div>

            <button
              onClick={() => setActiveBadgeModal(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
