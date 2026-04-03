const express = require('express');
const router = express.Router();
const { createComment, getCommentsByPost } = require('../controllers/replyController');
const { commentLimiter } = require('../middleware/rateLimiter');

router.post('/', commentLimiter, createComment);
router.get('/:postId', getCommentsByPost);

module.exports = router;
