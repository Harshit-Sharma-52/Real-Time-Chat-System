import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from './index.js';

test('validateConfig throws in production without a strong JWT_SECRET', () => {
  const savedNodeEnv = process.env.NODE_ENV;
  const savedSecret = process.env.JWT_SECRET;

  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;

  assert.throws(() => validateConfig({
    nodeEnv: 'production',
    mongoUri: 'mongodb://localhost:27017/test',
    port: 5000,
    maxFileSize: 1,
  }));

  process.env.NODE_ENV = savedNodeEnv;
  if (savedSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = savedSecret;
  }
});

test('validateConfig passes when a secret is provided', () => {
  assert.doesNotThrow(() => validateConfig({
    nodeEnv: 'development',
    mongoUri: 'mongodb://localhost:27017/test',
    port: 5000,
    maxFileSize: 1,
    jwtSecret: 'strong-secret',
  }));
});

test('validateConfig throws when PORT is not a number', () => {
  assert.throws(() => validateConfig({
    nodeEnv: 'development',
    mongoUri: 'mongodb://localhost:27017/test',
    port: NaN,
    maxFileSize: 1,
    jwtSecret: 'strong-secret',
  }));
});
