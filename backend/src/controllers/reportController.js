const Report = require('../models/Report');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const createReport = asyncHandler(async (req, res) => {
  const { postId, reporterId, reason } = req.body;

  if (!postId || !reporterId || !reason) {
    return sendError(res, 'postId, reporterId, and reason are required', 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  await Report.create({ postId, reporterId, reason });

  return sendSuccess(res, {}, 'Report submitted successfully', 201);
});

module.exports = {
  createReport,
};
