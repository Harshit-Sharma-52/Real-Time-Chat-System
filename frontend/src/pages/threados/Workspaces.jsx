import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store';
import { workspaceService } from '../../services/api';
import { Card, Button, Input, Spinner, Avatar, Modal } from '../../components/ui';
import toImage from '../../../images/to.png';

export default function Workspaces() {
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', visibility: 'private' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkspaces().finally(() => setLoading(false));
  }, [fetchWorkspaces]);

  const open = (ws) => {
    const workspace = ws.workspace || ws;
    setCurrentWorkspace(workspace);
    navigate(`/workspace/${workspace._id}`);
  };

  const create = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const ws = await workspaceService.createWorkspace(form);
      setShowCreate(false);
      setForm({ name: '', description: '', visibility: 'private' });
      open(ws);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src={toImage} alt="ThreadOS" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Your workspaces</h1>
              <p className="text-sm text-slate-400">Conversations become structured work.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}>New workspace</Button>
        </div>

        {workspaces.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-slate-400">You're not a member of any workspace yet.</p>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setShowCreate(true)}>Create your first workspace</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                onClick={() => open(ws)}
                className="text-left card p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={ws.name} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{ws.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{ws.visibility || 'private'}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">{ws.description || 'No description'}</p>
                <div className="text-xs text-slate-400 mt-3">{ws.memberCount || 0} members</div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button variant="ghost" onClick={() => navigate('/')}>Back to chat</Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create workspace">
        <div className="space-y-3">
          <Input placeholder="Workspace name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
