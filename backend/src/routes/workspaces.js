import express from 'express';
import auth from '../middleware/auth.js';
import config from '../config/index.js';
import { isAIConfigured } from '../ai/index.js';
import validate from '../middleware/validate.js';
import { actionSchema } from '../validators/ai.js';
import { requireWorkspace, requireRole } from '../middleware/workspace.js';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
} from '../controllers/workspaceController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { catchMeUp, runAction, getInsights } from '../controllers/aiController.js';
import memoryRoutes from './memory.js';
import projectRoutes from './projects.js';
import taskRoutes from './tasks.js';
import decisionRoutes from './decisions.js';
import activityRoutes from './activity.js';
import searchRoutes from './search.js';

const router = express.Router();

router.use(auth);

router.post('/', createWorkspace);
router.get('/mine', getMyWorkspaces);

router.get('/:workspaceId', requireWorkspace, getWorkspace);
router.put('/:workspaceId', requireWorkspace, requireRole('owner', 'admin'), updateWorkspace);
router.delete('/:workspaceId', requireWorkspace, requireRole('owner'), deleteWorkspace);
router.post('/:workspaceId/leave', requireWorkspace, leaveWorkspace);

router.get('/:workspaceId/members', requireWorkspace, listMembers);
router.post('/:workspaceId/members', requireWorkspace, requireRole('owner', 'admin'), addMember);
router.put('/:workspaceId/members/:memberId', requireWorkspace, requireRole('owner', 'admin'), updateMemberRole);
router.delete('/:workspaceId/members/:memberId', requireWorkspace, requireRole('owner', 'admin'), removeMember);

router.use('/:workspaceId/projects', requireWorkspace, projectRoutes);
router.use('/:workspaceId/tasks', requireWorkspace, taskRoutes);
router.use('/:workspaceId/decisions', requireWorkspace, decisionRoutes);
router.use('/:workspaceId/activity', requireWorkspace, activityRoutes);
router.use('/:workspaceId/search', requireWorkspace, searchRoutes);
router.use('/:workspaceId/memory', requireWorkspace, memoryRoutes);

router.get('/:workspaceId/dashboard', requireWorkspace, getDashboard);
router.get('/:workspaceId/catchup', requireWorkspace, catchMeUp);
router.get('/:workspaceId/insights', requireWorkspace, getInsights);
router.post('/:workspaceId/ai-action', requireWorkspace, validate(actionSchema), runAction);
router.get('/:workspaceId/ai-status', requireWorkspace, (req, res) => {
  res.json({
    configured: isAIConfigured(),
    provider: config.aiProvider,
  });
});

export default router;
