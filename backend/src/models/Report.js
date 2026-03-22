const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
      ref: 'Post',
    },
    reporterId: {
      type: String,
      required: [true, 'Reporter ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [300, 'Reason cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ postId: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
