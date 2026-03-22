import axiosInstance from './axiosInstance';

export async function createReply(postId, content, anonymousId) {
  const { data } = await axiosInstance.post('/replies', {
    postId,
    content,
    anonymousId,
  });
  return data;
}

export async function getRepliesByPost(postId) {
  const { data } = await axiosInstance.get(`/replies/${postId}`);
  return data;
}
