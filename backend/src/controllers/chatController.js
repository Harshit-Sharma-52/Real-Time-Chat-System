import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const getOrCreatePrivateChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot create chat with yourself.' });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let chat = await Chat.findOne({
      type: 'private',
      participants: { $all: [currentUserId, userId] }
    }).populate('participants', '-password').populate('lastMessage');

    if (!chat) {
      chat = new Chat({
        type: 'private',
        participants: [currentUserId, userId]
      });
      await chat.save();
      chat = await Chat.findById(chat._id)
        .populate('participants', '-password')
        .populate('lastMessage');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createGroupChat = async (req, res) => {
  try {
    const { name, description, participantIds } = req.body;

    if (!name || !participantIds || participantIds.length < 2) {
      return res.status(400).json({ error: 'Group name and at least 2 participants required.' });
    }

    const participants = [...new Set([req.user._id.toString(), ...participantIds])];

    const chat = new Chat({
      type: 'group',
      name,
      description,
      participants,
      admins: [req.user._id]
    });

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', '-password')
      .populate('admins', '-password');

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const chatsWithUnread = chats.map(chat => {
      const unread = chat.unreadCount?.get(req.user._id.toString()) || 0;
      return { ...chat.toObject(), unreadCount: unread };
    });

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', '-password')
      .populate('admins', '-password');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant of this chat.' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ error: 'Can only add participants to group chats.' });
    }

    if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Only admins can add participants.' });
    }

    if (chat.participants.includes(userId)) {
      return res.status(400).json({ error: 'User already in chat.' });
    }

    chat.participants.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', '-password')
      .populate('admins', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Only admins can remove participants.' });
    }

    chat.participants = chat.participants.filter(p => p.toString() !== userId);
    chat.admins = chat.admins.filter(a => a.toString() !== userId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants', '-password')
      .populate('admins', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getOrCreatePrivateChat,
  createGroupChat,
  getUserChats,
  getChatById,
  addParticipant,
  removeParticipant
};
