// SRP: Кэширование - одна ответственность

import type { CacheService } from './interfaces';

interface CacheItem {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export class InMemoryCache implements CacheService {
  private cache = new Map<string, CacheItem>();
  private defaultTTL: number;

  constructor(defaultTTL = 300000) {
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton для совместимости
export const llmCache = new InMemoryCache();