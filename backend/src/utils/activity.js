import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export async function logActivity({
  workspace,
  actor,
  action,
  entityType,
  entityId,
  entity,
  metadata = {},
}) {
  try {
    await Activity.create({
      workspace,
      actor,
      action,
      entityType,
      entityId,
      entity,
      metadata,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

export async function notify({ user, workspace, type, title, body = '', link = '' }) {
  try {
    if (!user) return;
    await Notification.create({
      user,
      workspace,
      type,
      title,
      body,
      link,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}
