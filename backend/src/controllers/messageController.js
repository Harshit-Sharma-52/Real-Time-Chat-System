import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const sendMessage = catchAsync(async (req, res) => {
  const { chatId, content, messageType, fileUrl, fileName, threadId } = req.body;

  const chat = await Conversation.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  const isParticipant = chat.participants.some(
    p => p.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'Not a participant of this chat.');
  }

  const message = new Message({
    chatId,
    sender: req.user._id,
    content,
    messageType: messageType || 'text',
    fileUrl,
    fileName,
    threadId: threadId || undefined,
  });

  await message.save();

  chat.lastMessage = message._id;
  await chat.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', '-password')
    .populate('threadId', 'content sender');

  res.status(201).json(populatedMessage);
});

export const editMessage = catchAsync(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new ApiError(400, 'Message content cannot be empty.');
  }

  const message = await Message.findById(req.params.messageId);
  if (!message || message.deletedAt) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findById(message.chatId);
  if (!chat || !chat.participants.some(p => p.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Not a participant of this conversation.');
  }

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only edit your own messages.');
  }

  message.content = content.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const updated = await Message.findById(message._id).populate('sender', '-password');
  res.json(updated);
});

export const deleteMessage = catchAsync(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message || message.deletedAt) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findById(message.chatId);
  if (!chat) throw new ApiError(404, 'Conversation not found.');

  const isParticipant = chat.participants.some(p => p.toString() === req.user._id.toString());
  const isAdmin = chat.admins.some(a => a.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, 'Not a participant of this conversation.');
  if (message.sender.toString() !== req.user._id.toString() && !isAdmin) {
    throw new ApiError(403, 'You can only delete your own messages.');
  }

  message.deletedAt = new Date();
  message.content = '';
  message.fileUrl = '';
  message.messageType = 'system';
  await message.save();

  res.json({ success: true });
});

export const togglePin = catchAsync(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message || message.deletedAt) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findById(message.chatId);
  if (!chat || !chat.participants.some(p => p.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Not a participant of this conversation.');
  }

  message.pinned = !message.pinned;
  await message.save();

  const updated = await Message.findById(message._id).populate('sender', '-password');
  res.json(updated);
});

export const getMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50, threadId } = req.query;

  const chat = await Conversation.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  const isParticipant = chat.participants.some(
    p => p.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'Not a participant of this chat.');
  }

  const baseFilter = { chatId, deletedAt: null };
  if (threadId) {
    baseFilter.threadId = threadId;
  } else {
    baseFilter.threadId = null;
  }

  const messages = await Message.find(baseFilter)
      .populate('sender', '-password')
      .populate('readBy.user', '-password')
      .populate('reactions.user', '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(baseFilter);

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findById(message.chatId);
  if (!chat) {
    throw new ApiError(404, 'Chat not found.');
  }

  const isParticipant = chat.participants.some(
    p => p.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, 'Not a participant of this chat.');
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
});

export const markChatAsRead = catchAsync(async (req, res) => {
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

  const chat = await Conversation.findById(chatId);
  if (chat) {
    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();
  }

  res.json({ success: true });
});

export const addReaction = catchAsync(async (req, res) => {
  const { messageId, emoji } = req.body;

  if (!emoji) {
    throw new ApiError(400, 'Emoji is required.');
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findOne({ _id: message.chatId, participants: req.user._id });
  if (!chat) {
    throw new ApiError(403, 'Not a participant of this conversation.');
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
});

export const removeReaction = catchAsync(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Conversation.findOne({ _id: message.chatId, participants: req.user._id });
  if (!chat) {
    throw new ApiError(403, 'Not a participant of this conversation.');
  }

  message.reactions = message.reactions.filter(
    r => r.user.toString() !== req.user._id.toString()
  );

  await message.save();

  const updatedMessage = await Message.findById(messageId)
    .populate('sender', '-password')
    .populate('reactions.user', '-password');

  res.json(updatedMessage);
});

export const searchMessages = catchAsync(async (req, res) => {
  const { q, chatId } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, 'Search query is required.');
  }

  const userChatIds = await Conversation.find({ participants: req.user._id }).distinct('_id');

  const query = {
    chatId: { $in: userChatIds },
    content: { $regex: q, $options: 'i' },
  };

  if (chatId) {
    if (!userChatIds.some(id => id.toString() === chatId.toString())) {
      throw new ApiError(403, 'Not a participant of this conversation.');
    }
    query.chatId = chatId;
  }

  const messages = await Message.find(query)
    .populate('sender', '-password')
    .populate('chatId')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(messages);
});

export default {
  sendMessage,
  getMessages,
  markAsRead,
  markChatAsRead,
  addReaction,
  removeReaction,
  searchMessages
};
