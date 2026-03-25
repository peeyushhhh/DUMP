const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [800, 'Content cannot exceed 800 characters'],
    },
    anonymousId: {
      type: String,
      required: [true, 'Anonymous ID is required'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    mood: {
      type: String,
      enum: ["sad", "angry", "anxious", "numb", "overwhelmed", "hopeful", "confused"],
      default: "numb",
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    sentiment: {
      type: String,
      enum: {
        values: ['positive', 'neutral', 'negative'],
        message: '{VALUE} is not a valid sentiment',
      },
      default: 'neutral',
    },
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ anonymousId: 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
