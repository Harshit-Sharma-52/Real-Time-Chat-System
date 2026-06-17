import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType, fileUrl, fileName } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant of this chat.' });
    }

    const message = new Message({
      chatId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      fileUrl,
      fileName
    });

    await message.save();

    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', '-password');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant of this chat.' });
    }

    const messages = await Message.find({ chatId })
      .populate('sender', '-password')
      .populate('readBy.user', '-password')
      .populate('reactions.user', '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const chat = await Chat.findById(message.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant of this chat.' });
    }

    const readIndex = message.readBy.findIndex(
      rb => rb.user.toString() === req.user._id.toString()
    );

    if (readIndex === -1) {
      message.readBy.push({ user: req.user._id, readAt: new Date() });
    } else {
      message.readBy[readIndex].readAt = new Date();
    }

    message.status = 'read';
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { status: 'read' }
      }
    );

    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCount.set(req.user._id.toString(), 0);
      await chat.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', '-password')
      .populate('reactions.user', '-password');

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', '-password')
      .populate('reactions.user', '-password');

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { q, chatId } = req.query;

    const query = { content: { $regex: q, $options: 'i' } };
    if (chatId) {
      query.chatId = chatId;
    }

    const messages = await Message.find(query)
      .populate('sender', '-password')
      .populate('chatId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  sendMessage,
  getMessages,
  markAsRead,
  markChatAsRead,
  addReaction,
  removeReaction,
  searchMessages
};
