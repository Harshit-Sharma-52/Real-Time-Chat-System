import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchService } from '../../services/api';
import { Card, Input, Button, Spinner, Badge, Avatar } from '../../components/ui';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'messages', label: 'Messages' },
  { value: 'users', label: 'People' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'decisions', label: 'Decisions' },
  { value: 'files', label: 'Files' },
];

export default function Search() {
  const { workspaceId } = useParams();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (query, t) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await searchService.search(workspaceId, query, t);
      setResults(data);
    } catch {
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(q, type), 250);
    return () => clearTimeout(t);
  }, [q, type, workspaceId]);

  const renderSection = (key, title, items, render) => (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-500 mb-2">{title} ({items?.length || 0})</h3>
      {items?.length ? (
        <div className="space-y-2">{items.map(render)}</div>
      ) : (
        <p className="text-sm text-slate-400">No {title.toLowerCase()} found.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-slate-800">Search</h2>
      <Input
        placeholder="Search across messages, people, projects, tasks, decisions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <Button key={t.value} variant={type === t.value ? 'subtle' : 'ghost'} size="sm" onClick={() => setType(t.value)}>{t.label}</Button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {results && !loading && (
        <Card className="p-5">
          {renderSection('messages', 'Messages', results.messages, (m) => (
            <div key={m._id} className="border border-slate-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={m.sender?.name || '?'} size="sm" />
                <span className="text-sm font-medium text-slate-700">{m.sender?.name}</span>
              </div>
              <p className="text-sm text-slate-600">{m.content}</p>
            </div>
          ))}
          {renderSection('users', 'People', results.users, (u) => (
            <div key={u._id} className="flex items-center gap-2 border border-slate-100 rounded-lg p-3">
              <Avatar name={u.name} size="sm" />
              <span className="text-sm text-slate-700">{u.name}</span>
              <span className="text-xs text-slate-400">{u.email}</span>
            </div>
          ))}
          {renderSection('projects', 'Projects', results.projects, (p) => (
            <div key={p._id} className="border border-slate-100 rounded-lg p-3">
              <span className="font-medium text-slate-700">{p.name}</span>
              <Badge className="ml-2" color="slate">{p.status}</Badge>
            </div>
          ))}
          {renderSection('tasks', 'Tasks', results.tasks, (t) => (
            <div key={t._id} className="border border-slate-100 rounded-lg p-3">
              <span className="font-medium text-slate-700">{t.title}</span>
              <Badge className="ml-2" color="primary">{t.status}</Badge>
            </div>
          ))}
          {renderSection('decisions', 'Decisions', results.decisions, (d) => (
            <div key={d._id} className="border border-slate-100 rounded-lg p-3">
              <span className="font-medium text-slate-700">{d.title}</span>
            </div>
          ))}
          {renderSection('files', 'Files', results.files, (f) => (
            <div key={f._id} className="border border-slate-100 rounded-lg p-3 text-sm text-slate-600">
              {f.originalName || f.fileName}
            </div>
          ))}
        </Card>
      )}

      {!results && !loading && (
        <Card className="p-8 text-center text-slate-400">Start typing to search your workspace.</Card>
      )}
    </div>
  );
}
