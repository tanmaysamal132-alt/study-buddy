import { Subject, Topic, Flashcard, QuizAttempt, StudySession, UserSettings } from '../types';
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL } from './supabase';

const STORAGE_KEYS = {
  SUBJECTS: 'studybuddy_subjects_v1',
  TOPICS: 'studybuddy_topics_v1',
  FLASHCARDS: 'studybuddy_flashcards_v1',
  QUIZ_ATTEMPTS: 'studybuddy_quiz_attempts_v1',
  STUDY_SESSIONS: 'studybuddy_study_sessions_v1',
  SETTINGS: 'studybuddy_settings_v1',
};

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_cs',
    name: 'Computer Science',
    description: 'Core computing concepts, algorithms, and data structures.',
    color: 'indigo',
    icon: 'Cpu',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'sub_bio',
    name: 'Biological Sciences',
    description: 'Cell biology, genetics, physiology, and ecosystems.',
    color: 'emerald',
    icon: 'Dna',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'sub_hist',
    name: 'World History',
    description: 'Modern revolutions, geopolitical shifts, and economic eras.',
    color: 'amber',
    icon: 'BookOpen',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'sub_psych',
    name: 'Cognitive Psychology',
    description: 'Memory models, learning theories, and behavioral science.',
    color: 'violet',
    icon: 'Brain',
    createdAt: Date.now() - 86400000 * 2,
  },
];

const INITIAL_TOPICS: Topic[] = [
  {
    id: 'top_dsa_trees',
    subjectId: 'sub_cs',
    title: 'Binary Search Trees & Balancing',
    description: 'Binary trees, traversal orders, and self-balancing BST mechanisms (AVL/Red-Black).',
    masteryLevel: 75,
    lastStudiedAt: Date.now() - 3600000 * 4,
    explanationCache: {
      standard: `## 📌 Note Overview & Core Concept
A **Binary Search Tree (BST)** is a hierarchical node-based data structure where each node holds at most two children. The defining invariant is that every key in the left subtree is strictly less than the node's key, and every key in the right subtree is strictly greater. Self-balancing variations (like AVL and Red-Black trees) perform tree rotations to guarantee O(log n) time complexity for search, insertion, and deletion.

## 📊 Concept Diagram & Flowchart
\`\`\`diagram
[Root Node: 50] --> [Search Key X]
[Search Key X < 50] --> [Traverse Left Subtree: 25] --> [Leaf Node: 10]
[Search Key X > 50] --> [Traverse Right Subtree: 75] --> [Target Found: 75]
\`\`\`

## 💡 Core Principles & Step-by-Step Breakdown
1. **Search Invariant**: At node \`k\`, searching for \`x\`: if \`x < k\`, branch left; if \`x > k\`, branch right; if \`x == k\`, found!
2. **Tree Rotations**: When subtrees become skewed (unbalanced), left or right rotations re-distribute node height without violating in-order traversal properties.
3. **In-order Traversal**: Visiting (Left, Root, Right) traverses a BST in sorted ascending order.
4. **Worst-Case Trap**: An un-balanced BST inserted with sorted data degrades into a linked list with O(n) search time.

## 💻 Code Implementation or Formula
\`\`\`python
class TreeNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, key):
        """Insert a key while maintaining the BST invariant."""
        def _insert(node, key):
            if not node:
                return TreeNode(key)
            if key < node.key:
                node.left = _insert(node.left, key)
            elif key > node.key:
                node.right = _insert(node.right, key)
            return node
        self.root = _insert(self.root, key)

    def search(self, key):
        """O(log n) average time search in a balanced BST."""
        curr = self.root
        while curr and curr.key != key:
            if key < curr.key:
                curr = curr.left
            else:
                curr = curr.right
        return curr is not None
\`\`\`

## 🖼️ Visual Mental Model & Concept Picture
![Binary Search Tree and Memory Hierarchy](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80)
Binary search trees partition the data space in half at every decision point, forming a symmetric branching structure.

## 🌟 Real-World Analogy & Mental Model
Think of a BST like a high-speed guessing game of *"Is the number higher or lower?"*. Starting in the middle of a phonebook or dictionary, every flip cuts the remaining search space in half. Tree rotations act like a shelf organizer shifting heavy books so no single stack tips over.

## ⚠️ Common Pitfalls & Exam Traps
- **Myth**: A balanced tree must have all leaves on the exact same depth.
- **Truth**: AVL trees allow a height difference of at most 1 between left and right subtrees. Red-Black trees allow paths to differ in length by up to a factor of 2 while still preserving O(log n) bound.
- **Sorted Input Trap**: Inserting sorted keys [1, 2, 3, 4, 5] into a standard BST causes degenerate O(n) linked-list behavior unless self-balancing rotations are used.

## 📝 Quick Self-Check Challenge
What is the worst-case search time of an unbalanced BST, and how do AVL/Red-Black trees solve this?
> **Answer:** An unbalanced BST degrades to O(n) if inserted in sorted order (linear chain). AVL and Red-Black trees perform O(1) pointer rotations after insert/delete to maintain balanced height, guaranteeing O(log n) search time.`,
    },
  },
  {
    id: 'top_cellular_resp',
    subjectId: 'sub_bio',
    title: 'Cellular Respiration & ATP Synthase',
    description: 'Glycolysis, the Krebs cycle, electron transport chain, and chemiosmosis.',
    masteryLevel: 60,
    lastStudiedAt: Date.now() - 86400000,
  },
  {
    id: 'top_industrial_rev',
    subjectId: 'sub_hist',
    title: 'The Industrial Revolution (1760-1840)',
    description: 'Steam power, textile mechanization, urbanization, and socioeconomic impacts.',
    masteryLevel: 85,
    lastStudiedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'top_memory_models',
    subjectId: 'sub_psych',
    title: 'Spaced Repetition & The Forgetting Curve',
    description: 'Ebbinghaus curve, retrieval practice, synaptic consolidation, and interval spacing.',
    masteryLevel: 90,
    lastStudiedAt: Date.now() - 3600000 * 2,
  },
];

