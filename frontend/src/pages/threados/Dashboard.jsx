import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspaceService, aiService } from '../../services/api';
import { Card, Badge, Avatar, Button, Spinner } from '../../components/ui';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Blocked', 'Done'];

export default function Dashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    workspaceService
      .getDashboard(workspaceId)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    aiService.getInsights(workspaceId).then((i) => active && setInsights(i)).catch(() => {});
    return () => { active = false; };
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm">Failed to load dashboard: {error}</div>;
  }

  const stats = [
    { label: 'Urgent tasks', value: data.urgentTasks, color: 'red' },
    { label: 'Blocked', value: data.blockedTasks, color: 'amber' },
    { label: 'Due soon', value: data.dueSoon, color: 'primary' },
    { label: 'Unread messages', value: data.unreadConversations, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-400">Overview of your workspace</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/workspace/${workspaceId}/tasks`)}>View tasks</Button>
          <Button onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>New project</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-3xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Workspace insights</h3>
            {insights && !insights.configured && <span className="text-xs text-slate-400">Rule-based (AI not configured)</span>}
          </div>
          {!insights ? (
            <p className="text-sm text-slate-400">Loading insights…</p>
          ) : insights.insights.length === 0 ? (
            <p className="text-sm text-slate-400">No active risks. Everything looks healthy.</p>
          ) : (
            <div className="space-y-2">
              {insights.insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-3 border border-slate-100 rounded-lg p-3">
                  <Badge color={ins.severity === 'critical' ? 'red' : ins.severity === 'warning' ? 'amber' : 'slate'}>{ins.severity}</Badge>
                  <div>
                    <div className="text-sm font-medium text-slate-700">{ins.title}</div>
                    <div className="text-sm text-slate-500">{ins.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-semibold text-slate-800 mb-3">Task status</h3>
          <div className="space-y-2">
            {STATUSES.map((st) => {
              const count = data.taskStats?.[st] || 0;
              const total = Object.values(data.taskStats || {}).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={st}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{st}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Recent decisions</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/workspace/${workspaceId}/decisions`)}>View all</Button>
          </div>
          {data.recentDecisions.length === 0 ? (
            <p className="text-sm text-slate-400">No decisions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentDecisions.map((d) => (
                <div key={d._id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{d.title}</span>
                    <Badge color={d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'slate'}>{d.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.summary}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Projects</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>View all</Button>
          </div>
          {data.projects.length === 0 ? (
            <p className="text-sm text-slate-400">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.projects.map((p) => (
                <div key={p._id} className="border border-slate-100 rounded-lg p-3 hover:border-primary-200 cursor-pointer" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>
                  <div className="font-medium text-slate-700">{p.name}</div>
                  <Badge color={p.status === 'Active' ? 'green' : p.status === 'Completed' ? 'blue' : 'slate'} className="mt-2">{p.status}</Badge>
                  <div className="text-xs text-slate-400 mt-2">{p.taskStats?.total || 0} tasks · {p.taskStats?.done || 0} done</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Recent activity</h3>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((a) => (
                <div key={a._id} className="flex gap-3">
                  <Avatar name={a.actor?.name || '?'} size="sm" src={a.actor?.avatar} />
                  <div className="text-sm">
                    <span className="text-slate-700">{a.actor?.name || 'Someone'}</span>{' '}
                    <span className="text-slate-500">{a.action}</span>{' '}
                    <span className="text-slate-400 text-xs">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
