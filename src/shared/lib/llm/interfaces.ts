// DIP: Интерфейсы для абстракций

export interface LLMProvider {
  complete(system: string, prompt: string): Promise<string | null>;
  stream(system: string, prompt: string): Promise<ReadableStream | null>;
}

export interface CacheService {
  get<T>(key: string): T | null;
  set(key: string, data: unknown, ttl?: number): void;
  has(key: string): boolean;
  size(): number;
}

export interface PromptBuilder {
  system: string;
  buildPrompt(params: Record<string, unknown>): string;
}

export interface ActionHandler {
  action: string;
  buildPrompt(params: Record<string, unknown>): { system: string; prompt: string };
  getFallback(params: Record<string, unknown>): Record<string, unknown>;
  parseResult(text: string): Record<string, unknown> | null;
}

export interface LLMRequest {
  action: string;
  params: Record<string, unknown>;
  useCache?: boolean;
}

export interface LLMResponse {
  data: Record<string, unknown>;
  cached?: boolean;
  fallback?: boolean;
}