import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useChatStore, useAuthStore } from '../store';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [friendUpdates, setFriendUpdates] = useState([]);
  const socketRef = useRef(null);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const socketUrl = window.location.origin;
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('getOnlineUsers');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('onlineUsers', ({ users }) => {
      useChatStore.getState().setOnlineUsers(users);
    });

    newSocket.on('userOnline', ({ userId }) => {
      useChatStore.getState().addOnlineUser(userId);
    });

    newSocket.on('userOffline', ({ userId }) => {
      useChatStore.getState().removeOnlineUser(userId);
    });

    newSocket.on('userTyping', ({ chatId, userId, userName, isTyping }) => {
      useChatStore.getState().setTypingUser(chatId, userId, userName, isTyping);
    });

    newSocket.on('newMessage', (message) => {
      useChatStore.getState().addMessage(message);
      useChatStore.getState().updateChatLastMessage(message.chatId, message);
      
      const currentChat = useChatStore.getState().currentChat;
      if (!currentChat || currentChat._id !== message.chatId) {
        useChatStore.getState().incrementUnreadCount(message.chatId);
      }
    });

    newSocket.on('messageRead', ({ messageId }) => {
      useChatStore.setState((state) => ({
        messages: state.messages.map(msg =>
          msg._id === messageId ? { ...msg, status: 'read' } : msg
        )
      }));
    });

    newSocket.on('friendUpdate', (data) => {
      setFriendUpdates((prev) => [data, ...prev].slice(0, 20));
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token, user]);

  const joinChat = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinChat', chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveChat', chatId);
    }
  }, []);

  const sendTyping = useCallback((chatId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { chatId, isTyping });
    }
  }, []);

  const sendMessage = useCallback((data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', data);
    }
  }, []);

  const markAsRead = useCallback((chatId, messageId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAsRead', { chatId, messageId });
    }
  }, []);

  const addReaction = useCallback((messageId, emoji) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('addReaction', { messageId, emoji });
    }
  }, []);

  const removeReaction = useCallback((messageId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('removeReaction', { messageId });
    }
  }, []);

  const clearFriendUpdates = useCallback(() => setFriendUpdates([]), []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      friendUpdates,
      clearFriendUpdates,
      joinChat,
      leaveChat,
      sendTyping,
      sendMessage,
      markAsRead,
      addReaction,
      removeReaction,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
