import express from 'express';
import { listActivity } from '../controllers/activityController.js';

const router = express.Router();

router.get('/', listActivity);

export default router;