const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc_1',
    topicId: 'top_dsa_trees',
    question: 'What is the average time complexity of searching a balanced BST with n elements?',
    answer: 'O(log n) — because each comparison halves the remaining search space.',
    hint: 'Think about halving the tree at each level.',
    difficulty: 'easy',
    status: 'mastered',
    reviewCount: 3,
  },
  {
    id: 'fc_2',
    topicId: 'top_dsa_trees',
    question: 'What happens to an unbalanced BST if items are inserted in strictly ascending sorted order?',
    answer: 'It degenerates into a singly linked list with O(n) search, insert, and delete complexity.',
    hint: 'Every new node will continually be added to the right.',
    difficulty: 'medium',
    status: 'learning',
    reviewCount: 1,
  },
  {
    id: 'fc_3',
    topicId: 'top_dsa_trees',
    question: 'Which traversal algorithm prints the elements of a BST in ascending sorted order?',
    answer: 'In-order traversal: Left subtree -> Current Node -> Right subtree.',
    hint: 'It processes left, node, then right.',
    difficulty: 'easy',
    status: 'mastered',
    reviewCount: 4,
  },
  {
    id: 'fc_4',
    topicId: 'top_dsa_trees',
    question: 'What is the balance factor in an AVL tree, and what is its valid range?',
    answer: 'Balance factor is height(Left Subtree) - height(Right Subtree). In AVL trees it must be -1, 0, or +1.',
    hint: 'The height difference between left and right cannot exceed 1.',
    difficulty: 'hard',
    status: 'learning',
    reviewCount: 2,
  },
  {
    id: 'fc_5',
    topicId: 'top_cellular_resp',
    question: 'Where does glycolysis take place within a eukaryotic cell?',
    answer: 'In the cytoplasm (cytosol), outside of the mitochondria.',
    hint: 'It is the only stage of cellular respiration that does not occur in mitochondria.',
    difficulty: 'easy',
    status: 'learning',
    reviewCount: 2,
  },
  {
    id: 'fc_6',
    topicId: 'top_cellular_resp',
    question: 'What is the final electron acceptor in the mitochondrial electron transport chain?',
    answer: 'Molecular oxygen (O2), which combines with protons to form water (H2O).',
    hint: 'The gas humans inhale continuously.',
    difficulty: 'medium',
    status: 'learning',
    reviewCount: 1,
  },
  {
    id: 'fc_7',
    topicId: 'top_memory_models',
    question: 'Who first mathematically formulated the Forgetting Curve in 1885?',
    answer: 'Hermann Ebbinghaus, demonstrating exponential decay of memory retention over time.',
    hint: 'A German experimental psychologist.',
    difficulty: 'medium',
    status: 'mastered',
    reviewCount: 5,
  },
];

const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 'sess_1',
    topicId: 'top_dsa_trees',
    topicTitle: 'Binary Search Trees & Balancing',
    durationMinutes: 25,
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'sess_2',
    topicId: 'top_cellular_resp',
    topicTitle: 'Cellular Respiration & ATP Synthase',
    durationMinutes: 25,
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'sess_3',
    topicId: 'top_memory_models',
    topicTitle: 'Spaced Repetition & The Forgetting Curve',
    durationMinutes: 30,
    date: new Date().toISOString().slice(0, 10),
    timestamp: Date.now() - 3600000,
  },
];

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
  saveSubjects(INITIAL_SUBJECTS);
  return INITIAL_SUBJECTS;
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
    if (raw) {
      const parsed: Topic[] = JSON.parse(raw);
      // Migrate sample BST topic if it contains the old plain format
      const bst = parsed.find((t) => t.id === 'top_dsa_trees');
      if (
        bst &&
        (!bst.explanationCache?.standard?.includes('```diagram') ||
          !bst.explanationCache?.standard?.includes('```python'))
      ) {
        bst.explanationCache = INITIAL_TOPICS[0].explanationCache;
        saveTopics(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load topics:', e);
  }
  saveTopics(INITIAL_TOPICS);
  return INITIAL_TOPICS;
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
  saveFlashcards(INITIAL_FLASHCARDS);
  return INITIAL_FLASHCARDS;
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
  saveStudySessions(INITIAL_SESSIONS);
  return INITIAL_SESSIONS;
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

export function resetToSampleData(): void {
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
  localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(INITIAL_TOPICS));
  localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(INITIAL_FLASHCARDS));
  localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(INITIAL_SESSIONS));
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
}
