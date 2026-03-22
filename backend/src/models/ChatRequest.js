const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
      ref: 'Post',
    },
    requesterId: {
      type: String,
      required: [true, 'Requester ID is required'],
    },
    authorId: {
      type: String,
      required: [true, 'Author ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'declined'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

chatRequestSchema.index({ postId: 1, requesterId: 1 }, { unique: true });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

module.exports = ChatRequest;
