import mongoose from 'mongoose';

const MEMORY_TYPES = ['person', 'project', 'preference', 'fact', 'decision'];

const memorySchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  type: {
    type: String,
    enum: MEMORY_TYPES,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    default: '',
    maxlength: 4000,
  },
  sourceMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  tags: {
    type: [String],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

memorySchema.index({ workspace: 1, type: 1 });
memorySchema.index({ workspace: 1, createdBy: 1 });
memorySchema.index({ workspace: 1, title: 'text', content: 'text' });

export const MEMORY_TYPES_LIST = MEMORY_TYPES;
export default mongoose.model('Memory', memorySchema);
