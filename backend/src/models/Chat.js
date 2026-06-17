import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });

export default mongoose.model('Chat', chatSchema);
