import Decision from '../models/Decision.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { logActivity, notify } from '../utils/activity.js';

export const createDecision = catchAsync(async (req, res) => {
  const { title, explanation, project, conversation, sourceMessage } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'Decision title is required.');

  if (project) {
    const proj = await Project.findOne({ _id: project, workspace: req.workspace._id });
    if (!proj) throw new ApiError(400, 'Project does not belong to this workspace.');
  }
  if (sourceMessage) {
    const msg = await Message.findOne({ _id: sourceMessage, workspaceId: req.workspace._id });
    if (!msg) throw new ApiError(400, 'Source message does not belong to this workspace.');
  }

  const decision = await Decision.create({
    workspace: req.workspace._id,
    project: project || undefined,
    conversation: conversation || undefined,
    sourceMessage: sourceMessage || undefined,
    title: title.trim(),
    explanation: explanation || '',
    createdBy: req.user._id,
  });

  await logActivity({
    workspace: req.workspace._id,
    actor: req.user._id,
    action: 'decision.created',
    entityType: 'decision',
    entityId: decision._id,
    entity: decision.title,
  });

  if (project) {
    const proj = await Project.findById(project);
    (proj?.members || []).forEach((m) => {
      if (m.toString() !== req.user._id.toString()) {
        notify({
          user: m,
          workspace: req.workspace._id,
          type: 'decision',
          title: 'New decision recorded',
          body: decision.title,
          link: `/${req.workspace._id}/decisions/${decision._id}`,
        });
      }
    });
  }

  res.status(201).json(decision);
});

export const listDecisions = catchAsync(async (req, res) => {
  const { project } = req.query;
  const filter = { workspace: req.workspace._id };
  if (project) filter.project = project;

  const decisions = await Decision.find(filter)
    .populate('createdBy', '-password')
    .populate('project', 'name')
    .populate('sourceMessage', 'content chatId')
    .sort({ createdAt: -1 });

  res.json(decisions);
});

export const getDecision = catchAsync(async (req, res) => {
  const decision = await Decision.findOne({ _id: req.params.decisionId, workspace: req.workspace._id })
    .populate('createdBy', '-password')
    .populate('project', 'name')
    .populate('sourceMessage', 'content chatId sender');

  if (!decision) throw new ApiError(404, 'Decision not found.');

  res.json(decision);
});

export const updateDecision = catchAsync(async (req, res) => {
  const { title, explanation } = req.body;
  const decision = await Decision.findOne({ _id: req.params.decisionId, workspace: req.workspace._id });
  if (!decision) throw new ApiError(404, 'Decision not found.');

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'Title cannot be empty.');
    decision.title = title.trim();
  }
  if (explanation !== undefined) decision.explanation = explanation;

  await decision.save();
  res.json(decision);
});

export const deleteDecision = catchAsync(async (req, res) => {
  const decision = await Decision.findOne({ _id: req.params.decisionId, workspace: req.workspace._id });
  if (!decision) throw new ApiError(404, 'Decision not found.');

  const isCreator = decision.createdBy.toString() === req.user._id.toString();
  if (!isCreator && !['owner', 'admin'].includes(req.membership.role)) {
    throw new ApiError(403, 'Only the creator or workspace admin can delete this decision.');
  }

  await decision.deleteOne();
  res.json({ success: true });
});
