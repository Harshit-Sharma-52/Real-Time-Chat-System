import Memory, { MEMORY_TYPES_LIST } from '../models/Memory.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const listMemory = catchAsync(async (req, res) => {
  const { type } = req.query;
  const filter = { workspace: req.workspace._id };
  if (type && MEMORY_TYPES_LIST.includes(type)) filter.type = type;

  const memories = await Memory.find(filter)
    .populate('createdBy', '-password')
    .populate('sourceMessage', 'content chatId')
    .sort({ updatedAt: -1 });

  res.json(memories);
});

export const createMemory = catchAsync(async (req, res) => {
  const { type, title, content, tags, sourceMessage } = req.body;
  if (!MEMORY_TYPES_LIST.includes(type)) throw new ApiError(400, 'Invalid memory type.');
  if (!title || !title.trim()) throw new ApiError(400, 'Memory title is required.');

  const memory = await Memory.create({
    workspace: req.workspace._id,
    type,
    title: title.trim(),
    content: content || '',
    tags: Array.isArray(tags) ? tags : [],
    sourceMessage: sourceMessage || undefined,
    createdBy: req.user._id,
  });

  res.status(201).json(memory);
});

export const updateMemory = catchAsync(async (req, res) => {
  const { type, title, content, tags } = req.body;
  const memory = await Memory.findOne({ _id: req.params.memoryId, workspace: req.workspace._id });
  if (!memory) throw new ApiError(404, 'Memory not found.');

  if (type !== undefined) {
    if (!MEMORY_TYPES_LIST.includes(type)) throw new ApiError(400, 'Invalid memory type.');
    memory.type = type;
  }
  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'Title cannot be empty.');
    memory.title = title.trim();
  }
  if (content !== undefined) memory.content = content;
  if (tags !== undefined) memory.tags = Array.isArray(tags) ? tags : [];

  await memory.save();
  res.json(memory);
});

export const deleteMemory = catchAsync(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.memoryId, workspace: req.workspace._id });
  if (!memory) throw new ApiError(404, 'Memory not found.');

  await memory.deleteOne();
  res.json({ success: true });
});

export { MEMORY_TYPES_LIST };
