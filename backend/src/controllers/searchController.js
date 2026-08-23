import Message from '../models/Message.js';
import User from '../models/User.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Decision from '../models/Decision.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const search = catchAsync(async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) throw new ApiError(400, 'Search query is required.');

  const workspaceId = req.workspace._id;
  const rx = { $regex: q, $options: 'i' };

  const [messages, memberDocs, projects, tasks, decisions] = await Promise.all([
    Message.find({ workspaceId, content: rx, deletedAt: null })
      .populate('sender', '-password')
      .sort({ createdAt: -1 })
      .limit(10),
    WorkspaceMember.find({ workspace: workspaceId }),
    Project.find({ workspace: workspaceId, name: rx }).limit(10),
    Task.find({ workspace: workspaceId, title: rx }).limit(10),
    Decision.find({ workspace: workspaceId, title: rx }).limit(10),
  ]);

  const memberUserIds = memberDocs.map((m) => m.user);
  const users = await User.find({
    _id: { $in: memberUserIds },
    $or: [{ name: rx }, { email: rx }],
  }).select('-password').limit(10);

  const files = await Message.find({
    workspaceId,
    messageType: { $in: ['image', 'file', 'audio'] },
    $or: [{ fileName: rx }, { content: rx }],
    deletedAt: null,
  }).populate('sender', '-password').limit(10);

  res.json({
    messages,
    users,
    projects,
    tasks,
    decisions,
    files,
  });
});
