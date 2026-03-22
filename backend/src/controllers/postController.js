const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const createPost = asyncHandler(async (req, res) => {
  const { content, anonymousId } = req.body;

  if (!content || !anonymousId) {
    return sendError(res, 'Content and anonymousId are required', 400);
  }

  const post = await Post.create({ content, anonymousId });
  return sendSuccess(res, { post }, 'Post created', 201);
});

const getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [total, posts] = await Promise.all([
    Post.countDocuments(),
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return sendSuccess(res, {
    total,
    page,
    limit,
    posts,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);

  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  return sendSuccess(res, { post });
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { anonymousId } = req.body;

  const post = await Post.findById(id);

  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  if (post.anonymousId !== anonymousId) {
    return sendError(res, 'You can only delete your own posts', 403);
  }

  await Post.findByIdAndDelete(id);
  return sendSuccess(res, {}, 'Post deleted successfully');
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  deletePost,
};
