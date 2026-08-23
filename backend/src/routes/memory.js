import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { memoryCreateSchema, memoryUpdateSchema } from '../validators/ai.js';
import { listMemory, createMemory, updateMemory, deleteMemory } from '../controllers/memoryController.js';

const router = express.Router();

router.get('/', listMemory);
router.post('/', auth, validate(memoryCreateSchema), createMemory);
router.put('/:memoryId', auth, validate(memoryUpdateSchema), updateMemory);
router.delete('/:memoryId', auth, deleteMemory);

export default router;
