import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ErrorBoundary } from './components/ErrorBoundary';
import Workspaces from './pages/threados/Workspaces';
import WorkspaceLayout from './pages/threados/WorkspaceLayout';
import Dashboard from './pages/threados/Dashboard';
import Projects from './pages/threados/Projects';
import Tasks from './pages/threados/Tasks';
import Decisions from './pages/threados/Decisions';
import Search from './pages/threados/Search';
import Chat from './pages/threados/Chat';
import Notifications from './pages/threados/Notifications';
import CatchMeUp from './pages/threados/CatchMeUp';
import Memory from './pages/threados/Memory';
import AIAssistant from './pages/threados/AIAssistant';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
      <Route path="/workspace/:workspaceId" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="search" element={<Search />} />
        <Route path="catchup" element={<CatchMeUp />} />
        <Route path="memory" element={<Memory />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
