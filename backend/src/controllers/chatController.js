const ChatRequest = require('../models/ChatRequest');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

const sendChatRequest = asyncHandler(async (req, res) => {
  const { postId, requesterId, authorId } = req.body;

  if (!postId || !requesterId || !authorId) {
    return sendError(res, 'postId, requesterId, and authorId are required', 400);
  }

  if (requesterId === authorId) {
    return sendError(res, 'You cannot request chat with yourself', 400);
  }

  const existing = await ChatRequest.findOne({ postId, requesterId });
  if (existing) {
    return sendError(res, 'Chat request already sent', 400);
  }

  const request = await ChatRequest.create({
    postId,
    requesterId,
    authorId,
    status: 'pending',
  });

  return sendSuccess(res, { request }, 'Chat request sent', 201);
});

const getPendingRequests = asyncHandler(async (req, res) => {
  const { authorId } = req.params;

  const requests = await ChatRequest.find({
    authorId,
    status: 'pending',
  })
    .populate('postId')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { requests });
});

const acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { authorId } = req.body;

  if (!authorId) {
    return sendError(res, 'authorId is required', 400);
  }

  const request = await ChatRequest.findById(requestId);

  if (!request) {
    return sendError(res, 'Chat request not found', 404);
  }

  if (request.authorId !== authorId) {
    return sendError(res, 'Forbidden', 403);
  }

  if (request.status !== 'pending') {
    return sendError(res, 'Request already handled', 400);
  }

  request.status = 'accepted';
  await request.save();

  const chatRoom = await ChatRoom.create({
    postId: request.postId,
    requestId: request._id,
    userA: request.authorId,
    userB: request.requesterId,
  });

  return sendSuccess(res, { chatRoom }, 'Chat request accepted');
});

const declineRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { authorId } = req.body;

  if (!authorId) {
    return sendError(res, 'authorId is required', 400);
  }

  const request = await ChatRequest.findById(requestId);

  if (!request) {
    return sendError(res, 'Chat request not found', 404);
  }

  if (request.authorId !== authorId) {
    return sendError(res, 'Forbidden', 403);
  }

  request.status = 'declined';
  await request.save();

  return sendSuccess(res, {}, 'Chat request declined');
});

// NEW — returns room metadata (createdAt etc.) for timer accuracy
const getRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await ChatRoom.findById(roomId).lean();

  if (!room) {
    return sendError(res, 'Chat room not found', 404);
  }

  return sendSuccess(res, { room });
});

const getMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const messages = await Message.find({ roomId })
    .sort({ createdAt: 1 })
    .lean();

  return sendSuccess(res, { messages });
});

module.exports = {
  sendChatRequest,
  getPendingRequests,
  acceptRequest,
  declineRequest,
  getRoom,
  getMessages,
};