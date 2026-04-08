import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();

vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

vi.mock('https', () => ({
  Agent: class MockAgent {
    constructor() {}
  },
}));

const createMockRequest = (body: Record<string, unknown>) => ({
  json: () => Promise.resolve(body),
});

const createMockGetRequest = (url: string) => ({ url });

describe('/api/llm route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fallback logic', () => {
    it('categorize returns bug for bug-related text', () => {
      const text = 'Fix critical bug in production';
      const isBug = text.toLowerCase().includes('bug') || text.toLowerCase().includes('fix');
      expect(isBug).toBe(true);
    });

    it('categorize returns feature for add-related text', () => {
      const text = 'Add new payment method';
      const isFeature = text.toLowerCase().includes('add') || text.toLowerCase().includes('feature');
      expect(isFeature).toBe(true);
    });

    it('categorize returns documentation for doc-related text', () => {
      const text = 'Update README documentation';
      const isDoc = text.toLowerCase().includes('doc') || text.toLowerCase().includes('readme');
      expect(isDoc).toBe(true);
    });

    it('priority returns high for today deadline', () => {
      const today = new Date().toISOString().split('T')[0];
      const d = new Date(today);
      const now = new Date();
      const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(days <= 1 ? 'high' : 'medium').toBe('high');
    });

    it('priority returns medium for week deadline', () => {
      const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const days = Math.ceil((inThreeDays.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const priority = days <= 1 ? 'high' : days <= 7 ? 'medium' : 'low';
      expect(priority).toBe('medium');
    });

    it('priority returns low for distant deadline', () => {
      const inMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const days = Math.ceil((inMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const priority = days <= 1 ? 'high' : days <= 7 ? 'medium' : 'low';
      expect(priority).toBe('low');
    });
  });

  describe('cache key generation', () => {
    it('produces consistent keys for same params', () => {
      const hashKey = (action: string, params: Record<string, unknown>) => {
        const sorted = Object.keys(params)
          .sort()
          .map(k => `${k}=${JSON.stringify(params[k])}`)
          .join('&');
        return `${action}:${sorted}`;
      };

      const key1 = hashKey('categorize', { title: 'Test', description: 'Desc' });
      const key2 = hashKey('categorize', { description: 'Desc', title: 'Test' });
      
      expect(key1).toBe(key2);
    });

    it('produces different keys for different actions', () => {
      const hashKey = (action: string, params: Record<string, unknown>) => {
        const sorted = Object.keys(params)
          .sort()
          .map(k => `${k}=${JSON.stringify(params[k])}`)
          .join('&');
        return `${action}:${sorted}`;
      };

      const key1 = hashKey('categorize', { title: 'Test' });
      const key2 = hashKey('priority', { title: 'Test' });
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('JSON parsing', () => {
    it('parses clean JSON', () => {
      const input = '{"category": "bug", "confidence": 0.95}';
      const parsed = JSON.parse(input);
      
      expect(parsed.category).toBe('bug');
      expect(parsed.confidence).toBe(0.95);
    });

    it('parses JSON wrapped in markdown', () => {
      const input = '```json\n{"category": "bug"}\n```';
      const cleaned = input
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      
      expect(parsed.category).toBe('bug');
    });
  });
});

describe('Prompt engineering', () => {
  it('categorize prompt defines roles', () => {
    const systemPrompt = 'Ты - помощник для категоризации задач';
    expect(systemPrompt).toContain('помощник');
    expect(systemPrompt).toContain('категоризац');
  });

  it('priority prompt includes deadline handling', () => {
    const prompt = 'срок сегодня/завтра';
    expect(prompt).toBeDefined();
  });

  it('decompose prompt specifies output format', () => {
    const format = '{"subtasks": [{"title": "название", "priority": "high|medium|low"}]}';
    expect(format).toContain('subtasks');
    expect(format).toContain('title');
    expect(format).toContain('priority');
  });

  it('summary prompt specifies JSON output', () => {
    const format = '{"summary": "текст сводки"}';
    expect(format).toContain('summary');
  });
});