import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const USERS_DATA_DIR = path.resolve(__dirname, 'data', 'users');
if (!fs.existsSync(USERS_DATA_DIR)) {
  try {
    fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data/users directory synchronously:', err);
  }
}

function getEmailFilePath(email: string): string {
  const safe = email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
  return path.join(USERS_DATA_DIR, `${safe}.json`);
}

function getHeuristicSubjectAnalysis(subjectInput: string) {
  const query = subjectInput.trim().toLowerCase();
  
  if (query.includes('dsa') || (query.includes('data structure') && query.includes('java')) || query === 'dsa in java') {
    return {
      name: 'Data Structures & Algorithms in Java',
      field: 'Computer Science & Software Engineering',
      description: 'Master core algorithmic thinking, computational complexity (Big-O), and essential data structures implemented in Java.',
      color: 'indigo',
      icon: 'Code',
      topics: [
        { title: 'Java Memory Model, Arrays & Dynamic ArrayLists', description: 'Internal memory layout, primitive vs reference types, contiguous allocation, and dynamic resizing mechanics in Java.' },
        { title: 'Singly & Doubly Linked Lists', description: 'Node reference chaining, pointer manipulation, cycle detection with Floyd’s algorithm, and list reversals.' },
        { title: 'Stacks, Queues & PriorityQueue Deque', description: 'LIFO and FIFO operations, call stack mechanics, monotonically increasing stacks, and heap-backed priority queues.' },
        { title: 'Binary Trees & Binary Search Trees (BST)', description: 'Tree anatomy, recursive traversals (Inorder, Preorder, Postorder), BST search invariant, insertion, and balancing fundamentals.' },
        { title: 'Hash Tables & HashMap Collision Resolution', description: 'Hashing functions, hashCode() and equals() contracts in Java, separate chaining, and load factor rehashing.' },
        { title: 'Graph Representations, BFS & DFS Traversals', description: 'Adjacency lists vs matrices, breadth-first search for shortest paths, and depth-first search with connected components.' },
        { title: 'Recursion, Backtracking & Dynamic Programming Memoization', description: 'Base cases, call stack unwinding, combinatorial permutations, overlapping subproblems, and optimal substructure.' },
        { title: 'Sorting & Binary Search (Quicksort & Mergesort)', description: 'Divide-and-conquer paradigms, dual-pivot quicksort in Java, and logarithmic interval bisection search.' }
      ]
    };
  }

  if (query.includes('dsa') || query.includes('data structure')) {
    return {
      name: 'Data Structures & Algorithms',
      field: 'Computer Science',
      description: 'Comprehensive curriculum covering foundational data structures and algorithm design patterns.',
      color: 'indigo',
      icon: 'Code',
      topics: [
        { title: 'Complexity Analysis & Big-O Notation', description: 'Time and space complexity bounds, asymptotic notation, and runtime profiling.' },
        { title: 'Linear Structures: Arrays, Lists & Queues', description: 'Contiguous vs linked structures, amortized complexity, and queue operations.' },
        { title: 'Trees, Heaps & Binary Search Trees', description: 'Hierarchical data representation, heap invariants, and balanced binary trees.' },
        { title: 'Hash Tables & Hash Functions', description: 'Key-value mapping, collision handling strategies, and dictionary lookups.' },
        { title: 'Graph Algorithms: BFS, DFS & Shortest Paths', description: 'Node traversals, topological sorting, and Dijkstra algorithm foundations.' },
        { title: 'Dynamic Programming & Greedy Strategies', description: 'Optimal substructure, memoization tables, and greedy decision policies.' }
      ]
    };
  }

  if (query.includes('java')) {
    return {
      name: 'Java Programming & Object-Oriented Design',
      field: 'Computer Science & Software Development',
      description: 'Master Java language fundamentals, JVM architecture, OOP design principles, and modern standard library patterns.',
      color: 'amber',
      icon: 'Cpu',
      topics: [
        { title: 'Java Syntax, JVM Architecture & Bytecode', description: 'Compilation lifecycle, JIT compiler, bytecode execution, and class loaders.' },
        { title: 'Object-Oriented Programming (OOP) Pillars', description: 'Encapsulation, inheritance, polymorphism, and abstraction with Java classes and interfaces.' },
        { title: 'Java Collections Framework (JCF)', description: 'List, Set, Map hierarchies, Iterators, and choosing the optimal collection type.' },
        { title: 'Exception Handling & Robust Resource Management', description: 'Checked vs unchecked exceptions, try-with-resources, and custom error types.' },
        { title: 'Concurrency, Threads & Synchronization', description: 'Thread lifecycle, synchronized blocks, volatile keywords, and ExecutorService.' },
        { title: 'Streams API & Functional Lambdas', description: 'Functional interfaces, map/filter/reduce pipelines, and collectors in modern Java.' }
      ]
    };
  }

  // Capitalize title
  const formattedTitle = subjectInput
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    name: formattedTitle,
    field: 'General Academic Studies',
    description: `Comprehensive study curriculum and progressive concept mastery for ${formattedTitle}.`,
    color: 'indigo',
    icon: 'BookOpen',
    topics: [
      { title: `${formattedTitle} - Core Principles & Foundations`, description: `Fundamental terminology, core concepts, and introductory mechanics of ${formattedTitle}.` },
      { title: `${formattedTitle} - Deep Dive & Key Mechanisms`, description: `Detailed breakdown of underlying systems, formulas, and structural behavior.` },
      { title: `${formattedTitle} - Practical Applications & Problem Solving`, description: `Real-world examples, standard problem types, and step-by-step methodologies.` },
      { title: `${formattedTitle} - Common Pitfalls & Edge Cases`, description: `Frequent misconceptions, exam traps, and subtle points students often miss.` },
      { title: `${formattedTitle} - Advanced Topics & Integration`, description: `Synthesis of high-level concepts, edge optimization, and comprehensive review.` }
    ]
  };
}

