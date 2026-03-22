const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Room ID is required'],
    ref: 'ChatRoom',
  },
  senderId: {
    type: String,
    required: [true, 'Sender ID is required'],
  },
  text: {
    type: String,
    required: [true, 'Text is required'],
    trim: true,
    maxlength: [300, 'Text cannot exceed 300 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
