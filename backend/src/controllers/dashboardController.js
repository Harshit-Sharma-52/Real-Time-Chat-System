import Task from '../models/Task.js';
import Conversation from '../models/Conversation.js';
import Project from '../models/Project.js';
import Decision from '../models/Decision.js';
import Activity from '../models/Activity.js';
import catchAsync from '../utils/catchAsync.js';

const STATUS_OPEN = { $in: ['Backlog', 'Todo', 'In Progress', 'Blocked'] };

export const getDashboard = catchAsync(async (req, res) => {
  const workspaceId = req.workspace._id;
  const userId = req.user._id;
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [taskStats, urgent, blocked, dueSoon, projects, unreadConvos, recentDecisions, recentActivity] = await Promise.all([
    Task.aggregate([
      { $match: { workspace: workspaceId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ workspace: workspaceId, priority: { $in: ['Urgent', 'High'] }, status: STATUS_OPEN }),
    Task.countDocuments({ workspace: workspaceId, status: 'Blocked' }),
    Task.countDocuments({ workspace: workspaceId, dueDate: { $lte: soon, $gte: now }, status: STATUS_OPEN }),
    Project.find({ workspace: workspaceId }).sort({ updatedAt: -1 }).limit(10).populate('owner', '-password'),
    Conversation.find({ workspaceId, participants: userId }).lean(),
    Decision.find({ workspace: workspaceId }).sort({ createdAt: -1 }).limit(5).populate('createdBy', '-password'),
    Activity.find({ workspace: workspaceId }).sort({ createdAt: -1 }).limit(10).populate('actor', '-password'),
  ]);

  const statusCounts = { Backlog: 0, Todo: 0, 'In Progress': 0, Blocked: 0, Done: 0 };
  taskStats.forEach((s) => { statusCounts[s._id] = s.count; });

  let unreadConversations = 0;
  unreadConvos.forEach((c) => {
    const v = c.unreadCount ? c.unreadCount[userId.toString()] || 0 : 0;
    if (v) unreadConversations += v;
  });

  res.json({
    taskStats: statusCounts,
    urgentTasks: urgent,
    blockedTasks: blocked,
    dueSoon,
    unreadConversations,
    projects,
    recentDecisions,
    recentActivity,
  });
});