function getGeminiClient(customKey?: string) {
  const apiKey = (customKey && customKey.trim()) ? customKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateContentWithFallback(ai: GoogleGenAI, params: any) {
  const model = 'gemini-3.8-flash';
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || JSON.stringify(err);
      console.warn(`gemini-3.8-flash attempt ${attempt}/${maxRetries} error:`, errMsg);

      // If quota exceeded (429), break immediately to fallback rather than looping
      if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        break;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }
  }

  throw lastError;
}

function generateStructuredStudyNotes(topic: string, subject?: string, level: string = 'standard'): string {
  const isCodeOrCS = /java|python|c\+\+|dsa|data structure|algorithm|tree|graph|array|stack|queue|sort|hash|oop|sql|dbms|operating system|linux|git|web/i.test(`${topic} ${subject}`);
  const isMathOrPhysics = /calculus|algebra|physics|formula|equation|derivative|integral|vector|quantum|mechanics/i.test(`${topic} ${subject}`);

  let diagram = `\`\`\`diagram
[1. Input Constraints & Setup] --> [2. Invariant Validation]
[2. Invariant Validation] --> [3. Deterministic State Processing]
[3. Deterministic State Processing] --> [4. Output / Post-Condition Verification]
\`\`\``;

  if (isCodeOrCS) {
    if (/tree|bst/i.test(topic)) {
      diagram = `\`\`\`diagram
        [Root: 50]
       /          \\
   [Left: 30]    [Right: 70]
   /        \\    /         \\
[20]       [40] [60]       [80]
\`\`\``;
    } else if (/linked list/i.test(topic)) {
      diagram = `\`\`\`diagram
[Head: 10] --> [Node: 20] --> [Node: 30] --> [Tail: 40] --> [null]
\`\`\``;
    } else if (/stack/i.test(topic)) {
      diagram = `\`\`\`diagram
[Top Element] (Push/Pop in O(1))
[Middle Element]
[Bottom Element] (Base of Stack)
\`\`\``;
    } else if (/queue/i.test(topic)) {
      diagram = `\`\`\`diagram
[Enqueue -> Rear] --> [Element 2] --> [Element 1] --> [Dequeue -> Front]
\`\`\``;
    }
  }

  let codeBlock = '';
  if (isCodeOrCS) {
    codeBlock = `\`\`\`java
// Standard Implementation & Mechanics for ${topic}
public class ${topic.replace(/[^a-zA-Z0-9]/g, '') || 'Solution'} {
    public static void main(String[] args) {
        System.out.println("Executing ${topic} Demonstration...");
        // 1. Initialize data & verify boundaries
        // 2. Execute operations with guaranteed time/space complexity
        // 3. Maintain structural invariants
    }

    // Time Complexity: O(log N) or O(N) depending on operation
    // Space Complexity: O(1) auxiliary space
    public boolean process(${topic.includes('Tree') ? 'TreeNode root' : 'int[] data'}) {
        if (data == null) return false;
        // Core algorithmic logic here
        return true;
    }
}
\`\`\``;
  } else if (isMathOrPhysics) {
    codeBlock = `Key Relationship & Governing Invariant:
$$\\Delta S \\ge 0 \\quad \\text{and} \\quad \\lim_{x \\to a} f(x) = L$$
Fundamental Theorem:
$$\\int_{a}^{b} f'(x) dx = f(b) - f(a)$$`;
  } else {
    codeBlock = `| Component | Analytical Function | Systemic Impact |
| :--- | :--- | :--- |
| **Foundation** | Core theoretical framework | Establishes operational boundaries |
| **Mechanism** | Active procedural execution | Produces predictable state changes |
| **Validation** | Post-condition verification | Assures long-term integrity |`;
  }

  return `## 📌 Note Overview & Core Concept
- **${topic}** represents an essential concept within **${subject || 'this course'}**.
- It provides a structured methodology to organize information, preserve invariants, and optimize performance.
- Deeply understanding this mechanism is critical for exams, technical interviews, and real-world system architecture.

## 📊 Concept Diagram & Flowchart
${diagram}

## 💡 Core Principles & Step-by-Step Breakdown
1. **Foundational Definition**: The core mechanism operates by establishing clear boundaries, state invariants, and predictable transition rules.
2. **Operational Workflow**:
   - **Step 1 (Initialization)**: Validate constraints and guard against empty, boundary, or null conditions.
   - **Step 2 (Transformation)**: Apply the systematic step-by-step logic or recursive decomposition.
   - **Step 3 (Post-Condition)**: Verify structural invariants and guarantee deterministic output.
3. **Efficiency & Complexity**: Minimizing redundant operations ensures optimal scalability across increasing problem sizes.

## 💻 Code Implementation or Formula
${codeBlock}

## 🖼️ Visual Mental Model & Concept Picture
![Concept Illustration for ${topic}](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80)
*Visual representation: Systematic organization and structured flow applied to ${topic}.*

## 🌟 Real-World Analogy & Mental Model
Think of **${topic}** like an organized library catalogue or assembly line: each item has an exact predictable location and contract. Rather than scanning every single item at random, the structure allows immediate, deterministic access with minimal effort.

## ⚠️ Common Pitfalls & Exam Traps
- **Ignoring Boundary & Null Cases**: Forgetting to check initial empty or edge inputs before proceeding into main execution.
- **Off-By-One Errors**: Confusing zero-indexed intervals or inclusive vs exclusive boundaries.
- **Overlooking Complexity Tradeoffs**: Assuming faster runtime without accounting for auxiliary memory allocation.

## 📝 Quick Self-Check Challenge
What is the primary operational invariant that must be maintained throughout ${topic}?
> **Answer:** The system must maintain consistent state ordering and valid structural links at every mutation step to prevent corruption or undefined behavior.`;
}

