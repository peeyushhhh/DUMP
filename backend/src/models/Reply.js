const mongoose = require('mongoose');

const MOODS = ['sad', 'angry', 'anxious', 'numb', 'overwhelmed', 'hopeful', 'confused'];

const replySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
      ref: 'Post',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Reply',
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
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
    mood: {
      type: String,
      enum: MOODS,
    },
  },
  {
    timestamps: true,
  }
);

replySchema.index({ postId: 1 });
replySchema.index({ postId: 1, parentId: 1 });
replySchema.index({ parentId: 1 });

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
