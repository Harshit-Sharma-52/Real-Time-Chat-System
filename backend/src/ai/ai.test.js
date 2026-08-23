import { test } from 'node:test';
import assert from 'node:assert/strict';
import config from '../config/index.js';
import { isAIConfigured } from '../ai/index.js';
import { buildConversationText } from '../ai/contextEngine.js';
import { analyzeSchema, actionSchema, memoryCreateSchema, memoryUpdateSchema } from '../validators/ai.js';

test('isAIConfigured reflects the configured provider/key', () => {
  const expected = config.aiProvider === 'gemini' && Boolean(config.geminiApiKey);
  assert.equal(isAIConfigured(), expected);
});

test('buildConversationText formats messages with sender names', () => {
  const text = buildConversationText([
    { sender: { name: 'Alice' }, content: 'Hello' },
    { sender: { name: 'Bob' }, content: 'Hi there' },
  ]);
  assert.match(text, /Alice: Hello/);
  assert.match(text, /Bob: Hi there/);
});

test('buildConversationText skips empty messages', () => {
  const text = buildConversationText([{ sender: { name: 'A' }, content: '' }]);
  assert.equal(text, '');
});

test('analyzeSchema rejects empty text', () => {
  assert.equal(analyzeSchema.safeParse({ text: '   ' }).success, false);
  assert.equal(analyzeSchema.safeParse({ text: 'real text' }).success, true);
});

test('actionSchema parses confirm flag', () => {
  const r = actionSchema.safeParse({ text: 'create a task', confirm: true });
  assert.equal(r.success, true);
  assert.equal(r.data.confirm, true);
});

test('memoryCreateSchema enforces valid type enum', () => {
  assert.equal(memoryCreateSchema.safeParse({ type: 'bogus', title: 'x' }).success, false);
  assert.equal(memoryCreateSchema.safeParse({ type: 'fact', title: 'x' }).success, true);
});

test('memoryUpdateSchema allows partial updates', () => {
  const r = memoryUpdateSchema.safeParse({ title: 'new title' });
  assert.equal(r.success, true);
  assert.equal(r.data.type, undefined);
});
