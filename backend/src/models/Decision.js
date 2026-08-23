import mongoose from 'mongoose';

const decisionSchema = new mongoose.Schema({
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
    required: [true, 'Decision title is required'],
    trim: true,
    maxlength: [200, 'Decision title cannot exceed 200 characters'],
  },
  explanation: {
    type: String,
    default: '',
    maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  why: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

decisionSchema.index({ workspace: 1, project: 1 });
decisionSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('Decision', decisionSchema);
