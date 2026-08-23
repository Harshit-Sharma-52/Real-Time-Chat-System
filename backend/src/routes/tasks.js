import express from 'express';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
} from '../controllers/taskController.js';

const router = express.Router();

router.post('/', createTask);
router.get('/', listTasks);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.post('/:taskId/comments', addComment);
router.delete('/:taskId/comments/:commentId', deleteComment);

export default router;
