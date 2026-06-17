import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [500, 'Post cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

postSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
