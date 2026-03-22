const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
      ref: 'Post',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [500, 'Content cannot exceed 500 characters'],
    },
    anonymousId: {
      type: String,
      required: [true, 'Anonymous ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

replySchema.index({ postId: 1 });

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
