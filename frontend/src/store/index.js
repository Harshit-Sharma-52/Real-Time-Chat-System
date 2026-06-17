import { create } from 'zustand';
import { authService, chatService, messageService } from '../services/api';

const STORAGE_KEY = 'auth-storage';

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.token && parsed?.state?.isAuthenticated) {
        return {
          user: parsed.state.user,
          token: parsed.state.token,
          isAuthenticated: true,
        };
      }
    }
  } catch (e) {
    console.error('Error reading auth:', e);
  }
  return { user: null, token: null, isAuthenticated: false };
};

const saveAuth = (user, token) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: { user, token, isAuthenticated: true }
    }));
  } catch (e) {
    console.error('Error saving auth:', e);
  }
};

const clearAuth = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing auth:', e);
  }
};

export const useAuthStore = create((set, get) => {
  const stored = getStoredAuth();
  
  return {
    user: stored.user,
    token: stored.token,
    isAuthenticated: stored.isAuthenticated,
    isLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const data = await authService.login({ email, password });
        saveAuth(data.user, data.token);
        set({ 
          user: data.user, 
          token: data.token, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return { success: true };
      } catch (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    register: async (name, email, password) => {
      set({ isLoading: true, error: null });
      try {
        const data = await authService.register({ name, email, password });
        saveAuth(data.user, data.token);
        set({ 
          user: data.user, 
          token: data.token, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return { success: true };
      } catch (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    updateProfile: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const result = await authService.updateProfile(data);
        const { user, token } = get();
        saveAuth(result, token);
        set({ user: result, isLoading: false });
        return { success: true };
      } catch (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }
    },

    logout: () => {
      clearAuth();
      set({ user: null, token: null, isAuthenticated: false, error: null });
    },

    checkAuth: async () => {
      const { token } = get();
      if (!token) return false;
      
      try {
        const user = await authService.getMe();
        saveAuth(user, token);
        set({ user, isAuthenticated: true });
        return true;
      } catch (error) {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false });
        return false;
      }
    },
  };
});

export const useChatStore = create((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  typingUsers: {},
  typingUsersByName: {},
  onlineUsers: [],
  unreadCounts: {},
  isLoading: false,
  error: null,

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const chats = await chatService.getUserChats();
      
      const unreadCounts = {};
      chats.forEach(chat => {
        unreadCounts[chat._id] = chat.unreadCount || 0;
      });
      
      set({ chats, unreadCounts, isLoading: false });
    } catch (error) {
      console.error('Fetch chats error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  setCurrentChat: (chat) => {
    set({ currentChat: chat, messages: [] });
    if (chat) {
      const unreadCounts = { ...get().unreadCounts };
      unreadCounts[chat._id] = 0;
      set({ unreadCounts });
    }
  },

  createPrivateChat: async (userId) => {
    try {
      const chat = await chatService.getOrCreatePrivateChat(userId);
      const { chats } = get();
      
      const existingIndex = chats.findIndex(c => c._id === chat._id);
      if (existingIndex >= 0) {
        const newChats = [...chats];
        newChats[existingIndex] = chat;
        set({ chats: newChats });
      } else {
        set({ chats: [chat, ...chats] });
      }
      
      return chat;
    } catch (error) {
      console.error('Create chat error:', error);
      set({ error: error.message });
      return null;
    }
  },

  createGroupChat: async (name, description, participantIds) => {
    try {
      const chat = await chatService.createGroupChat({ name, description, participantIds });
      set({ chats: [chat, ...get().chats] });
      return chat;
    } catch (error) {
      console.error('Create group error:', error);
      set({ error: error.message });
      return null;
    }
  },

  fetchMessages: async (chatId, page = 1) => {
    try {
      const data = await messageService.getMessages(chatId, page);
      
      if (page === 1) {
        set({ messages: data.messages });
      } else {
        set({ messages: [...data.messages, ...get().messages] });
      }
      
      return data;
    } catch (error) {
      console.error('Fetch messages error:', error);
      set({ error: error.message });
      return null;
    }
  },

  addMessage: (message) => {
    const { messages } = get();
    if (!messages.find(m => m._id === message._id)) {
      set({ messages: [...messages, message] });
    }
  },

  setTypingUser: (chatId, userId, userName, isTyping) => {
    const typingUsers = { ...get().typingUsers };
    const typingUsersByName = { ...get().typingUsersByName };
    
    if (!typingUsers[chatId]) typingUsers[chatId] = {};
    if (!typingUsersByName[chatId]) typingUsersByName[chatId] = {};
    
    if (isTyping) {
      typingUsers[chatId][userId] = true;
      typingUsersByName[chatId][userId] = userName;
    } else {
      delete typingUsers[chatId][userId];
      delete typingUsersByName[chatId][userId];
      
      if (Object.keys(typingUsers[chatId]).length === 0) {
        delete typingUsers[chatId];
        delete typingUsersByName[chatId];
      }
    }
    
    set({ typingUsers, typingUsersByName });
  },

  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  addOnlineUser: (userId) => {
    const { onlineUsers } = get();
    if (!onlineUsers.includes(userId)) {
      set({ onlineUsers: [...onlineUsers, userId] });
    }
  },

  removeOnlineUser: (userId) => {
    set({ onlineUsers: get().onlineUsers.filter(id => id !== userId) });
  },

  incrementUnreadCount: (chatId) => {
    const unreadCounts = { ...get().unreadCounts };
    unreadCounts[chatId] = (unreadCounts[chatId] || 0) + 1;
    set({ unreadCounts });
  },

  updateChatLastMessage: (chatId, message) => {
    const chats = get().chats.map(chat => {
      if (chat._id === chatId) {
        return { ...chat, lastMessage: message };
      }
      return chat;
    });
    
    chats.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.updatedAt;
      const bTime = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(bTime) - new Date(aTime);
    });
    
    set({ chats });
  },
}));
