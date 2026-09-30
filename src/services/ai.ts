import { Flashcard, QuizQuestion, ChatMessage } from '../types';
import { incrementAiQuota, loadSettings } from './storage';

export interface ExplainParams {
  topic: string;
  subject?: string;
  level?: 'simple' | 'standard' | 'deep' | 'analogies';
}

export interface FlashcardsParams {
  topic: string;
  subject?: string;
  count?: number;
}

export interface QuizParams {
  topic: string;
  subject?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ChatParams {
  messages: { role: 'user' | 'model'; content: string }[];
  topic?: string;
  subject?: string;
}

export interface StudyPlanParams {
  goal: string;
  availableHours: string;
  topics: string[];
}

export class AIService {
  private static getCustomKey(): string | undefined {
    const settings = loadSettings();
    return settings.apiKey?.trim() || undefined;
  }

  static async generateExplanation(params: ExplainParams): Promise<string> {
    // Record AI request without imposing any upper limit
    incrementAiQuota();

    const response = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        customApiKey: this.getCustomKey(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate explanation');
    }

    return data.explanation;
  }

  static async generateFlashcards(params: FlashcardsParams): Promise<Omit<Flashcard, 'id' | 'topicId' | 'status' | 'reviewCount'>[]> {
    // Record AI request without imposing any upper limit
    incrementAiQuota();

    const response = await fetch('/api/ai/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        customApiKey: this.getCustomKey(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate flashcards');
    }

    return data.flashcards || [];
  }

  static async generateQuiz(params: QuizParams): Promise<QuizQuestion[]> {
    // Record AI request without imposing any upper limit
    incrementAiQuota();

    const response = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        customApiKey: this.getCustomKey(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate quiz');
    }

    return (data.questions || []).map((q: any, idx: number) => ({
      ...q,
      id: `quiz_q_${Date.now()}_${idx}`,
    }));
  }

  static async sendChatMessage(params: ChatParams): Promise<string> {
    // Record AI request without imposing any upper limit
    incrementAiQuota();

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        customApiKey: this.getCustomKey(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send chat message');
    }

    return data.reply;
  }

  static async generateStudyPlan(params: StudyPlanParams): Promise<string> {
    // Record AI request without imposing any upper limit
    incrementAiQuota();

    const response = await fetch('/api/ai/study-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        customApiKey: this.getCustomKey(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate study plan');
    }

    return data.plan;
  }
}
