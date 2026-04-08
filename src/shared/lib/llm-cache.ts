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

export const llmCache = new LLMCache();