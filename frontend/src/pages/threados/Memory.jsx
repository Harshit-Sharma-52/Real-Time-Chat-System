import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { memoryService } from '../../services/api';
import { Card, Button, Input, Textarea, Modal, Spinner, Badge, Select } from '../../components/ui';

const TYPES = ['person', 'project', 'preference', 'fact', 'decision'];
const TYPE_COLOR = { person: 'primary', project: 'blue', preference: 'amber', fact: 'green', decision: 'purple' };

export default function Memory() {
  const { workspaceId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'fact', title: '', content: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    memoryService.list(workspaceId, filter ? `?type=${filter}` : '')
      .then(setItems).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId, filter]);

  const openCreate = () => { setEditing(null); setForm({ type: 'fact', title: '', content: '', tags: '' }); setShowCreate(true); };
  const openEdit = (m) => { setEditing(m); setForm({ type: m.type, title: m.title, content: m.content, tags: (m.tags || []).join(', ') }); setShowCreate(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      if (editing) await memoryService.update(workspaceId, editing._id, payload);
      else await memoryService.create(workspaceId, payload);
      setShowCreate(false);
      load();
    } finally { setSaving(false); }
  };

  const forget = async (id) => {
    await memoryService.remove(workspaceId, id).catch(() => {});
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI Memory</h2>
          <p className="text-sm text-slate-400">Structured, user-controlled memory. You decide what the assistant remembers.</p>
        </div>
        <Button onClick={openCreate}>Add memory</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === '' ? 'subtle' : 'ghost'} size="sm" onClick={() => setFilter('')}>All</Button>
        {TYPES.map((t) => (
          <Button key={t} variant={filter === t ? 'subtle' : 'ghost'} size="sm" onClick={() => setFilter(t)}>{t}</Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No memories yet. Add people, facts, preferences, or decisions.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((m) => (
            <Card key={m._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color={TYPE_COLOR[m.type]}>{m.type}</Badge>
                    <span className="font-semibold text-slate-800 truncate">{m.title}</span>
                  </div>
                  {m.content && <p className="text-sm text-slate-500 mt-1">{m.content}</p>}
                  {m.sourceMessage && (
                    <div className="text-xs text-primary-600 mt-2">Linked to a conversation message</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => forget(m._id)}>Forget this</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editing ? 'Edit memory' : 'Add memory'}>
        <div className="space-y-3">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea rows={3} placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
