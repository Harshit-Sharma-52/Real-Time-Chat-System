import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../../services/api';
import { Card, Button, Input, Textarea, Modal, Spinner, Badge } from '../../components/ui';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'];

export default function Projects() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'Planning', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [listError, setListError] = useState(null);

  const load = () => {
    setLoading(true);
    setListError(null);
    projectService.listProjects(workspaceId).then(setProjects).catch((e) => setListError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  const create = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await projectService.createProject(workspaceId, {
        ...form,
        dueDate: form.dueDate || undefined,
      });
      setShowCreate(false);
      setForm({ name: '', description: '', status: 'Planning', dueDate: '' });
      load();
    } catch (e) {
      setError(e.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Projects</h2>
        <Button onClick={() => setShowCreate(true)}>New project</Button>
      </div>

      {listError && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">{listError}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No projects yet. Create your first project.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p._id} className="p-4 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <Badge color={p.status === 'Active' ? 'green' : p.status === 'Completed' ? 'blue' : 'slate'}>{p.status}</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description || 'No description'}</p>
              <div className="text-xs text-slate-400 mt-3">
                {p.taskStats?.total || 0} tasks · {p.taskStats?.done || 0} done
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create project">
        <div className="space-y-3">
          <Input placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3">
            <select className="flex-1 px-3 py-2 rounded-lg border border-slate-300" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input type="date" className="flex-1" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
