import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Task from '../models/Task.js';
import Decision from '../models/Decision.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { isAIConfigured, getAIProvider, AINotConfiguredError, AIProviderError } from '../ai/index.js';
import { extractFromMessages, extractFromText } from '../ai/contextEngine.js';
import { logActivity } from '../utils/activity.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

const OPEN = { $in: ['Backlog', 'Todo', 'In Progress', 'Blocked'] };

function parseDueDate(text) {
  if (!text) return null;
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  return null;
}

export const extractFromMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw new ApiError(404, 'Message not found.');

  const chat = await Conversation.findById(message.chatId);
  if (!chat || !chat.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Not a participant of this conversation.');
  }

  const contextMessages = await Message.find({
    chatId: message.chatId,
    createdAt: { $lte: message.createdAt },
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .limit(15)
    .populate('sender', 'name');

  const ordered = [...contextMessages].reverse();

  try {
    if (!isAIConfigured()) {
      return res.json({ configured: false, messageId });
    }
    const extraction = await extractFromMessages(ordered);
    res.json({ configured: true, messageId, extraction });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return res.json({ configured: false, messageId });
    }
    if (err instanceof AIProviderError) {
      return res.status(502).json({ configured: true, error: 'The AI provider returned an error. Verify the API key and model.' });
    }
    throw err;
  }
});

export const analyzeText = catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Text is required.');

  try {
    if (!isAIConfigured()) {
      return res.json({ configured: false });
    }
    const extraction = await extractFromText(text);
    res.json({ configured: true, extraction });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return res.json({ configured: false });
    }
    if (err instanceof AIProviderError) {
      return res.status(502).json({ configured: true, error: 'The AI provider returned an error. Verify the API key and model.' });
    }
    throw err;
  }
});

export const catchMeUp = catchAsync(async (req, res) => {
  const workspaceId = req.workspace._id;
  const userId = req.user._id;

  const membership = await WorkspaceMember.findOne({ workspace: workspaceId, user: userId });
  const since = membership?.lastActiveAt || membership?.joinedAt || new Date(Date.now() - 30 * 864e5);
  const now = new Date();

  const conversations = await Conversation.find({ workspaceId }).lean();

  let missedMessages = 0;
  const needsResponse = [];
  conversations.forEach((c) => {
    const unread = c.unreadCount ? c.unreadCount[userId.toString()] || 0 : 0;
    missedMessages += unread;
    if (unread > 0) {
      needsResponse.push({
        conversationId: c._id,
        name: c.name || 'Conversation',
        unread,
        link: `/chat/${c._id}`,
      });
    }
  });

  const [newTasks, completedTasks, decisions, upcoming, blocked, files] = await Promise.all([
    Task.find({ workspace: workspaceId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50).populate('assignee', 'name'),
    Task.find({ workspace: workspaceId, status: 'Done', updatedAt: { $gte: since } }).sort({ updatedAt: -1 }).limit(50),
    Decision.find({ workspace: workspaceId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50).populate('createdBy', 'name'),
    Task.find({ workspace: workspaceId, dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 864e5) }, status: OPEN }).sort({ dueDate: 1 }).limit(50).populate('assignee', 'name'),
    Task.find({ workspace: workspaceId, status: 'Blocked' }).sort({ updatedAt: -1 }).limit(50).populate('assignee', 'name'),
    (async () => {
      try {
        const Attachment = (await import('../models/Attachment.js')).default;
        return await Attachment.find({ workspace: workspaceId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50);
      } catch {
        return [];
      }
    })(),
  ]);

  const data = {
    since,
    missedMessages,
    newTasks: newTasks.map((t) => ({ _id: t._id, title: t.title, status: t.status, assignee: t.assignee?.name, link: `/workspace/${workspaceId}/tasks` })),
    completedTasks: completedTasks.map((t) => ({ _id: t._id, title: t.title })),
    decisions: decisions.map((d) => ({ _id: d._id, title: d.title, createdBy: d.createdBy?.name, link: `/workspace/${workspaceId}/decisions` })),
    upcomingDeadlines: upcoming.map((t) => ({ _id: t._id, title: t.title, dueDate: t.dueDate, assignee: t.assignee?.name, link: `/workspace/${workspaceId}/tasks` })),
    blocked: blocked.map((t) => ({ _id: t._id, title: t.title, assignee: t.assignee?.name, link: `/workspace/${workspaceId}/tasks` })),
    filesShared: files.map((f) => ({ _id: f._id, name: f.originalName || f.fileName, link: `/workspace/${workspaceId}/search` })),
    needsResponse,
  };

  let digest = null;
  let aiError = null;
  if (isAIConfigured()) {
    try {
      const provider = getAIProvider();
      digest = await provider.catchMeUp(JSON.stringify({
        missedMessages: data.missedMessages,
        newTasks: data.newTasks.length,
        completedTasks: data.completedTasks.length,
        decisions: data.decisions.length,
        upcomingDeadlines: data.upcomingDeadlines.map((d) => ({ title: d.title, dueDate: d.dueDate })),
        blocked: data.blocked.length,
        needsResponse: data.needsResponse.length,
      }));
    } catch (e) {
      aiError = e.message;
    }
  }

  if (membership && !membership.lastActiveAt || (membership && membership.lastActiveAt && membership.lastActiveAt < now)) {
    membership.lastActiveAt = now;
    await membership.save();
  }

  res.json({ configured: isAIConfigured(), aiError, ...data, digest });
});

export const runAction = catchAsync(async (req, res) => {
  const { text, confirm, sourceMessage } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Action text is required.');

  try {
    if (!isAIConfigured()) {
      return res.json({ configured: false });
    }
    const provider = getAIProvider();
    const interpretation = await provider.runAction(text);

    let executed = false;
    let entity = null;

    if (confirm && (interpretation.action === 'create_task' || interpretation.action === 'create_decision') && req.workspace) {
      if (interpretation.action === 'create_task') {
        const p = interpretation.payload || {};
        const task = await Task.create({
          workspace: req.workspace._id,
          title: p.title || text,
          description: p.description || '',
          priority: p.priority || 'Medium',
          dueDate: parseDueDate(p.deadline),
          sourceMessage: sourceMessage || undefined,
          createdBy: req.user._id,
          aiGenerated: true,
          why: interpretation.message || 'Created from an AI action.',
        });
        await logActivity({ workspace: req.workspace._id, actor: req.user._id, action: 'task.created', entityType: 'task', entityId: task._id, entity: task.title });
        entity = task;
      } else {
        const p = interpretation.payload || {};
        const decision = await Decision.create({
          workspace: req.workspace._id,
          title: p.title || text,
          explanation: p.summary || '',
          sourceMessage: sourceMessage || undefined,
          createdBy: req.user._id,
          aiGenerated: true,
          why: interpretation.message || 'Created from an AI action.',
        });
        await logActivity({ workspace: req.workspace._id, actor: req.user._id, action: 'decision.created', entityType: 'decision', entityId: decision._id, entity: decision.title });
        entity = decision;
      }
      executed = true;
    }

    res.json({ configured: true, interpretation, executed, entity });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return res.json({ configured: false });
    }
    if (err instanceof AIProviderError) {
      return res.status(502).json({ configured: true, error: 'The AI provider returned an error. Verify the API key and model.' });
    }
    throw err;
  }
});

