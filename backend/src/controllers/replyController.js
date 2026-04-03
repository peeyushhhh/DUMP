const { detectMood, checkToxicity } = require('../services/aiService');
const Reply = require('../models/Reply');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { emitNewNotification, emitNewComment } = require('../sockets/io');
const { sendWebPushForCommentNotification } = require('./notificationController');
const mongoose = require('mongoose');

const MOODS = ['sad', 'angry', 'anxious', 'numb', 'overwhelmed', 'hopeful', 'confused'];

const createComment = asyncHandler(async (req, res) => {
  const { postId, content, anonymousId, parentId } = req.body;

  if (!postId || !content || !anonymousId) {
    return sendError(res, 'postId, content, and anonymousId are required', 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    return sendError(res, 'Post not found', 404);
  }

  const { toxic } = await checkToxicity(content);
  if (toxic) {
    return sendError(res, "Your comment couldn't be sent. It may contain harmful content.", 400);
  }

  let depth = 0;
  let parentDoc = null;

  if (parentId) {
    if (!mongoose.isValidObjectId(parentId)) {
      return sendError(res, 'Invalid parent comment', 400);
    }
    parentDoc = await Reply.findOne({ _id: parentId, postId });
    if (!parentDoc) {
      return sendError(res, 'Parent comment not found', 404);
    }
    if (parentDoc.depth >= 1) {
      return sendError(res, 'You can only reply one level deep', 400);
    }
    depth = 1;
  }

  let mood;
  try {
    const detected = await detectMood(content);
    mood = MOODS.includes(detected) ? detected : undefined;
  } catch {
    mood = undefined;
  }

  const comment = await Reply.create({
    postId,
    content,
    anonymousId,
    parentId: parentId || null,
    depth,
    ...(mood ? { mood } : {}),
  });

  await Post.findByIdAndUpdate(postId, { $inc: { replyCount: 1 } });

  const actorId = anonymousId;

  if (depth === 0 && post.anonymousId && post.anonymousId !== actorId) {
    const notif = await Notification.create({
      recipientId: post.anonymousId,
      type: 'comment_on_post',
      postId,
      commentId: comment._id,
      actorId,
    });
    const lean = notif.toObject();
    emitNewNotification(post.anonymousId, { notification: lean });
    sendWebPushForCommentNotification(post.anonymousId, 'comment_on_post', postId, content);
  }

  if (depth === 1 && parentDoc && parentDoc.anonymousId !== actorId) {
    const notif = await Notification.create({
      recipientId: parentDoc.anonymousId,
      type: 'reply_on_comment',
      postId,
      commentId: comment._id,
      actorId,
    });
    const lean = notif.toObject();
    emitNewNotification(parentDoc.anonymousId, { notification: lean });
    sendWebPushForCommentNotification(parentDoc.anonymousId, 'reply_on_comment', postId, content);
  }

  emitNewComment(postId, comment);

  return sendSuccess(res, { comment }, 'Comment created', 201);
});

const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return sendError(res, 'Invalid post id', 400);
  }

  const all = await Reply.find({ postId }).lean();

  const topLevel = all.filter((r) => !r.parentId);
  topLevel.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const byParent = new Map();
  for (const r of all) {
    if (r.parentId) {
      const key = r.parentId.toString();
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(r);
    }
  }
  for (const [, arr] of byParent) {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const comments = topLevel.map((c) => ({
    ...c,
    replies: byParent.get(c._id.toString()) || [],
  }));

  return sendSuccess(res, { comments });
});

module.exports = {
  createComment,
  getCommentsByPost,
};
