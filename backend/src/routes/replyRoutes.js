const express = require('express');
const router = express.Router();
const { createReply, getRepliesByPost } = require('../controllers/replyController');
const { replyLimiter } = require('../middleware/rateLimiter');

router.post('/', replyLimiter, createReply);
router.get('/:postId', getRepliesByPost);

module.exports = router;
