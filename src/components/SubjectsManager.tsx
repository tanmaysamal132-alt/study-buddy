import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Edit2,
  ArrowRight,
  Sparkles,
  Layers,
  FolderPlus,
  FilePlus,
  CheckCircle2,
} from 'lucide-react';
import { Subject, Topic } from '../types';

interface SubjectsManagerProps {
  subjects: Subject[];
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  onCreateSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  onDeleteSubject: (subjectId: string) => void;
  onCreateTopic: (topic: Omit<Topic, 'id' | 'lastStudiedAt' | 'masteryLevel'>) => void;
  onDeleteTopic: (topicId: string) => void;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjects,
  topics,
  onSelectTopic,
  onCreateSubject,
  onDeleteSubject,
  onCreateTopic,
  onDeleteTopic,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  // New Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState<Subject['color']>('indigo');

  // New Topic form state
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicSubjectId, setNewTopicSubjectId] = useState(subjects[0]?.id || '');

  // Keep newTopicSubjectId in sync with available subjects
  React.useEffect(() => {
    if ((!newTopicSubjectId || !subjects.some((s) => s.id === newTopicSubjectId)) && subjects.length > 0) {
      setNewTopicSubjectId(subjects[0].id);
    }
  }, [subjects, newTopicSubjectId]);

  // Filtered topics
  const filteredTopics = topics.filter((t) => {
    const matchesSubject = selectedSubjectId === 'all' || t.subjectId === selectedSubjectId;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    onCreateSubject({
      name: newSubjectName.trim(),
      description: newSubjectDesc.trim() || 'Custom study subject',
      color: newSubjectColor,
      icon: 'BookOpen',
    });

    setNewSubjectName('');
    setNewSubjectDesc('');
    setIsAddSubjectOpen(false);
  };

  const handleAddTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubjectId =
      newTopicSubjectId ||
      (selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0]?.id);

    if (!newTopicTitle.trim() || !effectiveSubjectId) return;

    onCreateTopic({
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim() || 'Active study topic',
      subjectId: effectiveSubjectId,
    });

    setNewTopicTitle('');
    setNewTopicDesc('');
    setIsAddTopicOpen(false);
  };

  const colorClasses: Record<Subject['color'], { bg: string; text: string; border: string }> = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-800',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-800',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Subjects & Study Topics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize your courses and jump straight into AI explanations, flashcards, or quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FolderPlus className="w-4 h-4 text-indigo-500" />
            <span>New Subject</span>
          </button>

          <button
            onClick={() => {
              if (subjects.length > 0) {
                setNewTopicSubjectId(selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0].id);
                setIsAddTopicOpen(true);
              } else {
                setIsAddSubjectOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Topic</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Subject Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubjectId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            All Subjects ({topics.length})
          </button>

          {subjects.map((sub) => {
            const topicCount = topics.filter((t) => t.subjectId === sub.id).length;
            const isSelected = selectedSubjectId === sub.id;
            return (
              <div key={sub.id} className="relative group shrink-0">
                <button
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {topicCount}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            No study topics found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
            {searchQuery
              ? `No topics match "${searchQuery}". Try a different keyword.`
              : 'Add your first topic to start generating AI explanations and flashcards!'}
          </p>
          <button
            onClick={() => {
              if (subjects.length > 0) {
                setNewTopicSubjectId(selectedSubjectId !== 'all' ? selectedSubjectId : subjects[0].id);
                setIsAddTopicOpen(true);
              } else {
                setIsAddSubjectOpen(true);
              }
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{subjects.length > 0 ? 'Create Topic' : 'Create First Subject'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => {
            const subject = subjects.find((s) => s.id === topic.subjectId);
            const color = (subject?.color || 'indigo') as Subject['color'];
            const style = colorClasses[color] || colorClasses.indigo;

            return (
              <div
                key={topic.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {subject?.name || 'General'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete topic "${topic.title}"?`)) {
                          onDeleteTopic(topic.id);
                        }
                      }}
                      title="Delete topic"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Mastery Progress</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {topic.masteryLevel}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${topic.masteryLevel}%` }}
                    />
                  </div>

                  <button
                    onClick={() => onSelectTopic(topic.id)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Topic Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Add New Subject
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Group your study topics under a curriculum or course.
            </p>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry, Microeconomics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of course material..."
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  {(['indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'blue'] as Subject['color'][]).map(
                    (col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setNewSubjectColor(col)}
                        className={`h-7 w-7 rounded-full border-2 transition-transform ${
                          newSubjectColor === col ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor:
                            col === 'indigo'
                              ? '#6366f1'
                              : col === 'emerald'
                              ? '#10b981'
                              : col === 'amber'
                              ? '#f59e0b'
                              : col === 'rose'
                              ? '#f43f5e'
                              : col === 'violet'
                              ? '#8b5cf6'
                              : col === 'cyan'
                              ? '#06b6d4'
                              : '#3b82f6',
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isAddTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Add New Study Topic
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the concept or chapter you want to study.
            </p>

            <form onSubmit={handleAddTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newTopicSubjectId || subjects[0]?.id || ''}
                  onChange={(e) => setNewTopicSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mitosis vs Meiosis, QuickSort Algorithm"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Summary / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="What key questions or areas are you focusing on?"
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTopicOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
