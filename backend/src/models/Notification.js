const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      required: [true, 'recipientId is required'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['comment_on_post', 'reply_on_comment'],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Reply',
    },
    actorId: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
