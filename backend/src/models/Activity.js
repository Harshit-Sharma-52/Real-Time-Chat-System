import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['task', 'project', 'decision', 'member', 'message', 'file', 'workspace'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  entity: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ workspace: 1, entityType: 1 });

export default mongoose.model('Activity', activitySchema);
