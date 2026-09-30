import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

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
  const model = 'gemini-3.6-flash';
  const maxRetries = 3;
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
      console.warn(`gemini-3.6-flash attempt ${attempt}/${maxRetries} error:`, errMsg);

      if (attempt < maxRetries) {
        // Exponential backoff for temporary spikes
        await new Promise((resolve) => setTimeout(resolve, attempt * 800));
      }
    }
  }

  throw lastError;
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

  // Explain endpoint
  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    try {
      const { topic, subject, level = 'standard', customApiKey } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      const ai = getGeminiClient(customApiKey);
      if (!ai) {
        return res.status(500).json({
          error: 'No Gemini API key configured. Please ensure GEMINI_API_KEY is configured or provide one in Settings.',
        });
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
      console.error('Error generating explanation:', error);
      return res.status(500).json({
        error: sanitizeErrorMessage(error),
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
        return res.status(500).json({
          error: 'No Gemini API key configured. Please provide an API key in Settings or environment.',
        });
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
      console.error('Error generating flashcards:', error);
      return res.status(500).json({
        error: sanitizeErrorMessage(error),
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
        return res.status(500).json({
          error: 'No Gemini API key configured.',
        });
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
      console.error('Error generating quiz:', error);
      return res.status(500).json({
        error: sanitizeErrorMessage(error),
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
        return res.status(500).json({
          error: 'No Gemini API key configured.',
        });
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
      console.error('Error in chat tutor:', error);
      return res.status(500).json({
        error: sanitizeErrorMessage(error),
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
