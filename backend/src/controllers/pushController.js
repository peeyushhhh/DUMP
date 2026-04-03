const PushSubscription = require('../models/PushSubscription');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const getVapidPublicKey = asyncHandler(async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return sendError(res, 'Push notifications are not configured', 503);
  }
  return sendSuccess(res, { publicKey });
});

const savePushSubscription = asyncHandler(async (req, res) => {
  const { anonId, subscription } = req.body;

  if (!anonId || !subscription || typeof subscription !== 'object' || !subscription.endpoint) {
    return sendError(res, 'anonId and a valid subscription object are required', 400);
  }

  await PushSubscription.findOneAndUpdate(
    { anonId: String(anonId) },
    { $set: { subscription } },
    { upsert: true, new: true }
  );

  return sendSuccess(res, {}, 'Subscription saved', 201);
});

module.exports = {
  getVapidPublicKey,
  savePushSubscription,
};
