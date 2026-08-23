import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const onlineUsers = new Map();

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
  } catch {
    next(new Error('Invalid token'));
  }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const userName = socket.userName;
    
    console.log(`User connected: ${userName} (${userId})`);
    
    onlineUsers.set(userId, socket.id);

    try {
      await User.findByIdAndUpdate(userId, {
        status: 'online',
        socketId: socket.id
      });
    } catch (error) {
      console.error('Error updating user status on connect:', error);
    }

    socket.broadcast.emit('userOnline', { userId });

    socket.emit('connected', { userId });

    socket.on('joinChat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${userName} joined chat ${chatId}`);
    });

    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userName} left chat ${chatId}`);
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      console.log(`Typing event: ${userName} in chat ${chatId}, typing: ${isTyping}`);
      socket.to(`chat:${chatId}`).emit('userTyping', {
        chatId,
        userId,
        userName,
        isTyping
      });
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content, messageType, fileUrl, fileName, threadId } = data;

        const chat = await Conversation.findById(chatId);
        if (!chat) {
          console.error('Chat not found:', chatId);
          return;
        }

        const isParticipant = chat.participants.some(
          p => p.toString() === userId
        );
        if (!isParticipant) {
          console.error('User not a participant:', userId, chatId);
          return;
        }

        const message = new Message({
          chatId,
          sender: userId,
          content,
          messageType: messageType || 'text',
          fileUrl,
          fileName,
          threadId: threadId || null,
          workspaceId: chat.workspaceId || null,
          kind: 'message'
        });

        await message.save();

        chat.lastMessage = message._id;
        await chat.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', '-password');

        io.to(`chat:${chatId}`).emit('newMessage', populatedMessage);

        chat.participants.forEach(participantId => {
          const participantSocketId = onlineUsers.get(participantId.toString());
          if (participantSocketId) {
            io.to(participantSocketId).emit('messageSent', {
              chatId,
              message: populatedMessage
            });
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('markAsRead', async ({ chatId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const readIndex = message.readBy.findIndex(
          rb => rb.user.toString() === userId
        );

        if (readIndex === -1) {
          message.readBy.push({ user: userId, readAt: new Date() });
        } else {
          message.readBy[readIndex].readAt = new Date();
        }

        message.status = 'read';
        await message.save();

        socket.to(`chat:${chatId}`).emit('messageRead', {
          chatId,
          messageId,
          readBy: {
            userId,
            userName,
            readAt: new Date()
          }
        });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    socket.on('addReaction', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const chat = await Conversation.findOne({ _id: message.chatId, participants: userId });
        if (!chat) return;

        const existingReaction = message.reactions.find(
          r => r.user.toString() === userId
        );

        if (existingReaction) {
          existingReaction.emoji = emoji;
        } else {
          message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate('sender', '-password')
          .populate('reactions.user', '-password');

        socket.to(`chat:${message.chatId}`).emit('reactionAdded', updatedMessage);
        socket.emit('reactionAdded', updatedMessage);
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    });

    socket.on('removeReaction', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const chat = await Conversation.findOne({ _id: message.chatId, participants: userId });
        if (!chat) return;

        message.reactions = message.reactions.filter(
          r => r.user.toString() !== userId
        );

        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate('sender', '-password')
          .populate('reactions.user', '-password');

        socket.to(`chat:${message.chatId}`).emit('reactionRemoved', updatedMessage);
        socket.emit('reactionRemoved', updatedMessage);
      } catch (error) {
        console.error('Error removing reaction:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userName} (${userId})`);
      onlineUsers.delete(userId);

      try {
        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }

      socket.broadcast.emit('userOffline', {
        userId,
        lastSeen: new Date()
      });
    });

    socket.on('getOnlineUsers', () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('onlineUsers', { users: onlineUserIds });
    });
  });

  return { io, onlineUsers };
};

export { onlineUsers };
