import { AIProvider, AIProviderError } from './provider.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export class GeminiProvider extends AIProvider {
  constructor({ apiKey, model }) {
    super();
    if (!apiKey) throw new AIProviderError('Gemini API key is missing.');
    this.apiKey = apiKey;
    this.model = model || 'gemini-1.5-flash';
  }

  get name() {
    return 'gemini';
  }

  async _generate(system, prompt, schema) {
    const url = `${ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };
    if (schema) body.generationConfig.responseSchema = schema;

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new AIProviderError(`Failed to reach Gemini: ${err.message}`);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new AIProviderError(`Gemini responded ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const parsed = extractJson(text);
    if (!parsed) throw new AIProviderError('Gemini returned an unparseable response.');
    return parsed;
  }

  async extractContext(text, _opts = {}) {
    const system = `You are the ThreadOS Context Engine. Analyze the provided conversation text and extract structured, actionable information. Be precise and conservative: only extract what is explicitly stated or strongly implied. Return strict JSON.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        tasks: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          title: { type: 'STRING' }, assignee: { type: 'STRING' }, deadline: { type: 'STRING' },
          priority: { type: 'STRING' }, description: { type: 'STRING' },
        } } },
        decisions: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          title: { type: 'STRING' }, summary: { type: 'STRING' }, status: { type: 'STRING' },
        } } },
        deadlines: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          what: { type: 'STRING' }, when: { type: 'STRING' }, assignee: { type: 'STRING' },
        } } },
        actionItems: { type: 'ARRAY', items: { type: 'STRING' } },
        facts: { type: 'ARRAY', items: { type: 'STRING' } },
        people: { type: 'ARRAY', items: { type: 'STRING' } },
        projectContext: { type: 'STRING' },
      },
    };
    return this._generate(system, text, schema);
  }

  async catchMeUp(summaryText, _opts = {}) {
    const system = `You are ThreadOS Catch Me Up. Given a structured summary of workspace activity while the user was away, produce a concise, human digest grouped by theme. Return strict JSON with a "headline" string and a "sections" array of {title, points: string[]}.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        headline: { type: 'STRING' },
        sections: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          title: { type: 'STRING' }, points: { type: 'ARRAY', items: { type: 'STRING' } },
        } } },
      },
    };
    return this._generate(system, summaryText, schema);
  }

  async runAction(text, _opts = {}) {
    const system = `You are the ThreadOS action interpreter. Convert a natural-language request into a single structured action. Return strict JSON: { action: "create_task"|"create_decision"|"summarize"|"list_decisions"|"weekly_update"|"who_is_waiting"|"unknown", payload: object, needsConfirmation: boolean, message: string }. For create_task payload includes title, description, assignee, priority, deadline. For create_decision payload includes title, summary.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        action: { type: 'STRING' },
        payload: { type: 'OBJECT', propertyNames: { type: 'STRING' } },
        needsConfirmation: { type: 'BOOLEAN' },
        message: { type: 'STRING' },
      },
    };
    return this._generate(system, text, schema);
  }

  async summarize(text, _opts = {}) {
    const system = `You are ThreadOS. Summarize the provided conversation into a short paragraph and a bullet list of key points. Return strict JSON: { summary: string, points: string[] }.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        points: { type: 'ARRAY', items: { type: 'STRING' } },
      },
    };
    return this._generate(system, text, schema);
  }

  async generateInsights(summaryText, _opts = {}) {
    const system = `You are ThreadOS Insights. Given workspace metrics, identify real risks and patterns. Be specific and never invent data. Return strict JSON: { insights: [{ type, severity: "info"|"warning"|"critical", title, detail }] }.`;
    const schema = {
      type: 'OBJECT',
      properties: {
        insights: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
          type: { type: 'STRING' }, severity: { type: 'STRING' },
          title: { type: 'STRING' }, detail: { type: 'STRING' },
        } } },
      },
    };
    return this._generate(system, summaryText, schema);
  }
}
