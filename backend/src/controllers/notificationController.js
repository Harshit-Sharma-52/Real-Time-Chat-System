import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const listNotifications = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.workspaceId) filter.workspace = req.query.workspaceId;

  const notifications = await Notification.find(filter)
    .populate('workspace', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  const unread = notifications.filter((n) => !n.read).length;

  res.json({ notifications, unread });
});

export const markRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    user: req.user._id,
  });
  if (!notification) throw new ApiError(404, 'Notification not found.');

  notification.read = true;
  await notification.save();
  res.json(notification);
});

export const markAllRead = catchAsync(async (req, res) => {
  const filter = { user: req.user._id, read: false };
  if (req.query.workspaceId) filter.workspace = req.query.workspaceId;

  await Notification.updateMany(filter, { read: true });
  res.json({ success: true });
});
