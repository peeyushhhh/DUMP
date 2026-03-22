const ChatRequest = require('../models/ChatRequest');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

function initializeSockets(io) {
  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);

    socket.on('register', (anonId) => {
      socket.join(anonId);
    });

    socket.on('send_request', ({ requestId, authorId }) => {
      io.to(authorId).emit('request_received', { requestId });
    });

    socket.on('request_accepted', ({ requestId, requesterId, roomId }) => {
      io.to(requesterId).emit('request_accepted', { requestId, roomId });
    });

    socket.on('request_declined', ({ requestId, requesterId }) => {
      io.to(requesterId).emit('request_declined', { requestId });
    });

    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      console.log('socket joined room:', roomId);
    });

    socket.on('send_message', async ({ roomId, senderId, text }) => {
      if (!text || typeof text !== 'string') return;
      if (text.length > 300) return;

      const message = await Message.create({
        roomId,
        senderId,
        text: text.trim(),
      });

      io.to(roomId.toString()).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id);
    });
  });
}

module.exports = { initializeSockets };
