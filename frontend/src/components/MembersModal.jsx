import React, { useEffect, useState } from 'react';
import { workspaceService } from '../services/api';
import { Modal, Button, Input, Avatar, Badge, Spinner } from './ui';

const ROLES = ['owner', 'admin', 'member', 'guest'];
const CAN_MANAGE = ['owner', 'admin'];

export default function MembersModal({ workspaceId, currentUserRole, open, onClose }) {
  const canManage = CAN_MANAGE.includes(currentUserRole);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    workspaceService.listMembers(workspaceId)
      .then(setMembers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) load();
  }, [open, workspaceId]);

  const add = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    try {
      await workspaceService.addMember(workspaceId, { email: trimmed, role });
      setEmail('');
      load();
    } catch (e) {
      setError(e.message || 'Failed to add member.');
    } finally {
      setAdding(false);
    }
  };

  const changeRole = async (member) => {
    setBusyId(member._id);
    setError(null);
    try {
      await workspaceService.updateMemberRole(workspaceId, member._id, member.nextRole);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member) => {
    setBusyId(member._id);
    setError(null);
    try {
      await workspaceService.removeMember(workspaceId, member._id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Workspace members">
      <div className="space-y-4">
        {canManage && (
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button onClick={add} disabled={adding || !email.trim()}>{adding ? 'Adding…' : 'Add'}</Button>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m._id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <Avatar name={m.user?.name || '?'} src={m.user?.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800 truncate">{m.user?.name}</div>
                  <div className="text-xs text-slate-400 truncate">{m.user?.email}</div>
                </div>
                <Badge color={m.role === 'owner' ? 'primary' : m.role === 'admin' ? 'purple' : 'slate'}>{m.role}</Badge>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={m.role}
                      disabled={busyId === m._id}
                      onChange={(e) => changeRole({ _id: m._id, nextRole: e.target.value })}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <Button variant="danger" size="sm" onClick={() => remove(m)} disabled={busyId === m._id}>Remove</Button>
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No members yet.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
