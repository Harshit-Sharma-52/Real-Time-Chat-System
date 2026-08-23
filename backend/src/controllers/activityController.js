import Activity from '../models/Activity.js';
import catchAsync from '../utils/catchAsync.js';

export const listActivity = catchAsync(async (req, res) => {
  const { entityType, limit = 50 } = req.query;
  const filter = { workspace: req.workspace._id };
  if (entityType) filter.entityType = entityType;

  const activities = await Activity.find(filter)
    .populate('actor', '-password')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  res.json(activities);
});
