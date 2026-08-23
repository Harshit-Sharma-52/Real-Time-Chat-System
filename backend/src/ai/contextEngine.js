import { getAIProvider, isAIConfigured, AINotConfiguredError } from './index.js';

export function buildConversationText(messages) {
  return messages
    .filter((m) => m && (m.content || m.fileName))
    .map((m) => `${m.sender?.name || m.sender || 'Unknown'}: ${m.content || m.fileName || ''}`)
    .join('\n');
}

export async function extractFromText(text) {
  if (!isAIConfigured()) throw new AINotConfiguredError();
  const provider = getAIProvider();
  return provider.extractContext(text);
}

export async function extractFromMessages(messages) {
  return extractFromText(buildConversationText(messages));
}

export async function summarizeMessages(messages) {
  if (!isAIConfigured()) throw new AINotConfiguredError();
  const provider = getAIProvider();
  return provider.summarize(buildConversationText(messages));
}
