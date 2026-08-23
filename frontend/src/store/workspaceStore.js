import { create } from 'zustand';
import { workspaceService } from '../services/api';

const STORAGE_KEY = 'threados-workspace';

const getStoredWorkspace = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const setStoredWorkspace = (id) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  workspaceId: null,
  members: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceService.getMyWorkspaces();
      const storedId = getStoredWorkspace();
      const current =
        workspaces.find((w) => w._id === storedId) || workspaces[0] || null;
      set({ workspaces, currentWorkspace: current, workspaceId: current?._id || null, isLoading: false });
      return workspaces;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return [];
    }
  },

  setCurrentWorkspace: (workspace) => {
    setStoredWorkspace(workspace?._id || null);
    set({ currentWorkspace: workspace, workspaceId: workspace?._id || null });
  },

  selectWorkspaceById: (id) => {
    const { workspaces } = get();
    const ws = workspaces.find((w) => w._id === id) || null;
    if (ws) {
      setStoredWorkspace(id);
      set({ currentWorkspace: ws, workspaceId: id });
    }
    return ws;
  },

  fetchMembers: async (workspaceId) => {
    try {
      const members = await workspaceService.listMembers(workspaceId);
      set({ members });
      return members;
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  clear: () => {
    setStoredWorkspace(null);
    set({ workspaces: [], currentWorkspace: null, workspaceId: null, members: [] });
  },
}));
