let io = null;

function setIo(instance) {
  io = instance;
}

function emitNewPost(post) {
  if (!io) return;
  const payload = post && typeof post.toObject === 'function' ? post.toObject() : post;
  io.emit('new_post', { post: payload });
}

function emitNewNotification(recipientAnonId, notificationPayload) {
  if (!io || !recipientAnonId) return;
  io.to(recipientAnonId).emit('new_notification', notificationPayload);
}

function emitNewComment(postId, comment) {
  if (!io || postId == null || !comment) return;
  const plain = comment && typeof comment.toObject === 'function' ? comment.toObject() : comment;
  io.emit('new_comment', { postId: String(postId), comment: plain });
}

module.exports = { setIo, emitNewPost, emitNewNotification, emitNewComment };
