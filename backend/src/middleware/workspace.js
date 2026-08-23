import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const requireWorkspace = catchAsync(async (req, res, next) => {
  const workspaceId = req.params.workspaceId;
  if (!workspaceId) {
    throw new ApiError(400, 'Workspace id is required.');
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found.');
  }

  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: req.user._id,
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this workspace.');
  }

  req.workspace = workspace;
  req.membership = membership;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.membership || !roles.includes(req.membership.role)) {
    return next(new ApiError(403, 'Insufficient permissions for this workspace.'));
  }
  next();
};