function generateStructuredFlashcards(topic: string, subject?: string, count: number = 6) {
  const cards = [
    {
      question: `What is the core definition and primary goal of ${topic}?`,
      answer: `${topic} provides a structured mechanism to organize data, enforce invariants, and achieve predictable execution in ${subject || 'its domain'}.`,
      hint: 'Think about its main purpose and the problem it was designed to solve.',
      difficulty: 'easy'
    },
    {
      question: `What is the key invariant or rule that must always hold true in ${topic}?`,
      answer: 'All state transitions must preserve valid structural integrity and prevent out-of-bounds or inconsistent referencing.',
      hint: 'Consider what condition breaks if an invalid update is made.',
      difficulty: 'medium'
    },
    {
      question: `What is the typical time complexity or operational cost associated with ${topic}?`,
      answer: 'Standard search or traversal runs in O(log N) to O(N) time, while direct localized updates typically achieve O(1) amortized cost.',
      hint: 'Recall the asymptotic upper bound in typical use cases.',
      difficulty: 'medium'
    },
    {
      question: `What is a common edge case or pitfall students encounter with ${topic}?`,
      answer: 'Failing to handle null/empty states, boundary offsets, or off-by-one indices leading to runtime exceptions or memory leaks.',
      hint: 'Think about what happens with an empty input or boundary element.',
      difficulty: 'hard'
    },
    {
      question: `How does ${topic} compare to its closest alternative?`,
      answer: 'It balances memory overhead against access speed, providing faster lookups at the cost of requiring structural maintenance.',
      hint: 'Evaluate the tradeoff between space and speed.',
      difficulty: 'medium'
    },
    {
      question: `In practical real-world production, where is ${topic} most commonly applied?`,
      answer: 'High-throughput caching, database indexing, system schedulers, and compiler symbol tables where predictable latency is essential.',
      hint: 'Think of systems where fast lookup and ordering are paramount.',
      difficulty: 'hard'
    }
  ];

  return cards.slice(0, count);
}

