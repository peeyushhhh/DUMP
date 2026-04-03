const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const contact = process.env.VAPID_EMAIL;

if (publicKey && privateKey && contact) {
  webpush.setVapidDetails(contact, publicKey, privateKey);
}

/**
 * @param {object} subscription - Browser PushSubscription JSON (endpoint + keys)
 * @param {{ title: string, body: string, url: string }} payload
 */
async function sendPushNotification(subscription, payload) {
  if (!publicKey || !privateKey || !contact) return;
  if (!subscription || !subscription.endpoint) return;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 3600,
    });
  } catch (err) {
    const code = err.statusCode;
    if (code === 410 || code === 404) {
      try {
        await PushSubscription.deleteOne({ 'subscription.endpoint': subscription.endpoint });
      } catch {
        /* silent */
      }
    }
  }
}

module.exports = { sendPushNotification, webpush };
