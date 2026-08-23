import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema
} from '../validators/auth.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  searchUsers,
  getUserById
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, getMe);
router.put('/profile', auth, validate(updateProfileSchema), updateProfile);
router.get('/search', auth, searchUsers);
router.get('/users/:id', auth, getUserById);

export default router;
