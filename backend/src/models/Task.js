import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const taskSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  sourceMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['Backlog', 'Todo', 'In Progress', 'Blocked', 'Done'],
    default: 'Todo',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  why: {
    type: String,
    default: '',
  },
  comments: [taskCommentSchema],
}, {
  timestamps: true,
});

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, project: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
