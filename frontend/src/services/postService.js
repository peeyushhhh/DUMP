import axiosInstance from './axiosInstance';

export async function createPost(content, anonymousId) {
  const { data } = await axiosInstance.post('/posts', { content, anonymousId });
  return data;
}

export async function getPosts(page = 1, limit = 10) {
  const { data } = await axiosInstance.get('/posts', {
    params: { page, limit },
  });
  return data;
}

export async function getPostById(id) {
  const { data } = await axiosInstance.get(`/posts/${id}`);
  return data;
}

export async function deletePost(id, anonymousId) {
  const { data } = await axiosInstance.delete(`/posts/${id}`, {
    data: { anonymousId },
  });
  return data;
}