function generateStructuredQuiz(topic: string, subject?: string, count: number = 5, difficulty: string = 'medium') {
  return [
    {
      id: `quiz_q_1`,
      question: `Which of the following best describes the primary purpose of ${topic}?`,
      options: [
        `Enforcing deterministic structure, consistent invariants, and optimal access operations.`,
        `Allowing arbitrary unstructured data storage without indexing or constraints.`,
        `Completely eliminating the need for computational memory allocation.`,
        `Restricting operations exclusively to compile-time static constants.`
      ],
      correctOptionIndex: 0,
      explanation: `${topic} is fundamentally designed to provide deterministic structure, invariant guarantees, and optimal access or processing guarantees.`
    },
    {
      id: `quiz_q_2`,
      question: `When analyzing the runtime performance of ${topic}, what is the most critical factor?`,
      options: [
        `The physical screen resolution of the host machine.`,
        `The number of elements N and the asymptotic Big-O growth rate of operations.`,
        `The programming language variable naming length.`,
        `The operating system desktop wallpaper color theme.`
      ],
      correctOptionIndex: 1,
      explanation: `Asymptotic analysis (Big-O) measures how execution time and space scale as input size N grows.`
    },
    {
      id: `quiz_q_3`,
      question: `What is the most frequent misconception or bug when implementing ${topic}?`,
      options: [
        `Assuming operations have zero memory overhead and failing to handle empty/null boundaries.`,
        `Writing too many explanatory comments in the source code.`,
        `Using standard integer data types for loop counters.`,
        `Executing code on a multi-core processor.`
      ],
      correctOptionIndex: 0,
      explanation: `Edge conditions, null pointers, and unbounded memory consumption are the most common points of failure.`
    },
    {
      id: `quiz_q_4`,
      question: `In which practical scenario would ${topic} be preferred over a naive sequential approach?`,
      options: [
        `When data size is exactly 1 element and never changes.`,
        `When frequent lookups, updates, or ordering must scale efficiently across large datasets.`,
        `When no memory or CPU cycles are allowed to be utilized.`,
        `Only when printing plain text strings to the command line console.`
      ],
      correctOptionIndex: 1,
      explanation: `Structured paradigms demonstrate their superiority when datasets grow large and require high-frequency retrieval and updates.`
    },
    {
      id: `quiz_q_5`,
      question: `How does ${topic} maintain its structural integrity during dynamic updates?`,
      options: [
        `By re-verifying and updating references and invariants after every mutation.`,
        `By rebooting the entire operating system on every write.`,
        `By discarding all historical data whenever a new item arrives.`,
        `By converting all variables into unmanaged global pointers.`
      ],
      correctOptionIndex: 0,
      explanation: `Integrity is preserved by localized re-balancing, pointer updates, or invariant validations on each mutation.`
    }
  ].slice(0, count);
}

function generateStructuredChatReply(topic: string, subject?: string, messages: any[] = []): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  return `Great question regarding **${topic}**! 

When considering: *"${lastMsg}"*, the key principle to keep in mind is how the underlying mechanism enforces its invariants. 

1. **Core Mechanism**: In ${topic}, state is governed by predictable contracts that balance retrieval speed with maintenance overhead.
2. **Practical Tip**: Always verify the base conditions first before executing recursive or looping operations.
3. **Try this next**: Test your understanding by checking how this behaves when the input is empty or contains duplicate elements!`;
}

function sanitizeErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {}
  return msg;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Status check
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      defaultModel: 'gemini-3.6-flash',
    });
  });

  // Get synced user study progression by email
  app.get('/api/user-data', async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email query parameter is required' });
      }
      const filePath = getEmailFilePath(email);
      if (!fs.existsSync(filePath)) {
        return res.json({ exists: false, email: email.trim().toLowerCase() });
      }
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return res.json({ exists: true, email: email.trim().toLowerCase(), data });
    } catch (err: any) {
      console.error('Error reading user data:', err);
      return res.status(500).json({ error: 'Failed to read user data' });
    }
  });

  // Save synced user study progression by email
  app.post('/api/user-data', async (req: Request, res: Response) => {
    try {
      const { email, subjects, topics, flashcards, quizAttempts, studySessions, settings } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
      }
      await fs.promises.mkdir(USERS_DATA_DIR, { recursive: true });
      const filePath = getEmailFilePath(email);
      const payload = {
        email: email.trim().toLowerCase(),
        updatedAt: Date.now(),
        subjects: subjects || [],
        topics: topics || [],
        flashcards: flashcards || [],
        quizAttempts: quizAttempts || [],
        studySessions: studySessions || [],
        settings: settings || {},
      };
      await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({ status: 'ok', updatedAt: payload.updatedAt });
    } catch (err: any) {
      console.error('Error saving user data:', err);
      return res.status(500).json({ error: 'Failed to save user data' });
    }
  });

  // Analyze subject domain & automatically generate progressive curriculum topics
  app.post('/api/ai/analyze-subject', async (req: Request, res: Response) => {
    const { subjectInput, customApiKey } = req.body;
    if (!subjectInput || !subjectInput.trim()) {
      return res.status(400).json({ error: 'Subject input is required' });
    }

    try {
      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        // Fallback to high-yield heuristic analysis if no key configured
        return res.json(getHeuristicSubjectAnalysis(subjectInput));
      }

      const prompt = `The user wants to study: "${subjectInput}".
Analyze this subject query. Identify where this subject belongs (e.g. "dsa in java" belongs to Computer Science & Software Engineering, and standardizes to "Data Structures & Algorithms in Java").
Provide:
1. Canonical standardized name (e.g. "Data Structures & Algorithms in Java").
2. Field or parent domain (e.g. "Computer Science & Engineering").
3. Concise, compelling subject description explaining what will be mastered.
4. Accent color theme (choose exactly one of: 'indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'blue').
5. Lucide icon name (choose one of: 'Cpu', 'Brain', 'BookOpen', 'Dna', 'Code', 'Atom', 'Calculator', 'Globe', 'Compass', 'Layers').
6. Automatically generate a sequence of 6 to 8 progressive, structured study topics covering this subject from foundational to advanced.
Each topic must have:
- title: Short, crisp concept or chapter title (e.g. "Binary Search Trees & BST Invariants")
- description: 1-2 sentences highlighting what core mechanics and questions will be learned.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite academic curriculum designer and pedagogical expert who structures world-class university study paths.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Standardized canonical title of the subject' },
              field: { type: Type.STRING, description: 'Academic field or parent domain' },
              description: { type: Type.STRING, description: 'Engaging, concise overview of this course or domain' },
              color: { type: Type.STRING, description: 'One of: indigo, emerald, amber, rose, violet, cyan, blue' },
              icon: { type: Type.STRING, description: 'Lucide icon name' },
              topics: {
                type: Type.ARRAY,
                description: '6 to 8 progressive curriculum topics for this subject',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Topic title' },
                    description: { type: Type.STRING, description: 'Brief description of concepts covered in this topic' },
                  },
                  required: ['title', 'description'],
                },
              },
            },
            required: ['name', 'field', 'description', 'color', 'topics'],
          },
        },
      });

      let result = null;
      try {
        result = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error('Failed to parse subject analysis JSON:', e);
      }

      if (!result || !result.name || !result.topics || result.topics.length === 0) {
        result = getHeuristicSubjectAnalysis(subjectInput);
      }

      return res.json(result);
    } catch (error: any) {
      console.warn('Error analyzing subject via Gemini, using heuristic curriculum fallback:', error);
      return res.json(getHeuristicSubjectAnalysis(subjectInput));
    }
  });

  // Explain endpoint
  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    try {
      const { topic, subject, level = 'standard', customApiKey } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.json({ explanation: generateStructuredStudyNotes(topic, subject, level) });
      }

      const depthGuidance = {
        simple: 'Explain this like I am 12 years old (ELI5). Use clear, everyday language, intuitive analogies, and avoid heavy jargon.',
        standard: 'Provide a clear, high-school to early-college level explanation with fundamental concepts, mechanics, and realistic examples.',
        deep: 'Provide a rigorous, in-depth academic breakdown including edge cases, theoretical underpinnings, and mathematical or systemic mechanisms.',
        analogies: 'Explain this topic almost entirely through clever, memorable real-world metaphors and analogies.',
      }[level as 'simple' | 'standard' | 'deep' | 'analogies'] || 'Provide a clear, accessible educational explanation.';

      const systemInstruction = `You are Study Buddy's world-class personalized AI educator and master study-note creator.
Your task is to teach the user the requested topic with engaging clarity, high pedagogical rigor, and beautifully organized student notes.
Never output a plain, boring wall of text. Always structure your response as clear Cornell/Notion-style study notes using headers (##), bold keywords, bullet points, callout cards, diagrams, code blocks (when relevant), and visual illustrations.`;

      const prompt = `Topic: "${topic}"
Subject Context: "${subject || 'General Studies'}"
Target Depth: ${depthGuidance}

Please produce a comprehensive, structured Study Note containing the following sections:

## 📌 Note Overview & Core Concept
- 2-3 clear, impactful sentences defining the concept and why it matters.

## 📊 Concept Diagram & Flowchart
- Provide a clean visual diagram or flowchart inside a \`\`\`diagram or \`\`\`mermaid code block illustrating how the process, data flow, or components work (e.g., [Step 1: Input] --> [Step 2: Processing] --> [Step 3: Output]).

## 💡 Core Principles & Step-by-Step Breakdown
- Key mechanisms broken down with numbered notes, bold terms, and clear explanations.

## 💻 Code Implementation or Formula
- If this topic touches Computer Science, Coding, Math, Physics, Chemistry, Data Science, or Engineering: provide a clean, practical, well-commented code block with language identifier (e.g. \`\`\`python, \`\`\`typescript, \`\`\`sql) or mathematical formula.
- If it is Humanities, History, or Literature: provide a clear chronological timeline or structured comparison table instead.

## 🖼️ Visual Mental Model & Concept Picture
- Include an educational illustration or real-world picture representation using Markdown image format:
![Concept Illustration for ${topic}](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80)
accompanied by a short 1-2 sentence caption explaining what the visual represents.

## 🌟 Real-World Analogy & Mental Model
- A vivid, memorable everyday analogy that makes the mechanism intuitive.

## ⚠️ Common Pitfalls & Exam Traps
- 2-3 specific mistakes, edge cases, or misconceptions students commonly make.

## 📝 Quick Self-Check Challenge
- A diagnostic question testing comprehension, with the answer formatted as:
> **Answer:** [Explanation of the answer]`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ explanation: response.text });
    } catch (error: any) {
      console.warn('Error generating explanation with AI, falling back to structured generator:', error);
      const { topic, subject, level = 'standard' } = req.body;
      return res.json({
        explanation: generateStructuredStudyNotes(topic || 'Study Topic', subject, level),
      });
    }
  });

  // Flashcards generator endpoint
  app.post('/api/ai/flashcards', async (req: Request, res: Response) => {
    try {
      const { topic, subject, count = 6, customApiKey } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.json({ flashcards: generateStructuredFlashcards(topic, subject, count) });
      }

      const prompt = `Generate exactly ${count} high-yield study flashcards for the topic "${topic}" (Subject: "${subject || 'General'}").
Each flashcard must test a distinct, high-impact concept, definition, relationship, or problem.
Front should be a concise question or prompt.
Back should be an accurate, memorable explanation (1-3 sentences max).
Include a helpful one-sentence hint.
Assign difficulty: 'easy', 'medium', or 'hard'.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert exam prep tutor creating top-tier active recall flashcards.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Question or prompt for the front of the flashcard' },
                answer: { type: Type.STRING, description: 'Clear, concise correct answer for the back' },
                hint: { type: Type.STRING, description: 'A helpful hint to nudge recall' },
                difficulty: { type: Type.STRING, description: 'Difficulty level: easy, medium, or hard' },
              },
              required: ['question', 'answer'],
            },
          },
        },
      });

      let flashcards = [];
      try {
        flashcards = JSON.parse(response.text || '[]');
      } catch (e) {
        console.error('Failed to parse flashcards JSON:', e);
      }

      return res.json({ flashcards });
    } catch (error: any) {
      console.warn('Error generating flashcards with AI, falling back to structured generator:', error);
      const { topic, subject, count = 6 } = req.body;
      return res.json({
        flashcards: generateStructuredFlashcards(topic || 'Study Topic', subject, count),
      });
    }
  });

  // Quiz generator endpoint
  app.post('/api/ai/quiz', async (req: Request, res: Response) => {
    try {
      const { topic, subject, count = 5, difficulty = 'medium', customApiKey } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.json({ questions: generateStructuredQuiz(topic, subject, count, difficulty) });
      }

      const prompt = `Generate a ${count}-question multiple choice quiz on the topic "${topic}" (Subject: "${subject || 'General'}").
Target Difficulty: ${difficulty}.
For each question:
- Provide 4 distinct, plausible answer choices in the options array.
- Specify the correctOptionIndex (0, 1, 2, or 3) indicating which option is correct.
- Provide a clear, educational explanation explaining why the correct answer is right and why distractors are wrong.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an educational assessment expert writing fair, diagnostic multiple choice quizzes.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'The question text' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Four answer choices',
                },
                correctOptionIndex: {
                  type: Type.INTEGER,
                  description: 'Zero-based index of correct option (0-3)',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Pedagogical explanation for the correct answer',
                },
              },
              required: ['question', 'options', 'correctOptionIndex', 'explanation'],
            },
          },
        },
      });

      let questions = [];
      try {
        questions = JSON.parse(response.text || '[]');
      } catch (e) {
        console.error('Failed to parse quiz JSON:', e);
      }

      return res.json({ questions });
    } catch (error: any) {
      console.warn('Error generating quiz with AI, falling back to structured generator:', error);
      const { topic, subject, count = 5, difficulty = 'medium' } = req.body;
      return res.json({
        questions: generateStructuredQuiz(topic || 'Study Topic', subject, count, difficulty),
      });
    }
  });

  // Chat tutor endpoint
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { messages, topic, subject, customApiKey } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.json({ reply: generateStructuredChatReply(topic, subject, messages) });
      }

      const systemInstruction = `You are Study Buddy's interactive Socratic AI tutor.
Current Subject: "${subject || 'General'}"
Current Topic: "${topic || 'General Studies'}"

Tutor Guidelines:
1. Be encouraging, concise, and pedagogically sound.
2. Answer the user's question directly with clear explanations, analogies, code snippets, or bullet points.
3. NEW TOPIC DETECTION:
If the user asks about a new topic, related concept, or adjacent area that is different from or extends beyond "${topic}" (or asks "Can we learn about X?", "What is Y?", "Can you add X?"):
- Provide a clear, insightful answer.
- At the very end of your response on a new line, output this exact tag:
[SUGGESTED_NEW_TOPIC: <Title of the New Topic> | <1-sentence description of the topic>]
Example:
[SUGGESTED_NEW_TOPIC: AVL Tree Rotations | Self-balancing binary search trees using single and double rotation operations.]
4. Use clean Markdown for mathematical expressions, code, and bold concepts.`;

      // Convert messages for Gemini
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const response = await generateContentWithFallback(ai, {
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ reply: response.text });
    } catch (error: any) {
      console.warn('Error in chat tutor with AI, falling back to structured generator:', error);
      const { topic, subject, messages = [] } = req.body;
      return res.json({
        reply: generateStructuredChatReply(topic || 'Study Topic', subject, messages),
      });
    }
  });

  // Study Plan Generator
  app.post('/api/ai/study-plan', async (req: Request, res: Response) => {
    try {
      const { goal, availableHours, topics, customApiKey } = req.body;
      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(500).json({ error: 'No Gemini API key configured.' });
      }

      const prompt = `Create an actionable, high-efficiency study plan.
Goal: ${goal || 'Master study topics'}
Time Available: ${availableHours || '5'} hours per week
Topics to Cover: ${Array.isArray(topics) ? topics.join(', ') : 'Current subjects'}

Provide:
1. 🎯 Weekly Milestone Breakdown
2. ⏱️ Recommended Daily Routine with Pomodoro blocks
3. 🧠 Active Recall & Spaced Repetition Schedule
4. 💡 Pro tips for maximum retention`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an academic productivity coach specializing in evidence-based study techniques.',
        },
      });

      return res.json({ plan: response.text });
    } catch (error: any) {
      console.error('Error generating study plan:', error);
      return res.status(500).json({ error: sanitizeErrorMessage(error) });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Study Buddy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
