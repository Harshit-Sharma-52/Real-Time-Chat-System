import express from 'express';
import auth from '../middleware/auth.js';
import {
  getOrCreatePrivateChat,
  createGroupChat,
  getUserChats,
  getChatById,
  updateConversationSettings,
  getPinnedMessages,
  addParticipant,
  removeParticipant
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/private', auth, getOrCreatePrivateChat);
router.post('/group', auth, createGroupChat);
router.get('/', auth, getUserChats);
router.get('/:chatId', auth, getChatById);
router.put('/:chatId/settings', auth, updateConversationSettings);
router.get('/:chatId/pinned', auth, getPinnedMessages);
router.post('/add-participant', auth, addParticipant);
router.post('/remove-participant', auth, removeParticipant);

export default router;
