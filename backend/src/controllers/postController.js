import Post from '../models/Post.js';
import Chat from '../models/Chat.js';
import { getIO } from '../socket/emitter.js';

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required.' });
    }

    const post = new Post({
      user: req.user._id,
      content: content.trim()
    });

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', '-password');

    const io = getIO();
    if (io) {
      const chats = await Chat.find({ participants: req.user._id });
      const notified = new Set();
      for (const chat of chats) {
        for (const pid of chat.participants) {
          const pidStr = pid.toString();
          if (pidStr !== req.user._id.toString() && !notified.has(pidStr)) {
            notified.add(pidStr);
            io.to(`chat:${chat._id}`).emit('friendUpdate', {
              type: 'post',
              user: populated.user,
              content: populated.content,
              createdAt: populated.createdAt
            });
          }
        }
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('CreatePost error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ user: userId })
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ user: userId });

    res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('GetUserPosts error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('DeletePost error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createPost,
  getUserPosts,
  deletePost
};
