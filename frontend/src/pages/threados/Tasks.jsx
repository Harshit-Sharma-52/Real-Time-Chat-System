import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { taskService } from '../../services/api';
import { Card, Button, Input, Textarea, Modal, Spinner, Badge, Select } from '../../components/ui';

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Blocked', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_COLOR = { Low: 'slate', Medium: 'blue', High: 'amber', Urgent: 'red' };
const STATUS_COLOR = { Backlog: 'slate', Todo: 'blue', 'In Progress': 'primary', Blocked: 'red', Done: 'green' };

export default function Tasks() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    taskService.listTasks(workspaceId, filter ? `?status=${filter}` : '').then(setTasks).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId, filter]);

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await taskService.createTask(workspaceId, { ...form, dueDate: form.dueDate || undefined });
      setShowCreate(false);
      setForm({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
        <Button onClick={() => setShowCreate(true)}>New task</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === '' ? 'subtle' : 'ghost'} size="sm" onClick={() => setFilter('')}>All</Button>
        {STATUSES.map((s) => (
          <Button key={s} variant={filter === s ? 'subtle' : 'ghost'} size="sm" onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No tasks found.</Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t._id} className="p-4 flex items-center gap-4 hover:shadow-soft transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{t.title}</div>
                {t.dueDate && <div className="text-xs text-slate-400">Due {new Date(t.dueDate).toLocaleDateString()}</div>}
              </div>
              <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
              <Badge color={STATUS_COLOR[t.status]}>{t.status}</Badge>
              {t.aiGenerated && <Badge color="purple">AI</Badge>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create task">
        <div className="space-y-3">
          <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3">
            <Select className="flex-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select className="flex-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
