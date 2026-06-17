import express from 'express';
import auth from '../middleware/auth.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  searchUsers,
  getUserById
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.get('/search', auth, searchUsers);
router.get('/users/:id', auth, getUserById);

export default router;
