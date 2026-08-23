import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { analyzeSchema } from '../validators/ai.js';
import { extractFromMessage, analyzeText } from '../controllers/aiController.js';

const router = express.Router();

router.post('/extract/:messageId', auth, extractFromMessage);
router.post('/analyze', auth, validate(analyzeSchema), analyzeText);

export default router;
