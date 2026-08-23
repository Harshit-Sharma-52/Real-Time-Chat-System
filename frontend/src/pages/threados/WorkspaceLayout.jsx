import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store';
import { Avatar, Button } from '../../components/ui';
import MembersModal from '../../components/MembersModal';
import toImage from '../../../images/to.png';

const navItems = [
  { to: '', label: 'Dashboard', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h6l-2-2H5a2 2 0 00-2 2z' },
  { to: 'projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { to: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: 'decisions', label: 'Decisions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: 'search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { to: 'catchup', label: 'Catch Me Up', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: 'memory', label: 'Memory', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { to: 'ai', label: 'AI Assistant', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.8-4A8 8 0 113 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
];

export default function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, selectWorkspaceById, fetchWorkspaces } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces();
      return;
    }
    if (!currentWorkspace || currentWorkspace._id !== workspaceId) {
      const ws = selectWorkspaceById(workspaceId);
      if (!ws) {
        // unknown id or no access; bounce to chooser
        navigate('/workspaces', { replace: true });
      }
    }
  }, [workspaceId, currentWorkspace, workspaces, selectWorkspaceById, navigate, fetchWorkspaces]);

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">Loading workspace…</div>
    );
  }

  return (
    <div className="min-h-screen flex bg-app">
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <img src={toImage} alt="ThreadOS" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={() => navigate('/workspaces')}
            className="w-full flex items-center gap-3 text-left hover:bg-slate-50 rounded-lg p-2 -m-2"
          >
            <Avatar name={currentWorkspace.name} size="md" />
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 truncate">{currentWorkspace.name}</div>
              <div className="text-xs text-slate-400 truncate">{currentWorkspace.description || 'Workspace'}</div>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/workspace/${workspaceId}/${item.to}`}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 flex items-center gap-2">
          <Avatar name={user?.name || '?'} size="sm" src={user?.avatar} />
          <span className="text-sm text-slate-600 truncate">{user?.name}</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center px-6">
          <h1 className="text-sm font-semibold text-slate-500">{currentWorkspace.name}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowMembers(true)}>Members</Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Outlet />
        </main>
      </div>

      <MembersModal
        workspaceId={workspaceId}
        currentUserRole={currentWorkspace.role}
        open={showMembers}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
}
