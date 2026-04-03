const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAllRead,
  markNotificationRead,
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.patch('/read', markAllRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
