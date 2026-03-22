const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, deletePost } = require('../controllers/postController');
const { postLimiter } = require('../middleware/rateLimiter');

router.post('/', postLimiter, createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);

module.exports = router;
