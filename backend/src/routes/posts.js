import express from 'express';
import auth from '../middleware/auth.js';
import {
  createPost,
  getUserPosts,
  deletePost
} from '../controllers/postController.js';

const router = express.Router();

router.post('/', auth, createPost);
router.get('/user/:userId', auth, getUserPosts);
router.delete('/:postId', auth, deletePost);

export default router;
