import Task from '../models/Task.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { logActivity, notify } from '../utils/activity.js';

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Blocked', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const buildFilter = (workspaceId, query) => {
  const filter = { workspace: workspaceId };
  if (query.project) filter.project = query.project;
  if (STATUSES.includes(query.status)) filter.status = query.status;
  if (PRIORITIES.includes(query.priority)) filter.priority = query.priority;
  if (query.assignee === 'me') filter.assignee = query.user;
  else if (query.assignee) filter.assignee = query.assignee;
  return filter;
};

export const createTask = catchAsync(async (req, res) => {
  const {
    title, description, status, priority, assignee,
    dueDate, project, conversation, sourceMessage,
  } = req.body;

  if (!title || !title.trim()) throw new ApiError(400, 'Task title is required.');

  if (project) {
    const proj = await Project.findOne({ _id: project, workspace: req.workspace._id });
    if (!proj) throw new ApiError(400, 'Project does not belong to this workspace.');
  }

  const task = await Task.create({
    workspace: req.workspace._id,
    project: project || undefined,
    conversation: conversation || undefined,
    sourceMessage: sourceMessage || undefined,
    title: title.trim(),
    description: description || '',
    status: STATUSES.includes(status) ? status : 'Todo',
    priority: PRIORITIES.includes(priority) ? priority : 'Medium',
    assignee: assignee || undefined,
    createdBy: req.user._id,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'task.created',
    entityType: 'task',
    entityId: task._id,
    entity: task.title,
  });

  if (assignee && assignee !== req.user._id.toString()) {
    await notify({
      user: assignee,
      workspace: req.workspace._id,
      type: 'task.assigned',
      title: 'You were assigned a task',
      body: task.title,
      link: `/${req.workspace._id}/tasks/${task._id}`,
    });
  }

  res.status(201).json(task);
});

export const listTasks = catchAsync(async (req, res) => {
  const filter = buildFilter(req.workspace._id, { ...req.query, user: req.user._id });
  const tasks = await Task.find(filter)
    .populate('assignee', '-password')
    .populate('createdBy', '-password')
    .populate('project', 'name')
    .populate('sourceMessage', 'content chatId')
    .sort({ dueDate: 1, createdAt: -1 });

  res.json(tasks);
});

export const getTask = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id })
    .populate('assignee', '-password')
    .populate('createdBy', '-password')
    .populate('project', 'name')
    .populate('sourceMessage', 'content chatId sender');

  if (!task) throw new ApiError(404, 'Task not found.');

  res.json(task);
});

export const updateTask = catchAsync(async (req, res) => {
  const { title, description, status, priority, assignee, dueDate } = req.body;
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new ApiError(404, 'Task not found.');

  const prevAssignee = task.assignee?.toString();
  const prevStatus = task.status;

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'Task title cannot be empty.');
    task.title = title.trim();
  }
  if (description !== undefined) task.description = description;
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) throw new ApiError(400, 'Invalid priority.');
    task.priority = priority;
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new ApiError(400, 'Invalid status.');
    task.status = status;
    task.completedAt = status === 'Done' ? new Date() : null;
  }
  if (assignee !== undefined) task.assignee = assignee || undefined;
  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

  await task.save();

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'task.updated',
    entityType: 'task',
    entityId: task._id,
    entity: task.title,
  });

  if (assignee && assignee !== prevAssignee && assignee !== req.user._id.toString()) {
    await notify({
      user: assignee,
      workspace: req.workspace._id,
      type: 'task.assigned',
      title: 'You were assigned a task',
      body: task.title,
      link: `/${req.workspace._id}/tasks/${task._id}`,
    });
  }

  if (status === 'Done' && prevStatus !== 'Done') {
    await logActivity({
      workspace: req.workspace._id,
      actor: req.user._id,
      action: 'task.completed',
      entityType: 'task',
      entityId: task._id,
      entity: task.title,
    });
  }

  res.json(task);
});

export const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new ApiError(404, 'Task not found.');

  const isCreator = task.createdBy.toString() === req.user._id.toString();
  if (!isCreator && !['owner', 'admin'].includes(req.membership.role)) {
    throw new ApiError(403, 'Only the task creator or workspace admin can delete this task.');
  }

  await task.deleteOne();
  res.json({ success: true });
});

export const addComment = catchAsync(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) throw new ApiError(400, 'Comment cannot be empty.');

  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new ApiError(404, 'Task not found.');

  task.comments.push({ user: req.user._id, content: content.trim() });
  await task.save();

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'task.commented',
    entityType: 'task',
    entityId: task._id,
    entity: task.title,
  });

  res.status(201).json(task.comments[task.comments.length - 1]);
});

export const deleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
  if (!task) throw new ApiError(404, 'Task not found.');

  const comment = task.comments.id(commentId);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const isAuthor = comment.user.toString() === req.user._id.toString();
  if (!isAuthor && !['owner', 'admin'].includes(req.membership.role)) {
    throw new ApiError(403, 'Not allowed to delete this comment.');
  }

  task.comments.pull(commentId);
  await task.save();
  res.json({ success: true });
});
