import axiosInstance from './axiosInstance';

export async function getNotifications(recipientId) {
  const { data } = await axiosInstance.get('/notifications', {
    params: { recipientId },
  });
  return data;
}

export async function markAllNotificationsRead(recipientId) {
  const { data } = await axiosInstance.patch('/notifications/read', {}, {
    params: { recipientId },
  });
  return data;
}

export async function markNotificationRead(notificationId, recipientId) {
  const { data } = await axiosInstance.patch(
    `/notifications/${notificationId}/read`,
    {},
    { params: { recipientId } }
  );
  return data;
}
