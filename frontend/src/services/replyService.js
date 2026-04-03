import axiosInstance from './axiosInstance';

export async function createComment(postId, content, anonymousId, parentId = null) {
  const body = { postId, content, anonymousId };
  if (parentId) body.parentId = parentId;
  const { data } = await axiosInstance.post('/replies', body);
  return data;
}

export async function getCommentsByPost(postId) {
  const { data } = await axiosInstance.get(`/replies/${postId}`);
  return data;
}
