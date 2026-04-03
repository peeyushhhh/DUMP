const express = require('express');
const router = express.Router();
const { getVapidPublicKey, savePushSubscription } = require('../controllers/pushController');

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe', savePushSubscription);

module.exports = router;
