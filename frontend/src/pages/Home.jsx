import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useChatStore } from '../store';
import { useSocket } from '../context/SocketContext';
import ProfileModal from '../components/ProfileModal';
import UserProfileModal from '../components/UserProfileModal';
import FriendNotification from '../components/FriendNotification';
import SharedMedia from '../components/SharedMedia';
import { uploadService } from '../services/api';
import toImage from '../../images/to.png';

export const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const chats = useChatStore((state) => state.chats);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const typingUsersByName = useChatStore((state) => state.typingUsersByName);
  const createPrivateChat = useChatStore((state) => state.createPrivateChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  
  const { joinChat, leaveChat, sendTyping, sendMessage, friendUpdates, clearFriendUpdates } = useSocket();

  const [selectedChat, setSelectedChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      setCurrentChat(selectedChat);
      joinChat(selectedChat._id);
      setShowChat(true);
      return () => leaveChat(selectedChat._id);
    }
  }, [selectedChat, joinChat, leaveChat, setCurrentChat]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const response = await fetch(`/api/auth/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
        });
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results.filter(u => u._id !== user?._id));
          setShowSearch(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setShowSearch(false);
      setSearchResults([]);
    }
  }, [user?._id]);

  const handleNewChat = useCallback(async (selectedUser) => {
    const chat = await createPrivateChat(selectedUser._id);
    if (chat) {
      setSelectedChat(chat);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [createPrivateChat]);

  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat);
  }, []);

  const handleBack = useCallback(() => {
    setShowChat(false);
    setSelectedChat(null);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  }, [darkMode]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderAvatar = (person, size = 'w-10 h-10', textSize = 'font-medium') => {
    if (person?.avatar) {
      return <img src={person.avatar} alt="" className={`${size} rounded-full object-cover`} />;
    }
    return (
      <div className={`${size} bg-blue-500 rounded-full flex items-center justify-center text-white ${textSize}`}>
        {getInitials(person?.name)}
      </div>
    );
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') return chat.name || 'Group';
    const other = chat.participants?.find(p => String(p._id) !== String(user?._id));
    return other?.name || 'Unknown';
  };

  const getMessagePreview = (msg) => {
    if (!msg) return '';
    if (msg.messageType === 'image') return '📷 Photo';
    if (msg.messageType === 'audio') return '🎤 Voice message';
    if (msg.messageType === 'file') return '📎 File';
    return msg.content ? msg.content.slice(0, 40) : '';
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Hidden on mobile when chat is open */}
      <div className={`${showChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <img src={toImage} alt="ThreadOS" className="h-8 w-auto object-contain" />
            <div className="flex gap-2">
              <button onClick={() => navigate('/workspaces')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" type="button" title="Workspaces">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
              <button onClick={() => setShowCreateGroup(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" type="button">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" type="button">
                {darkMode ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                {searchResults.map((result) => (
                  <button
                    key={result._id}
                    onClick={() => handleNewChat(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    type="button"
                  >
                    {result.avatar ? (
                      <img src={result.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                        {getInitials(result.name)}
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-800 dark:text-white">{result.name}</p>
                      <p className="text-xs text-gray-500 truncate">{result.email}</p>
                      {result.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{result.bio}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Search for users to start chatting</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const unread = unreadCounts[chat._id] || 0;
              
              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  type="button"
                >
                  <div className="relative shrink-0">
                    {chat.type === 'group'
                      ? (chat.avatar
                        ? <img src={chat.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        : <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">{getInitials(chat.name)}</div>
                      )
                      : renderAvatar(chat.participants?.find(p => String(p._id) !== String(user?._id)), 'w-12 h-12', 'font-medium')
                    }
                    {chat.type !== 'group' && chat.participants?.some(p => onlineUsers.includes(String(p._id))) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 dark:text-white truncate">{getChatName(chat)}</p>
                      <p className="text-xs text-gray-500 ml-2">{formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{getMessagePreview(chat.lastMessage)}</p>
                  </div>
                  
                  {unread > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{unread > 9 ? '9+' : unread}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-2">
            <button onClick={() => setViewingUser(user)} className="shrink-0" type="button">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials(user?.name)}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <button onClick={() => setViewingUser(user)} className="w-full text-left" type="button">
                <p className="font-medium text-gray-800 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{user.bio}</p>}
              </button>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shrink-0" type="button" title="Logout">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Window - Full width on mobile when chat is selected */}
      <div className={`${!showChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50 dark:bg-gray-900`}>
        <ChatArea 
          chat={selectedChat} 
          user={user}
          onlineUsers={onlineUsers}
          typingUsersByName={typingUsersByName}
          sendTyping={sendTyping}
          sendMessage={sendMessage}
          onBack={handleBack}
          showBackButton={true}
          onViewProfile={setViewingUser}
        />
      </div>

      {showCreateGroup && (
        <CreateGroupModal 
          onClose={() => setShowCreateGroup(false)} 
          onCreate={(name, desc, participants) => {
            createGroupChat(name, desc, participants);
            setShowCreateGroup(false);
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {viewingUser && (
        <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} onEditProfile={() => setShowProfileModal(true)} />
      )}

      <FriendNotification updates={friendUpdates} onClear={clearFriendUpdates} />
    </div>
  );
};

const ChatArea = ({ chat, user, onlineUsers, typingUsersByName, sendTyping, sendMessage, onBack, showBackButton, onViewProfile }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showMedia, setShowMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  
  const fetchMessages = useChatStore((state) => state.fetchMessages);

  useEffect(() => {
    if (chat) {
      fetchMessages(chat._id).then(data => {
        if (data?.messages) {
          setMessages(data.messages);
        }
      });
    } else {
      setMessages([]);
    }
  }, [chat?._id, fetchMessages]);

  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state) => {
      if (chat && state.messages.length > 0) {
        const chatMsgs = state.messages.filter(m => String(m.chatId) === String(chat._id));
        if (chatMsgs.length > 0) {
          setMessages(prev => {
            const newMsgs = [...prev];
            chatMsgs.forEach(m => {
              if (!newMsgs.find(x => x._id === m._id)) {
                newMsgs.push(m);
              }
            });
            return newMsgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });
        }
      }
    });
    
    return () => unsubscribe();
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Select a chat</h2>
          <p className="text-gray-500">Choose a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const otherParticipant = chat.participants?.find(p => String(p._id) !== String(user?._id));
  const isOnline = otherParticipant && onlineUsers.includes(String(otherParticipant._id));
  const typingUsers = typingUsersByName?.[chat._id] || {};
  const typingNames = Object.values(typingUsers);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getChatName = () => {
    if (chat.type === 'group') return chat.name || 'Group';
    return otherParticipant?.name || 'Unknown';
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    const msgData = {
      chatId: chat._id,
      content: message.trim(),
      messageType: 'text',
    };
    
    sendMessage(msgData);
    sendTyping(chat._id, false);
    setMessage('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadService.uploadFile(file);
      sendMessage({
        chatId: chat._id,
        content: file.name,
        messageType: result.messageType,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

        setUploading(true);
        try {
          const result = await uploadService.uploadFile(file);
          sendMessage({
            chatId: chat._id,
            content: '🎤 Voice message',
            messageType: 'audio',
            fileUrl: result.fileUrl,
            fileName: result.fileName,
          });
        } catch (err) {
          console.error('Upload failed:', err);
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    sendTyping(chat._id, true);
    setTimeout(() => sendTyping(chat._id, false), 2000);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {showBackButton && (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg md:hidden" type="button">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <button
          onClick={() => {
            if (chat.type !== 'group' && otherParticipant && onViewProfile) {
              onViewProfile(otherParticipant);
            }
          }}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          type="button"
        >
          <div className="relative shrink-0">
            {chat.type === 'group'
              ? (chat.avatar
                ? <img src={chat.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">{getInitials(chat.name)}</div>
              )
              : (otherParticipant?.avatar
                ? <img src={otherParticipant.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">{getInitials(otherParticipant?.name)}</div>
              )
            }
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-800 dark:text-white truncate">{getChatName()}</h2>
            <p className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {chat.type !== 'group' && otherParticipant?.bio ? (
                <span className="truncate block max-w-[200px]">{otherParticipant.bio}</span>
              ) : (
                isOnline ? 'Online' : chat.type === 'group' ? `${chat.participants?.length || 0} members` : 'Offline'
              )}
            </p>
          </div>
        </button>
        <button
          onClick={() => setShowMedia(!showMedia)}
          className={`p-2 rounded-lg transition ${showMedia ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}
          type="button"
          title="Shared Media"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {showMedia ? (
        <div className="flex-1 overflow-hidden">
          <SharedMedia chatId={chat._id} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = String(msg.sender?._id) === String(user?._id);
            const sender = msg.sender;
            return (
              <div key={msg._id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="shrink-0 self-end mb-1">
                    {sender?.avatar
                      ? <img src={sender.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">{getInitials(sender?.name)}</div>
                    }
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isOwn 
                    ? 'bg-blue-500 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md'
                }`}>
                  {!isOwn && chat.type === 'group' && sender?.name && (
                    <p className="text-xs font-medium text-blue-500 mb-1">{sender.name}</p>
                  )}
                  {msg.messageType === 'image' && msg.fileUrl && (
                    <img src={msg.fileUrl} alt="" className="max-w-full rounded-lg mb-2" />
                  )}
                  {msg.messageType === 'audio' && msg.fileUrl && (
                    <audio src={msg.fileUrl} controls className="w-full max-w-[250px] h-10" preload="metadata" />
                  )}
                  <p className="whitespace-pre-wrap">{msg.content || (msg.messageType === 'image' ? '📷 Photo' : msg.messageType === 'audio' ? '🎤 Voice message' : msg.messageType === 'file' ? '📎 File' : '')}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{typingNames[0]} is typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      )}

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            type="button"
            title="Attach file"
          >
            {uploading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>
          <button
            onClick={recording ? handleStopRecording : handleStartRecording}
            disabled={uploading}
            className={`p-2 rounded-lg transition disabled:opacity-50 ${
              recording
                ? 'bg-red-100 dark:bg-red-900 text-red-600 animate-pulse'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            type="button"
            title={recording ? 'Stop recording' : 'Record voice'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <div className="flex-1">
            <textarea
              value={message}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const response = await fetch(`/api/auth/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` },
        });
        if (response.ok) {
          const results = await response.json();
          const userId = useAuthStore.getState().user?._id;
          setSearchResults(results.filter(u => u._id !== userId && !selectedUsers.find(s => s._id === u._id)));
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create Group</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Enter group name" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Group description" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Members (min 2)</label>
            <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Search users..." />
            
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {searchResults.map((result) => (
                  <button key={result._id} onClick={() => {
                    setSelectedUsers([...selectedUsers, result]);
                    setSearchResults(searchResults.filter(r => r._id !== result._id));
                    setSearchQuery('');
                  }} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700" type="button">
                    <span className="text-sm text-gray-800 dark:text-white">{result.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUsers.map((u) => (
                <span key={u._id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  {u.name}
                  <button onClick={() => setSelectedUsers(selectedUsers.filter(s => s._id !== u._id))} className="ml-1" type="button">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white" type="button">Cancel</button>
          <button onClick={() => name && selectedUsers.length >= 2 && onCreate(name, desc, selectedUsers.map(u => u._id))}
            disabled={!name || selectedUsers.length < 2}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50" type="button">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
