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
  AlertTriangle,
} from 'lucide-react';
import { Subject, Topic } from '../types';
import { AIService } from '../services/ai';

interface SubjectsManagerProps {
  subjects: Subject[];
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  onCreateSubject: (
    subject: Omit<Subject, 'id' | 'createdAt'>,
    initialTopics?: Array<{ title: string; description: string }>
  ) => Promise<string | void> | void;
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
  const [viewMode, setViewMode] = useState<'topics' | 'subjects'>('topics');
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  // New Subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState<Subject['color']>('indigo');
  const [autoGenerateTopics, setAutoGenerateTopics] = useState(true);
  const [isAnalyzingSubject, setIsAnalyzingSubject] = useState(false);

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

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = newSubjectName.trim();
    if (!rawInput) return;

    if (autoGenerateTopics) {
      setIsAnalyzingSubject(true);
      try {
        const analysis = await AIService.analyzeSubject(rawInput);
        onCreateSubject(
          {
            name: analysis.name || rawInput,
            description: analysis.description || newSubjectDesc.trim() || `Course curriculum for ${rawInput}`,
            color: analysis.color || newSubjectColor,
            icon: analysis.icon || 'BookOpen',
          },
          analysis.topics && analysis.topics.length > 0
            ? analysis.topics
            : [
                { title: `${rawInput} - Fundamentals & Core Concepts`, description: `Introductory mechanisms and foundational definitions of ${rawInput}.` },
                { title: `${rawInput} - Deep Dive & Key Techniques`, description: `Detailed breakdown of underlying systems, formulas, and structural behavior.` },
                { title: `${rawInput} - Practical Implementation & Problem Solving`, description: `Hands-on examples, standard problems, and methodologies.` },
                { title: `${rawInput} - Common Pitfalls & Edge Cases`, description: `Frequent exam traps, misconceptions, and subtle points students miss.` },
                { title: `${rawInput} - Advanced Applications & Synthesis`, description: `High-level concepts, edge optimization, and comprehensive review.` },
              ]
        );

        setNewSubjectName('');
        setNewSubjectDesc('');
        setIsAddSubjectOpen(false);
      } catch (err: any) {
        console.warn('AI subject analysis fallback:', err);
        onCreateSubject(
          {
            name: rawInput,
            description: newSubjectDesc.trim() || `Course curriculum for ${rawInput}`,
            color: newSubjectColor,
            icon: 'BookOpen',
          },
          [
            { title: `${rawInput} - Fundamentals & Core Concepts`, description: `Introductory mechanisms and foundational definitions of ${rawInput}.` },
            { title: `${rawInput} - Deep Dive & Key Techniques`, description: `Detailed breakdown of underlying systems, formulas, and structural behavior.` },
            { title: `${rawInput} - Practical Implementation & Problem Solving`, description: `Hands-on examples, standard problems, and methodologies.` },
            { title: `${rawInput} - Common Pitfalls & Edge Cases`, description: `Frequent exam traps, misconceptions, and subtle points students miss.` },
            { title: `${rawInput} - Advanced Applications & Synthesis`, description: `High-level concepts, edge optimization, and comprehensive review.` },
          ]
        );
        setNewSubjectName('');
        setNewSubjectDesc('');
        setIsAddSubjectOpen(false);
      } finally {
        setIsAnalyzingSubject(false);
      }
    } else {
      onCreateSubject({
        name: rawInput,
        description: newSubjectDesc.trim() || 'Custom study subject',
        color: newSubjectColor,
        icon: 'BookOpen',
      });
      setNewSubjectName('');
      setNewSubjectDesc('');
      setIsAddSubjectOpen(false);
    }
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('topics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'topics'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Topics View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('subjects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'subjects'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Courses & Subjects ({subjects.length})
            </button>
          </div>

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

      {/* Courses & Subjects Dedicated Overview Mode */}
      {viewMode === 'subjects' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Courses & Subjects ({subjects.length})
              </h3>
              <p className="text-xs text-slate-500">
                Manage your academic curriculum, add topics, or delete subjects anytime.
              </p>
            </div>
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                No subjects found
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Add your first subject or course to start studying!
              </p>
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create First Subject</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => {
                const subTopics = topics.filter((t) => t.subjectId === sub.id);
                const subColor = (sub.color || 'indigo') as Subject['color'];
                const style = colorClasses[subColor] || colorClasses.indigo;
                const avgMastery =
                  subTopics.length > 0
                    ? Math.round(
                        subTopics.reduce((acc, t) => acc + t.masteryLevel, 0) / subTopics.length
                      )
                    : 0;

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {sub.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSubjectToDelete(sub)}
                          title={`Delete subject "${sub.name}"`}
                          className="px-2 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors border border-rose-200/60 dark:border-rose-900/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                        {sub.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sub.description || `Curriculum topics and materials for ${sub.name}`}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{subTopics.length} Study Topics</span>
                        <span>Avg Mastery: {avgMastery}%</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setViewMode('topics');
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <span>Explore Topics</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicSubjectId(sub.id);
                            setIsAddTopicOpen(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Topic</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Chips & Search Bar (Topics View) */}
      {viewMode === 'topics' && (
        <>
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
                  <div key={sub.id} className="relative group shrink-0 flex items-center">
                    <button
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(sub);
                        }}
                        title={`Delete subject "${sub.name}"`}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected
                            ? 'text-white/70 hover:text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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

          {/* Active Subject Banner Card when filtered */}
          {selectedSubjectId !== 'all' && (() => {
            const currentSub = subjects.find((s) => s.id === selectedSubjectId);
            if (!currentSub) return null;
            const subTopics = topics.filter((t) => t.subjectId === currentSub.id);
            const subColor = (currentSub.color || 'indigo') as Subject['color'];
            const style = colorClasses[subColor] || colorClasses.indigo;
            const avgMastery =
              subTopics.length > 0
                ? Math.round(
                    subTopics.reduce((acc, t) => acc + t.masteryLevel, 0) / subTopics.length
                  )
                : 0;

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {currentSub.name}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {subTopics.length} Topics
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Mastery: {avgMastery}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {currentSub.description || `Curriculum topics and materials for ${currentSub.name}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTopicSubjectId(currentSub.id);
                      setIsAddTopicOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubjectToDelete(currentSub)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title={`Delete subject "${currentSub.name}" and its topics`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Subject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSubjectId('all')}
                    className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Show All
                  </button>
                </div>
              </div>
            );
          })()}

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
                  : selectedSubjectId !== 'all'
                  ? 'No topics in this subject yet. Click "+ Add Topic" to create one!'
                  : 'Add your first topic to start generating AI explanations and flashcards!'}
              </p>
              <div className="flex items-center justify-center gap-2">
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
                {selectedSubjectId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const cur = subjects.find((s) => s.id === selectedSubjectId);
                      if (cur) setSubjectToDelete(cur);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Subject</span>
                  </button>
                )}
              </div>
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
        </>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add New Subject / Course
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter any subject or exam topic (e.g. <em>dsa in java</em>, <em>organic chemistry</em>). AI will automatically identify where it belongs and build your curriculum topics!
            </p>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject or Topic Query
                </label>
                <input
                  type="text"
                  required
                  disabled={isAnalyzingSubject}
                  placeholder="e.g. dsa in java, cellular biology, microeconomics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* AI Auto-generate Topics Checkbox */}
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateTopics}
                    onChange={(e) => setAutoGenerateTopics(e.target.checked)}
                    disabled={isAnalyzingSubject}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Auto-generate curriculum topics with AI</span>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      AI analyzes where this subject belongs (e.g. <em>dsa in java</em> → Computer Science) and automatically generates 5-8 structured topics.
                    </p>
                  </div>
                </label>
              </div>

              {isAnalyzingSubject && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Analyzing academic domain and building curriculum topics...</span>
                </div>
              )}

              {!autoGenerateTopics && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description (Optional)
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
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAnalyzingSubject}
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzingSubject || !newSubjectName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {isAnalyzingSubject ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Create Subject & Topics</span>
                  )}
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

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              Delete "{subjectToDelete.name}"?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Are you sure you want to permanently delete this course/subject?
            </p>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 mb-5 space-y-1.5">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                ⚠️ This will permanently remove:
              </p>
              <ul className="text-[11px] text-rose-600 dark:text-rose-400 space-y-1 list-disc list-inside">
                <li>
                  Course: <strong>{subjectToDelete.name}</strong>
                </li>
                <li>
                  <strong>
                    {topics.filter((t) => t.subjectId === subjectToDelete.id).length}
                  </strong>{' '}
                  study topic(s), Cornell notes, and diagrams
                </li>
                <li>All active recall flashcards and saved Q&A discussions under this course</li>
                <li>Will sync across all your connected devices</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSubject(subjectToDelete.id);
                  if (selectedSubjectId === subjectToDelete.id) {
                    setSelectedSubjectId('all');
                  }
                  setSubjectToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Subject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
