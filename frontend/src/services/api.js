const API_BASE = '/api';

const getToken = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || null;
    }
  } catch (e) {
    console.error('Error reading token:', e);
  }
  return null;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

export const authService = {
  register: (data) => apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMe: () => apiFetch('/auth/me'),
  
  updateProfile: (data) => apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  searchUsers: (query) => apiFetch(`/auth/search?q=${encodeURIComponent(query)}`),
};

export const chatService = {
  getOrCreatePrivateChat: (userId) => apiFetch('/chats/private', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
  
  createGroupChat: (data) => apiFetch('/chats/group', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getUserChats: () => apiFetch('/chats'),
  
  getChatById: (chatId) => apiFetch(`/chats/${chatId}`),

  updateChatSettings: (chatId, data) => apiFetch(`/chats/${chatId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getPinnedMessages: (chatId) => apiFetch(`/chats/${chatId}/pinned`),
  
  addParticipant: (chatId, userId) => apiFetch('/chats/add-participant', {
    method: 'POST',
    body: JSON.stringify({ chatId, userId }),
  }),
  
  removeParticipant: (chatId, userId) => apiFetch('/chats/remove-participant', {
    method: 'POST',
    body: JSON.stringify({ chatId, userId }),
  }),
};

export const messageService = {
  sendMessage: (data) => apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getMessages: (chatId, page = 1, limit = 50, threadId = null) => 
    apiFetch(`/messages/chat/${chatId}?page=${page}&limit=${limit}${threadId ? `&threadId=${threadId}` : ''}`),
  
  editMessage: (messageId, content) => apiFetch(`/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  }),

  deleteMessage: (messageId) => apiFetch(`/messages/${messageId}`, {
    method: 'DELETE',
  }),

  togglePin: (messageId) => apiFetch(`/messages/${messageId}/pin`, {
    method: 'PUT',
  }),
  
  markAsRead: (messageId) => apiFetch(`/messages/${messageId}/read`, {
    method: 'PUT',
  }),
  
  markChatAsRead: (chatId) => apiFetch(`/messages/chat/${chatId}/read`, {
    method: 'PUT',
  }),
  
  addReaction: (messageId, emoji) => apiFetch('/messages/reaction', {
    method: 'POST',
    body: JSON.stringify({ messageId, emoji }),
  }),
  
  removeReaction: (messageId) => apiFetch(`/messages/${messageId}/reaction`, {
    method: 'DELETE',
  }),
  
  searchMessages: (query, chatId) => 
    apiFetch(`/messages/search?q=${encodeURIComponent(query)}${chatId ? `&chatId=${chatId}` : ''}`),
};

export const workspaceService = {
  createWorkspace: (data) => apiFetch('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getMyWorkspaces: () => apiFetch('/workspaces/mine'),

  getWorkspace: (workspaceId) => apiFetch(`/workspaces/${workspaceId}`),

  updateWorkspace: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteWorkspace: (workspaceId) => apiFetch(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  }),

  listMembers: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/members`),

  addMember: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateMemberRole: (workspaceId, memberId, role) =>
    apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  removeMember: (workspaceId, memberId) =>
    apiFetch(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  leaveWorkspace: (workspaceId) =>
    apiFetch(`/workspaces/${workspaceId}/leave`, { method: 'POST' }),

  getDashboard: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/dashboard`),
};

export const projectService = {
  listProjects: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/projects`),
  getProject: (workspaceId, projectId) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}`),
  createProject: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProject: (workspaceId, projectId, data) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProject: (workspaceId, projectId) => apiFetch(`/workspaces/${workspaceId}/projects/${projectId}`, {
    method: 'DELETE',
  }),
};

export const taskService = {
  listTasks: (workspaceId, query = '') => apiFetch(`/workspaces/${workspaceId}/tasks${query}`),
  getTask: (workspaceId, taskId) => apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`),
  createTask: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTask: (workspaceId, taskId, data) => apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTask: (workspaceId, taskId) => apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`, {
    method: 'DELETE',
  }),
  addComment: (workspaceId, taskId, content) => apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  deleteComment: (workspaceId, taskId, commentId) =>
    apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
};

export const decisionService = {
  listDecisions: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/decisions`),
  getDecision: (workspaceId, decisionId) => apiFetch(`/workspaces/${workspaceId}/decisions/${decisionId}`),
  createDecision: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}/decisions`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDecision: (workspaceId, decisionId, data) => apiFetch(`/workspaces/${workspaceId}/decisions/${decisionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteDecision: (workspaceId, decisionId) => apiFetch(`/workspaces/${workspaceId}/decisions/${decisionId}`, {
    method: 'DELETE',
  }),
};

export const notificationService = {
  listNotifications: (workspaceId = '') => apiFetch(`/notifications${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  markRead: (notificationId) => apiFetch(`/notifications/${notificationId}/read`, { method: 'PUT' }),
  markAllRead: (workspaceId = '') => apiFetch(`/notifications/read-all${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, { method: 'PUT' }),
};

export const searchService = {
  search: (workspaceId, q, type = '') =>
    apiFetch(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}`),
};

export const aiService = {
  analyzeText: (text) => apiFetch('/ai/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  extractMessage: (messageId) => apiFetch(`/ai/extract/${messageId}`, { method: 'POST' }),
  catchMeUp: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/catchup`),
  runAction: (workspaceId, text, confirm = false, sourceMessage = null) =>
    apiFetch(`/workspaces/${workspaceId}/ai-action`, {
      method: 'POST',
      body: JSON.stringify({ text, confirm, sourceMessage }),
    }),
  getInsights: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/insights`),
  getStatus: (workspaceId) => apiFetch(`/workspaces/${workspaceId}/ai-status`),
};

export const memoryService = {
  list: (workspaceId, type = '') => apiFetch(`/workspaces/${workspaceId}/memory${type ? `?type=${type}` : ''}`),
  create: (workspaceId, data) => apiFetch(`/workspaces/${workspaceId}/memory`, { method: 'POST', body: JSON.stringify(data) }),
  update: (workspaceId, memoryId, data) => apiFetch(`/workspaces/${workspaceId}/memory/${memoryId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (workspaceId, memoryId) => apiFetch(`/workspaces/${workspaceId}/memory/${memoryId}`, { method: 'DELETE' }),
};

export const uploadService = {
  uploadFile: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    return response.json();
  },
};

export const postService = {
  createPost: (content) => apiFetch('/posts', {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),

  getUserPosts: (userId, page = 1, limit = 20) =>
    apiFetch(`/posts/user/${userId}?page=${page}&limit=${limit}`),

  deletePost: (postId) => apiFetch(`/posts/${postId}`, {
    method: 'DELETE',
  }),
};

export const noteService = {
  createNote: (data) => apiFetch('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateNote: (id, data) => apiFetch(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteNote: (id) => apiFetch(`/notes/${id}`, {
    method: 'DELETE',
  }),

  getUserNotes: (userId, page = 1, limit = 20) =>
    apiFetch(`/notes/user/${userId}?page=${page}&limit=${limit}`),

  getNoteById: (id) => apiFetch(`/notes/${id}`),
};

export { getToken };
