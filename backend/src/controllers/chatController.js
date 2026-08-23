import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const getOrCreatePrivateChat = catchAsync(async (req, res) => {
  const { userId, workspaceId } = req.body;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    throw new ApiError(400, 'Cannot create chat with yourself.');
  }

  const otherUser = await User.findById(userId);
  if (!otherUser) {
    throw new ApiError(404, 'User not found.');
  }

  const filter = {
    type: 'private',
    participants: { $all: [currentUserId, userId] },
  };
  if (workspaceId) filter.workspaceId = workspaceId;

  let chat = await Conversation.findOne(filter)
    .populate('participants', '-password')
    .populate('lastMessage');

  if (!chat) {
    chat = new Conversation({
      type: 'private',
      participants: [currentUserId, userId],
      workspaceId: workspaceId || undefined,
    });
    await chat.save();
    chat = await Conversation.findById(chat._id)
      .populate('participants', '-password')
      .populate('lastMessage');
  }

  res.json(chat);
});

export const createGroupChat = catchAsync(async (req, res) => {
  const { name, description, participantIds, workspaceId } = req.body;

  if (!name || !participantIds || participantIds.length < 2) {
    throw new ApiError(400, 'Group name and at least 2 participants required.');
  }

  const participants = [...new Set([req.user._id.toString(), ...participantIds])];

  const chat = new Conversation({
    type: 'group',
    name,
    description,
    participants,
    admins: [req.user._id],
    workspaceId: workspaceId || undefined,
  });

  await chat.save();

  const populatedChat = await Conversation.findById(chat._id)
    .populate('participants', '-password')
    .populate('admins', '-password');

  res.status(201).json(populatedChat);
});

export const getUserChats = catchAsync(async (req, res) => {
  const filter = { participants: req.user._id };
  if (req.query.workspaceId) filter.workspaceId = req.query.workspaceId;

  const chats = await Conversation.find(filter)
    .populate('participants', '-password')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  const chatsWithUnread = chats.map((chat) => {
    const unread = chat.unreadCount?.get(req.user._id.toString()) || 0;
    return { ...chat.toObject(), unreadCount: unread };
  });

  res.json(chatsWithUnread);
});

export const getChatById = catchAsync(async (req, res) => {
  const chat = await Conversation.findById(req.params.chatId)
    .populate('participants', '-password')
    .populate('admins', '-password');

  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  const isParticipant = chat.participants.some(
    p => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'Not a participant of this chat.');
  }

  res.json(chat);
});

export const updateConversationSettings = catchAsync(async (req, res) => {
  const { muted, archived } = req.body;
  const chat = await Conversation.findById(req.params.chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  const isParticipant = chat.participants.some(
    p => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    throw new ApiError(403, 'Not a participant of this chat.');
  }

  if (muted !== undefined) chat.muted = Boolean(muted);
  if (archived !== undefined) chat.archived = Boolean(archived);

  await chat.save();
  res.json(chat);
});

export const getPinnedMessages = catchAsync(async (req, res) => {
  const chat = await Conversation.findById(req.params.chatId);
  if (!chat) throw new ApiError(404, 'Chat not found.');

  const isParticipant = chat.participants.some(
    p => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) throw new ApiError(403, 'Not a participant of this chat.');

  const messages = await Message.find({ chatId: chat._id, pinned: true, deletedAt: null })
    .populate('sender', '-password')
    .sort({ createdAt: 1 });

  res.json(messages);
});

export const addParticipant = catchAsync(async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Conversation.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  if (chat.type !== 'group') {
    throw new ApiError(400, 'Can only add participants to group chats.');
  }

  if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Only admins can add participants.');
  }

  if (chat.participants.includes(userId)) {
    throw new ApiError(400, 'User already in chat.');
  }

  chat.participants.push(userId);
  await chat.save();

  const updatedChat = await Conversation.findById(chatId)
    .populate('participants', '-password')
    .populate('admins', '-password');

  res.json(updatedChat);
});

export const removeParticipant = catchAsync(async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Conversation.findById(chatId);

  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  if (!chat.admins.some(a => a.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Only admins can remove participants.');
  }

  chat.participants = chat.participants.filter(p => p.toString() !== userId);
  chat.admins = chat.admins.filter(a => a.toString() !== userId);
  await chat.save();

  const updatedChat = await Conversation.findById(chatId)
    .populate('participants', '-password')
    .populate('admins', '-password');

  res.json(updatedChat);
});

export default {
  getOrCreatePrivateChat,
  createGroupChat,
  getUserChats,
  getChatById,
  updateConversationSettings,
  getPinnedMessages,
  addParticipant,
  removeParticipant,
};
