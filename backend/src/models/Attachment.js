import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

attachmentSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('Attachment', attachmentSchema);
