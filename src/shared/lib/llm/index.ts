// SOLID LLM Module Exports

export * from './interfaces';
export * from './InMemoryCache';
export * from './GigaChatProvider';
export * from './handlers';
export * from './LLMService';

// Default instances for convenience
import { InMemoryCache } from './InMemoryCache';
import { GigaChatProvider } from './GigaChatProvider';
import { LLMService } from './LLMService';

export const defaultCache = new InMemoryCache();
export const defaultProvider = new GigaChatProvider();
export const defaultLLMService = new LLMService(defaultProvider, defaultCache);