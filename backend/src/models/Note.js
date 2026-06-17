import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  content: { type: String, default: '' }
}, { _id: false });

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, default: 'file' }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  summary: {
    type: String,
    default: '',
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  sections: [sectionSchema],
  files: [fileSchema],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });

export default mongoose.model('Note', noteSchema);
