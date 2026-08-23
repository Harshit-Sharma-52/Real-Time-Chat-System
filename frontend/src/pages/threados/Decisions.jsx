import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { decisionService } from '../../services/api';
import { Card, Button, Input, Textarea, Modal, Spinner, Badge, Select } from '../../components/ui';

const STATUSES = ['proposed', 'approved', 'rejected', 'implemented'];

export default function Decisions() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', detail: '', status: 'proposed' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    decisionService.listDecisions(workspaceId).then(setItems).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await decisionService.createDecision(workspaceId, {
        title: form.title,
        explanation: form.summary + (form.detail ? `\n\n${form.detail}` : ''),
        status: form.status,
      });
      setShowCreate(false);
      setForm({ title: '', summary: '', detail: '', status: 'proposed' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const color = (s) => (s === 'approved' ? 'green' : s === 'rejected' ? 'red' : s === 'implemented' ? 'blue' : 'slate');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Decisions</h2>
        <Button onClick={() => setShowCreate(true)}>Record decision</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">No decisions recorded yet.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <Card key={d._id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{d.title}</span>
                    {d.aiGenerated && <Badge color="purple">AI</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{d.explanation}</p>
                  {d.sourceMessage && (
                    <button
                      onClick={() => navigate(`/chat/${d.sourceMessage.chatId}`)}
                      className="text-xs text-primary-600 mt-2 hover:underline"
                    >
                      View original message →
                    </button>
                  )}
                  {d.aiGenerated && d.why && (
                    <div className="text-xs text-slate-400 mt-1">Why: {d.why}</div>
                  )}
                </div>
                <Badge color={color(d.status)}>{d.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Record a decision">
        <div className="space-y-3">
          <Input placeholder="Decision title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Summary" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <Textarea placeholder="Details (optional)" rows={3} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
