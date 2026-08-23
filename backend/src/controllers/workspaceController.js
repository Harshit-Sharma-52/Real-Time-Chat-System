import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Decision from '../models/Decision.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { logActivity, notify } from '../utils/activity.js';

const ROLES = ['owner', 'admin', 'member', 'guest'];

const populateUser = (query) => query.populate('user', '-password');

export const createWorkspace = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    throw new ApiError(400, 'Workspace name is required.');
  }

  const workspace = await Workspace.create({
    name: name.trim(),
    description: description || '',
    owner: req.user._id,
    isDefault: false,
  });

  const membership = await WorkspaceMember.create({
    workspace: workspace._id,
    user: req.user._id,
    role: 'owner',
  });

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'workspace.created',
    entityType: 'workspace',
    entityId: workspace._id,
    entity: workspace.name,
  });

  res.status(201).json({ workspace, membership });
});

export const getMyWorkspaces = catchAsync(async (req, res) => {
  const memberships = await WorkspaceMember.find({ user: req.user._id })
    .populate('workspace')
    .sort({ createdAt: 1 });

  const workspaces = memberships
    .filter((m) => m.workspace)
    .map((m) => ({
      ...m.workspace.toObject(),
      role: m.role,
    }));

  res.json(workspaces);
});

export const getWorkspace = catchAsync(async (req, res) => {
  const workspace = req.workspace.toObject();
  workspace.role = req.membership.role;
  res.json(workspace);
});

export const updateWorkspace = catchAsync(async (req, res) => {
  const { name, description, avatar } = req.body;
  const workspace = req.workspace;

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, 'Workspace name cannot be empty.');
    workspace.name = name.trim();
  }
  if (description !== undefined) workspace.description = description;
  if (avatar !== undefined) workspace.avatar = avatar;

  await workspace.save();

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'workspace.updated',
    entityType: 'workspace',
    entityId: workspace._id,
    entity: workspace.name,
  });

  res.json(workspace);
});

export const deleteWorkspace = catchAsync(async (req, res) => {
  const workspace = req.workspace;

  await Conversation.deleteMany({ workspaceId: workspace._id });
  await Message.deleteMany({ workspaceId: workspace._id });
  await Project.deleteMany({ workspace: workspace._id });
  await Task.deleteMany({ workspace: workspace._id });
  await Decision.deleteMany({ workspace: workspace._id });
  await Activity.deleteMany({ workspace: workspace._id });
  await Notification.deleteMany({ workspace: workspace._id });
  await WorkspaceMember.deleteMany({ workspace: workspace._id });
  await workspace.deleteOne();

  res.json({ success: true });
});

export const listMembers = catchAsync(async (req, res) => {
  const members = await populateUser(
    WorkspaceMember.find({ workspace: req.workspace._id })
  ).sort({ createdAt: 1 });

  res.json(members.map((m) => ({
    _id: m._id,
    role: m.role,
    joinedAt: m.joinedAt,
    user: m.user,
  })));
});

export const addMember = catchAsync(async (req, res) => {
  const { email, role } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');
  if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role.');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, 'No user found with that email.');

  const existing = await WorkspaceMember.findOne({
    workspace: req.workspace._id,
    user: user._id,
  });
  if (existing) throw new ApiError(400, 'User is already a member.');

  const membership = await WorkspaceMember.create({
    workspace: req.workspace._id,
    user: user._id,
    role,
  });

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'member.joined',
    entityType: 'member',
    entityId: user._id,
    entity: user.name,
  });

  await notify({
    user: user._id,
    workspace: req.workspace._id,
    type: 'system',
    title: 'Added to a workspace',
    body: `You were added to ${req.workspace.name}`,
    link: `/${req.workspace._id}/dashboard`,
  });

  const populated = await populateUser(WorkspaceMember.findById(membership._id));
  res.status(201).json({
    _id: populated._id,
    role: populated.role,
    joinedAt: populated.joinedAt,
    user: populated.user,
  });
});

export const updateMemberRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const { memberId } = req.params;
  if (!ROLES.includes(role)) throw new ApiError(400, 'Invalid role.');

  const member = await WorkspaceMember.findOne({
    _id: memberId,
    workspace: req.workspace._id,
  });
  if (!member) throw new ApiError(404, 'Member not found.');

  const ownerCount = await WorkspaceMember.countDocuments({
    workspace: req.workspace._id,
    role: 'owner',
  });
  if (member.role === 'owner' && role !== 'owner' && ownerCount <= 1) {
    throw new ApiError(400, 'A workspace must have at least one owner.');
  }

  member.role = role;
  await member.save();

  res.json({ _id: member._id, role: member.role, user: member.user });
});

export const removeMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;

  const member = await WorkspaceMember.findOne({
    _id: memberId,
    workspace: req.workspace._id,
  });
  if (!member) throw new ApiError(404, 'Member not found.');

  const ownerCount = await WorkspaceMember.countDocuments({
    workspace: req.workspace._id,
    role: 'owner',
  });
  if (member.role === 'owner' && ownerCount <= 1) {
    throw new ApiError(400, 'Cannot remove the last owner.');
  }

  await WorkspaceMember.deleteOne({ _id: member._id });

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'member.removed',
    entityType: 'member',
    entityId: member.user,
  });

  res.json({ success: true });
});

export const leaveWorkspace = catchAsync(async (req, res) => {
  const member = req.membership;
  const ownerCount = await WorkspaceMember.countDocuments({
    workspace: req.workspace._id,
    role: 'owner',
  });
  if (member.role === 'owner' && ownerCount <= 1) {
    throw new ApiError(400, 'Transfer ownership before leaving the workspace.');
  }

  await WorkspaceMember.deleteOne({ _id: member._id });
  res.json({ success: true });
});
