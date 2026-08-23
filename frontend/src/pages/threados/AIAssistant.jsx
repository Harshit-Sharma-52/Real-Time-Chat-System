import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { aiService, taskService, decisionService } from '../../services/api';
import { Card, Button, Textarea, Spinner, Badge, Input } from '../../components/ui';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function AIAssistant() {
  const { workspaceId } = useParams();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);
  const [actionText, setActionText] = useState('');
  const [actionResult, setActionResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await aiService.analyzeText(text);
      setStatus({ configured: data.configured });
      if (data.configured) {
        if (data.extraction) setResult(data.extraction);
        if (data.error) setError(data.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (t) => {
    setCreating(`task:${t.title}`);
    try {
      await taskService.createTask(workspaceId, {
        title: t.title,
        description: t.description || '',
        priority: PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
        dueDate: t.deadline ? normalizeDate(t.deadline) : undefined,
      });
      setResult((r) => ({ ...r, tasks: r.tasks.filter((x) => x !== t) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(null);
    }
  };

  const createDecision = async (d) => {
    setCreating(`dec:${d.title}`);
    try {
      await decisionService.createDecision(workspaceId, { title: d.title, explanation: d.summary || '' });
      setResult((r) => ({ ...r, decisions: r.decisions.filter((x) => x !== d) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(null);
    }
  };

  const runAction = async (confirm = false) => {
    if (!actionText.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await aiService.runAction(workspaceId, actionText, confirm);
      setActionResult(data);
      if (data?.error) setActionError(data.error);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">AI Context Engine</h2>
        <p className="text-sm text-slate-400">Paste a conversation to extract tasks, decisions, deadlines, and facts. Review before creating anything.</p>
      </div>

      <Card className="p-4 space-y-3">
        <Textarea
          rows={6}
          placeholder={'e.g.\n"Rahul, please finish the landing page before Friday. We decided to launch on the new domain."'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button onClick={analyze} disabled={loading || !text.trim()}>{loading ? 'Analyzing…' : 'Analyze'}</Button>
          {status && !status.configured && (
            <span className="text-xs text-amber-600">AI not configured — set AI_PROVIDER and a provider key to enable extraction.</span>
          )}
        </div>
      </Card>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">AI Actions</h3>
        <p className="text-xs text-slate-400">Try: "Create a task to redesign the homepage." or "Summarize this conversation." Important actions ask for confirmation before running.</p>
        <div className="flex gap-2">
          <Input
            placeholder="Describe an action…"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
          />
          <Button onClick={runAction} disabled={actionLoading || !actionText.trim()}>{actionLoading ? '…' : 'Run'}</Button>
        </div>
        {!actionResult?.configured && actionResult && (
          <span className="text-xs text-amber-600">AI not configured — natural-language actions are disabled.</span>
        )}
        {actionResult?.configured && actionResult.interpretation && (
          <div className="border border-slate-100 rounded-lg p-3">
            <div className="text-sm text-slate-700">
              <span className="font-medium">Interpreted as:</span> {actionResult.interpretation.action}
              {actionResult.interpretation.message ? ` — ${actionResult.interpretation.message}` : ''}
            </div>
            {actionResult.executed ? (
              <div className="text-sm text-green-600 mt-2">✓ Executed.</div>
            ) : actionResult.interpretation.needsConfirmation ? (
              <Button size="sm" className="mt-2" onClick={() => runAction(true)}>Confirm &amp; execute</Button>
            ) : null}
          </div>
        )}
        {actionError && <div className="text-red-600 text-sm">{actionError}</div>}
      </Card>

      {result && (
        <div className="space-y-4">
          <Section title="Tasks" items={result.tasks} empty="No tasks detected.">
            {(t) => (
              <div className="border border-slate-100 rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-800">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {t.assignee && <>Assignee: {t.assignee} · </>}
                    {t.deadline && <>Due: {t.deadline} · </>}
                    {t.priority && <Badge color="primary">{t.priority}</Badge>}
                  </div>
                </div>
                <Button size="sm" onClick={() => createTask(t)} disabled={creating === `task:${t.title}`}>
                  {creating === `task:${t.title}` ? 'Creating…' : 'Create task'}
                </Button>
              </div>
            )}
          </Section>

          <Section title="Decisions" items={result.decisions} empty="No decisions detected.">
            {(d) => (
              <div className="border border-slate-100 rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-800">{d.title}</div>
                  <div className="text-sm text-slate-500 mt-1">{d.summary}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => createDecision(d)} disabled={creating === `dec:${d.title}`}>
                  {creating === `dec:${d.title}` ? 'Saving…' : 'Record'}
                </Button>
              </div>
            )}
          </Section>

          <Section title="Deadlines" items={result.deadlines} empty="No deadlines detected.">
            {(d) => <div className="border border-slate-100 rounded-lg p-3 text-sm text-slate-700">{d.what} — <span className="text-slate-400">{d.when}{d.assignee ? ` · ${d.assignee}` : ''}</span></div>}
          </Section>

          <Section title="People" items={result.people} empty="No people detected.">
            {(p) => <Badge color="slate">{p}</Badge>}
          </Section>

          <Section title="Facts" items={result.facts} empty="No facts detected.">
            {(f) => <div className="border border-slate-100 rounded-lg p-3 text-sm text-slate-700">{f}</div>}
          </Section>

          {result.projectContext && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Project context</h3>
              <p className="text-sm text-slate-700">{result.projectContext}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeDate(s) {
  const d = Date.parse(s);
  return Number.isNaN(d) ? undefined : new Date(d).toISOString().slice(0, 10);
}

function Section({ title, items, empty, children }) {
  if (!items || items.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{empty}</p>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">{title} ({items.length})</h3>
      <div className="space-y-2">{items.map((it, i) => <div key={i}>{children(it)}</div>)}</div>
    </Card>
  );
}
