import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [80, 'Workspace name cannot exceed 80 characters'],
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ slug: 1 });

export default mongoose.model('Workspace', workspaceSchema);
