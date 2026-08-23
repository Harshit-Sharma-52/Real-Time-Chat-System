export class AINotConfiguredError extends Error {
  constructor(message = 'AI features are not configured. Set AI_PROVIDER and the provider API key to enable.') {
    super(message);
    this.name = 'AINotConfiguredError';
    this.code = 'AI_NOT_CONFIGURED';
  }
}

export class AIProviderError extends Error {
  constructor(message = 'The AI provider returned an error.') {
    super(message);
    this.name = 'AIProviderError';
    this.code = 'AI_PROVIDER_ERROR';
  }
}

export class AIProvider {
  get name() {
    return 'base';
  }

  async extractContext() {
    throw new Error('Not implemented');
  }

  async catchMeUp() {
    throw new Error('Not implemented');
  }

  async runAction() {
    throw new Error('Not implemented');
  }

  async summarize() {
    throw new Error('Not implemented');
  }

  async generateInsights() {
    throw new Error('Not implemented');
  }
}
