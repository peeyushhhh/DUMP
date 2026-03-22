const express = require('express');
const router = express.Router();
const {
  sendChatRequest,
  getPendingRequests,
  acceptRequest,
  declineRequest,
  getMessages,
} = require('../controllers/chatController');

router.post('/request', sendChatRequest);
router.get('/requests/:authorId', getPendingRequests);
router.post('/requests/:requestId/accept', acceptRequest);
router.post('/requests/:requestId/decline', declineRequest);
router.get('/room/:roomId/messages', getMessages);

module.exports = router;
