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
  
  getMessages: (chatId, page = 1, limit = 50) => 
    apiFetch(`/messages/chat/${chatId}?page=${page}&limit=${limit}`),
  
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
