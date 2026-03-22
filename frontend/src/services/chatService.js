import axiosInstance from './axiosInstance';

export async function sendChatRequest(postId, requesterId, authorId) {
  const { data } = await axiosInstance.post('/chat/request', {
    postId,
    requesterId,
    authorId,
  });
  return data;
}

export async function getPendingRequests(authorId) {
  const { data } = await axiosInstance.get(`/chat/requests/${authorId}`);
  return data;
}

export async function acceptRequest(requestId, authorId) {
  const { data } = await axiosInstance.post(`/chat/requests/${requestId}/accept`, {
    authorId,
  });
  return data;
}

export async function declineRequest(requestId, authorId) {
  const { data } = await axiosInstance.post(`/chat/requests/${requestId}/decline`, {
    authorId,
  });
  return data;
}

export async function getMessages(roomId) {
  const { data } = await axiosInstance.get(`/chat/room/${roomId}/messages`);
  return data;
}
