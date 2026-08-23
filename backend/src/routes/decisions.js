import express from 'express';
import {
  createDecision,
  listDecisions,
  getDecision,
  updateDecision,
  deleteDecision,
} from '../controllers/decisionController.js';

const router = express.Router();

router.post('/', createDecision);
router.get('/', listDecisions);
router.get('/:decisionId', getDecision);
router.put('/:decisionId', updateDecision);
router.delete('/:decisionId', deleteDecision);

export default router;
