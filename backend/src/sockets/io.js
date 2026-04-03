let io = null;

function setIo(instance) {
  io = instance;
}

function emitNewPost(post) {
  if (!io) return;
  const payload = post && typeof post.toObject === 'function' ? post.toObject() : post;
  io.emit('new_post', { post: payload });
}

module.exports = { setIo, emitNewPost };
