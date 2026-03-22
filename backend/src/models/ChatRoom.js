const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
      ref: 'Post',
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Request ID is required'],
      ref: 'ChatRequest',
    },
    userA: {
      type: String,
      required: [true, 'User A is required'],
    },
    userB: {
      type: String,
      required: [true, 'User B is required'],
    },
  },
  {
    timestamps: true,
  }
);

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
