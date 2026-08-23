import express from 'express';
import auth from '../middleware/auth.js';
import {
  listNotifications,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(auth);

router.get('/', listNotifications);
router.put('/:notificationId/read', markRead);
router.put('/read-all', markAllRead);

export default router;
