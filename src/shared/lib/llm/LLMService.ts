// DIP: Сервис зависит от абстракций (LLMProvider, CacheService)
// SRP: Оркестрация LLM запросов

import type { LLMProvider, CacheService, ActionHandler, LLMResponse } from './interfaces';

export class LLMService {
  constructor(
    private provider: LLMProvider,
    private cache: CacheService
  ) {}

  private getCacheKey(action: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${action}:${sorted}`;
  }

  async execute(
    handler: ActionHandler,
    params: Record<string, unknown>,
    useCache = true
  ): Promise<LLMResponse> {
    const cacheKey = this.getCacheKey(handler.action, params);

    // Check cache
    if (useCache) {
      const cached = this.cache.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        return { data: cached, cached: true };
      }
    }

    // Build prompt
    const { system, prompt } = handler.buildPrompt(params);

    // Call LLM
    const result = await this.provider.complete(system, prompt);

    if (!result || typeof result !== 'string') {
      return { data: handler.getFallback(params), fallback: true };
    }

    // Parse result
    const parsed = handler.parseResult(result);
    if (!parsed) {
      return { data: handler.getFallback(params), fallback: true };
    }

    // Cache result
    this.cache.set(cacheKey, parsed);
    return { data: parsed };
  }

  async *stream(
    handler: ActionHandler,
    params: Record<string, unknown>
  ): AsyncGenerator<string, void, unknown> {
    const { system, prompt } = handler.buildPrompt(params);
    const stream = await this.provider.stream(system, prompt);

    if (!stream) {
      yield JSON.stringify(handler.getFallback(params));
      return;
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}