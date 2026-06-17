import express from 'express';
import auth from '../middleware/auth.js';
import {
  createNote,
  updateNote,
  deleteNote,
  getUserNotes,
  getNoteById
} from '../controllers/noteController.js';

const router = express.Router();

router.post('/', auth, createNote);
router.put('/:id', auth, updateNote);
router.delete('/:id', auth, deleteNote);
router.get('/user/:userId', auth, getUserNotes);
router.get('/:id', auth, getNoteById);

export default router;
