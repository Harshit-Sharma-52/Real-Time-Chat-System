import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { Card, Button, Spinner, Badge, Avatar } from '../../components/ui';
import { formatDistanceToNow } from 'date-fns';

const TYPE_COLOR = {
  message: 'blue',
  mention: 'primary',
  'task.assigned': 'amber',
  deadline: 'red',
  project: 'green',
  decision: 'purple',
  system: 'slate',
};

export default function Notifications() {
  const { workspaceId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsId, setWsId] = useState(workspaceId || '');

  const load = () => {
    setLoading(true);
    notificationService
      .listNotifications(wsId)
      .then((data) => setItems(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [wsId, workspaceId]);

  const markAll = async () => {
    await notificationService.markAllRead(wsId).catch(() => {});
    load();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
        <div className="flex gap-2">
          <select className="px-2 py-1.5 text-sm rounded-lg border border-slate-300" value={wsId} onChange={(e) => setWsId(e.target.value)}>
            <option value="">All workspaces</option>
            <option value={workspaceId}>This workspace</option>
          </select>
          <Button variant="secondary" size="sm" onClick={markAll}>Mark all read</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">You're all caught up.</Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n._id} className={`p-4 flex items-start gap-3 ${n.read ? 'opacity-60' : ''}`}>
              <Avatar name={n.actor?.name || '?'} size="sm" src={n.actor?.avatar} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">{n.actor?.name || 'System'}</span>{' '}
                  {n.message}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </div>
              <Badge color={TYPE_COLOR[n.type] || 'slate'}>{n.type}</Badge>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 mt-2" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
