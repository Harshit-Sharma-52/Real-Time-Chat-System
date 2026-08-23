import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { logActivity } from '../utils/activity.js';

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'];

export const createProject = catchAsync(async (req, res) => {
  const { name, description, status, dueDate, members } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Project name is required.');

  const memberIds = Array.isArray(members) ? members : [];
  const uniqueMembers = [...new Set([req.user._id.toString(), ...memberIds])];

  const project = await Project.create({
    workspace: req.workspace._id,
    name: name.trim(),
    description: description || '',
    status: STATUSES.includes(status) ? status : 'Planning',
    owner: req.user._id,
    members: uniqueMembers,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'project.created',
    entityType: 'project',
    entityId: project._id,
    entity: project.name,
  });

  res.status(201).json(project);
});

export const listProjects = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = { workspace: req.workspace._id };
  if (STATUSES.includes(status)) filter.status = status;

  const projects = await Project.find(filter)
    .populate('owner', '-password')
    .populate('members', '-password')
    .sort({ updatedAt: -1 });

  res.json(projects);
});

export const getProject = catchAsync(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    workspace: req.workspace._id,
  })
    .populate('owner', '-password')
    .populate('members', '-password')
    .populate('conversation');

  if (!project) throw new ApiError(404, 'Project not found.');

  const stats = await Task.aggregate([
    { $match: { workspace: req.workspace._id, project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const taskStats = { Backlog: 0, Todo: 0, 'In Progress': 0, Blocked: 0, Done: 0 };
  stats.forEach((s) => { taskStats[s._id] = s.count; });

  res.json({ ...project.toObject(), taskStats });
});

export const updateProject = catchAsync(async (req, res) => {
  const { name, description, status, dueDate, members } = req.body;
  const project = await Project.findOne({
    _id: req.params.projectId,
    workspace: req.workspace._id,
  });
  if (!project) throw new ApiError(404, 'Project not found.');

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, 'Project name cannot be empty.');
    project.name = name.trim();
  }
  if (description !== undefined) project.description = description;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new ApiError(400, 'Invalid status.');
    project.status = status;
    if (status === 'Archived' && !project.archivedAt) project.archivedAt = new Date();
    if (status !== 'Archived') project.archivedAt = null;
  }
  if (dueDate !== undefined) project.dueDate = dueDate ? new Date(dueDate) : undefined;
  if (members !== undefined) {
    project.members = [...new Set([project.owner.toString(), ...members])];
  }

  await project.save();

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'project.updated',
    entityType: 'project',
    entityId: project._id,
    entity: project.name,
  });

  res.json(project);
});

export const deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.projectId,
    workspace: req.workspace._id,
  });
  if (!project) throw new ApiError(404, 'Project not found.');

  const isOwner = project.owner.toString() === req.user._id.toString();
  if (!isOwner && !['owner', 'admin'].includes(req.membership.role)) {
    throw new ApiError(403, 'Only the project owner or workspace admin can delete this project.');
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.json({ success: true });
});