export const getInsights = catchAsync(async (req, res) => {
  const workspaceId = req.workspace._id;
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 864e5);

  const [overdue, blocked, dueSoon, unread] = await Promise.all([
    Task.countDocuments({ workspace: workspaceId, dueDate: { $lt: now }, status: OPEN }),
    Task.countDocuments({ workspace: workspaceId, status: 'Blocked' }),
    Task.countDocuments({ workspace: workspaceId, dueDate: { $gte: now, $lte: soon }, status: OPEN }),
    Conversation.aggregate([
      { $match: { workspaceId } },
      { $project: { unread: { $cond: [{ $gt: [`$unreadCount.${req.user._id.toString()}`, 0] }, `$unreadCount.${req.user._id.toString()}`, 0] } } },
      { $group: { _id: null, total: { $sum: '$unread' } } },
    ]),
  ]);

  const unreadTotal = unread[0]?.total || 0;
  const metrics = { overdue, blocked, dueSoon, unreadTotal };

  const insights = [];
  if (overdue > 0) insights.push({ type: 'overdue', severity: overdue > 5 ? 'critical' : 'warning', title: `${overdue} overdue tasks`, detail: 'These tasks have passed their due date and are still open.' });
  if (blocked > 0) insights.push({ type: 'blocked', severity: 'warning', title: `${blocked} blocked tasks`, detail: 'Blocked work is stalling progress; consider unblocking or reassigning.' });
  if (dueSoon > 0) insights.push({ type: 'deadline', severity: 'info', title: `${dueSoon} deadlines this week`, detail: 'Upcoming deadlines need attention soon.' });
  if (unreadTotal > 0) insights.push({ type: 'unanswered', severity: 'info', title: `${unreadTotal} unread messages`, detail: 'Some conversations may need a response.' });

  let aiInsights = null;
  if (isAIConfigured()) {
    try {
      const provider = getAIProvider();
      aiInsights = await provider.generateInsights(JSON.stringify(metrics));
    } catch {
      aiInsights = null;
    }
  }

  res.json({ configured: isAIConfigured(), metrics, insights: aiInsights?.insights || insights });
});
