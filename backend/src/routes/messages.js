import express from 'express';
import auth from '../middleware/auth.js';
import {
  sendMessage,
  getMessages,
  markAsRead,
  markChatAsRead,
  addReaction,
  removeReaction,
  searchMessages
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', auth, sendMessage);
router.get('/chat/:chatId', auth, getMessages);
router.put('/:messageId/read', auth, markAsRead);
router.put('/chat/:chatId/read', auth, markChatAsRead);
router.post('/reaction', auth, addReaction);
router.delete('/:messageId/reaction', auth, removeReaction);
router.get('/search', auth, searchMessages);

export default router;
