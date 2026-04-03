const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { sendPushNotification } = require('../config/webpush');
const mongoose = require('mongoose');

/**
 * Fire web push after an in-app notification is created (e.g. from replyController).
 * Does not throw; failures are ignored.
 */
async function sendWebPushForCommentNotification(recipientId, type, postId, commentText) {
  try {
    if (!recipientId || !type || postId == null) return;

    const doc = await PushSubscription.findOne({ anonId: recipientId }).lean();
    if (!doc?.subscription) return;

    const postIdStr = String(postId);
    const url = `/post/${postIdStr}`;
    const body = String(commentText || '').slice(0, 60);

    let title;
    if (type === 'comment_on_post') {
      title = 'someone dumped on your post 💬';
    } else if (type === 'reply_on_comment') {
      title = 'someone replied to your comment ↩️';
    } else {
      return;
    }

    await sendPushNotification(doc.subscription, { title, body, url });
  } catch {
    /* silent */
  }
}

const getNotifications = asyncHandler(async (req, res) => {
  const { recipientId } = req.query;

  if (!recipientId) {
    return sendError(res, 'recipientId is required', 400);
  }

  const notifications = await Notification.find({ recipientId, read: false })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return sendSuccess(res, { notifications });
});

const markAllRead = asyncHandler(async (req, res) => {
  const { recipientId } = req.query;

  if (!recipientId) {
    return sendError(res, 'recipientId is required', 400);
  }

  await Notification.updateMany({ recipientId, read: false }, { $set: { read: true } });

  return sendSuccess(res, {}, 'All notifications marked read');
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { recipientId } = req.query;

  if (!recipientId) {
    return sendError(res, 'recipientId is required', 400);
  }

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 'Invalid notification id', 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId },
    { $set: { read: true } },
    { new: true }
  ).lean();

  if (!notification) {
    return sendError(res, 'Notification not found', 404);
  }

  return sendSuccess(res, { notification });
});

module.exports = {
  getNotifications,
  markAllRead,
  markNotificationRead,
  sendWebPushForCommentNotification,
};
