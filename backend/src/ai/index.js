import config from '../config/index.js';
import { AINotConfiguredError } from './provider.js';
import { GeminiProvider } from './geminiProvider.js';

let cached = null;

export function isAIConfigured() {
  return config.aiProvider === 'gemini' && Boolean(config.geminiApiKey);
}

export function getAIProvider() {
  if (!isAIConfigured()) {
    throw new AINotConfiguredError();
  }
  if (cached) return cached;
  cached = new GeminiProvider({ apiKey: config.geminiApiKey, model: config.geminiModel });
  return cached;
}

export { AINotConfiguredError, AIProviderError } from './provider.js';
