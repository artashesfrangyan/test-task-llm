import { describe, it, expect, beforeEach, vi } from 'vitest';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LLMCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000;

  private hashKey(action: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${action}:${sorted}`;
  }

  get<T>(action: string, params: Record<string, unknown>): T | null {
    const key = this.hashKey(action, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(action: string, params: Record<string, unknown>, data: T, ttl?: number): void {
    const key = this.hashKey(action, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

describe('LLMCache', () => {
  let cache: LLMCache;

  beforeEach(() => {
    cache = new LLMCache();
  });

  describe('hashKey', () => {
    it('produces consistent keys for same params', () => {
      cache.set('categorize', { title: 'Test', description: 'Desc' }, { category: 'bug' });
      cache.set('categorize', { description: 'Desc', title: 'Test' }, { category: 'feature' });
      
      expect(cache.size()).toBe(1);
    });

    it('produces different keys for different actions', () => {
      cache.set('categorize', { title: 'Test' }, { category: 'bug' });
      cache.set('priority', { title: 'Test' }, { priority: 'high' });
      
      expect(cache.size()).toBe(2);
    });

    it('handles nested objects in params', () => {
      cache.set('summary', { stats: { total: 10, pending: 5 } }, { summary: 'test' });
      const result = cache.get('summary', { stats: { total: 10, pending: 5 } });
      
      expect(result).toEqual({ summary: 'test' });
    });

    it('handles arrays in params', () => {
      cache.set('test', { items: [1, 2, 3] }, 'result');
      const result = cache.get('test', { items: [1, 2, 3] });
      
      expect(result).toBe('result');
    });
  });

  describe('get and set', () => {
    it('returns null for non-existent key', () => {
      const result = cache.get('categorize', { title: 'Test' });
      expect(result).toBeNull();
    });

    it('stores and retrieves data', () => {
      const data = { category: 'bug', confidence: 0.95 };
      cache.set('categorize', { title: 'Fix bug' }, data);
      
      const result = cache.get('categorize', { title: 'Fix bug' });
      expect(result).toEqual(data);
    });

    it('respects custom TTL', async () => {
      vi.useFakeTimers();
      
      const data = { priority: 'high' };
      cache.set('priority', { title: 'Test' }, data, 1000);
      
      expect(cache.get('priority', { title: 'Test' })).toEqual(data);
      
      vi.advanceTimersByTime(500);
      expect(cache.get('priority', { title: 'Test' })).toEqual(data);
      
      vi.advanceTimersByTime(600);
      expect(cache.get('priority', { title: 'Test' })).toBeNull();
      
      vi.useRealTimers();
    });

    it('expires entries after default TTL', async () => {
      vi.useFakeTimers();
      
      cache.set('test', { id: 1 }, 'data');
      
      vi.advanceTimersByTime(5 * 60 * 1000 - 1);
      expect(cache.get('test', { id: 1 })).toBe('data');
      
      vi.advanceTimersByTime(2);
      expect(cache.get('test', { id: 1 })).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', { x: 1 }, 1);
      cache.set('b', { x: 2 }, 2);
      cache.set('c', { x: 3 }, 3);
      
      expect(cache.size()).toBe(3);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('a', { x: 1 })).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles undefined values', () => {
      cache.set('test', { title: 'Test' }, undefined);
      const result = cache.get('test', { title: 'Test' });
      
      expect(result).toBeUndefined();
    });

    it('handles null values', () => {
      cache.set('test', { title: 'Test' }, null);
      const result = cache.get('test', { title: 'Test' });
      
      expect(result).toBeNull();
    });

    it('handles empty params', () => {
      cache.set('test', {}, 'data');
      const result = cache.get('test', {});
      
      expect(result).toBe('data');
    });

    it('handles special characters in params', () => {
      const specialTitle = 'Test: with "quotes" and\nnewlines';
      cache.set('test', { title: specialTitle }, 'data');
      
      expect(cache.get('test', { title: specialTitle })).toBe('data');
    });
  });
});