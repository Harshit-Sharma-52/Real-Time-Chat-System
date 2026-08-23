import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aiService } from '../../services/api';
import { Card, Button, Spinner, Badge } from '../../components/ui';
import { formatDistanceToNow } from 'date-fns';

export default function CatchMeUp() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    aiService.catchMeUp(workspaceId)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [workspaceId]);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error) return <div className="text-red-600 text-sm">Failed to load Catch Me Up: {error}</div>;
  if (!data) return null;

  const cards = [
    { label: 'Missed messages', value: data.missedMessages, color: 'blue' },
    { label: 'New tasks', value: data.newTasks.length, color: 'primary' },
    { label: 'Completed', value: data.completedTasks.length, color: 'green' },
    { label: 'Decisions', value: data.decisions.length, color: 'purple' },
    { label: 'Due this week', value: data.upcomingDeadlines.length, color: 'amber' },
    { label: 'Blocked', value: data.blocked.length, color: 'red' },
    { label: 'Needs response', value: data.needsResponse.length, color: 'primary' },
  ];

  const listBlock = (title, items, render) => (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-800 mb-3">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing here.</p>
      ) : (
        <div className="space-y-2">{items.map((it, i) => <div key={i}>{render(it)}</div>)}</div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catch Me Up</h2>
          <p className="text-sm text-slate-400">
            Since {formatDistanceToNow(new Date(data.since), { addSuffix: true })}
            {!data.configured && ' · AI summary unavailable (not configured)'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      {data.digest?.headline && (
        <Card className="p-5 bg-primary-50 border-primary-100">
          <p className="text-primary-900 font-medium">{data.digest.headline}</p>
          {data.digest.sections?.map((s, i) => (
            <div key={i} className="mt-3">
              <div className="text-sm font-semibold text-primary-800">{s.title}</div>
              <ul className="list-disc list-inside text-sm text-primary-700 mt-1 space-y-1">
                {s.points.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
            </div>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {listBlock('New tasks', data.newTasks, (t) => (
          <div className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">{t.title}</span>
            <span className="text-xs text-slate-400">{t.assignee || 'Unassigned'}</span>
          </div>
        ))}
        {listBlock('Decisions', data.decisions, (d) => (
          <div className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">{d.title}</span>
            <span className="text-xs text-slate-400">{d.createdBy || ''}</span>
          </div>
        ))}
        {listBlock('Upcoming deadlines', data.upcomingDeadlines, (t) => (
          <div className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">{t.title}</span>
            <span className="text-xs text-slate-400">{new Date(t.dueDate).toLocaleDateString()}</span>
          </div>
        ))}
        {listBlock('Blocked work', data.blocked, (t) => (
          <div className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">{t.title}</span>
            <Badge color="red">Blocked</Badge>
          </div>
        ))}
        {listBlock('Files shared', data.filesShared, (f) => (
          <div className="border border-slate-100 rounded-lg p-3 text-sm text-slate-700">{f.name}</div>
        ))}
        {listBlock('Needs your response', data.needsResponse, (c) => (
          <button onClick={() => navigate(c.link)} className="w-full text-left border border-slate-100 rounded-lg p-3 hover:border-primary-200">
            <span className="text-sm text-slate-700">{c.name}</span>
            <span className="text-xs text-slate-400 ml-2">{c.unread} unread</span>
          </button>
        ))}
      </div>
    </div>
  );
}
