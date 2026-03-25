const { detectMood, checkToxicity, getReplysuggestions: fetchSuggestions } = require('../services/aiService');
const Reply = require('../models/Reply');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const createReply = asyncHandler(async (req, res) => {
  const { postId, content, anonymousId } = req.body;

  if (!postId || !content || !anonymousId) {
    return sendError(res, 'postId, content, and anonymousId are required', 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  // ── AI: Toxicity check ──────────────────────────────────────────
  const { toxic } = await checkToxicity(content);
  if (toxic) {
    return sendError(res, "Your reply couldn't be sent. It may contain harmful content.", 400);
  }

  const reply = await Reply.create({ postId, content, anonymousId });
  await Post.findByIdAndUpdate(postId, { $inc: { replyCount: 1 } });

  return sendSuccess(res, { reply }, 'Reply created', 201);
});

const getRepliesByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const replies = await Reply.find({ postId }).sort({ createdAt: -1 }).lean();

  return sendSuccess(res, { replies });
});

module.exports = {
  createReply,
  getRepliesByPost,
};