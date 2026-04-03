const { detectMood, checkToxicity, getReplySuggestions: fetchSuggestions } = require('../services/aiService');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { uploadImage } = require('../services/cloudinaryService');
const { emitNewPost } = require('../sockets/io');

const PINNED_ID = "69c52eb2e7b0e4d16f553786";

const createPost = asyncHandler(async (req, res) => {
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  const { content, anonymousId } = req.body;

  if (!content || !anonymousId) {
    return sendError(res, 'Content and anonymousId are required', 400);
  }

  const { toxic, borderline } = await checkToxicity(content);
  if (toxic) {
    return sendError(res, "Your post couldn't be shared. It may contain harmful content.", 400);
  }

  const mood = await detectMood(content);

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadImage(req.file.buffer, req.file.mimetype);
  }

  const post = await Post.create({ content, anonymousId, imageUrl, mood, flagged: borderline });
  emitNewPost(post);
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

  if (page === 1) {
    const pinnedIndex = posts.findIndex(p => p._id.toString() === PINNED_ID);

    if (pinnedIndex > 0) {
      const [pinned] = posts.splice(pinnedIndex, 1);
      posts.unshift(pinned);
    } else if (pinnedIndex === -1) {
      const pinned = await Post.findById(PINNED_ID).lean();
      if (pinned) posts.unshift(pinned);
    }
  }

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

const getCommentSuggestions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id).lean();
  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  const suggestions = await fetchSuggestions(post.content, post.mood || 'numb');
  return sendSuccess(res, { suggestions });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  getCommentSuggestions,
};