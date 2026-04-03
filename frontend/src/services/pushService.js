import axiosInstance from './axiosInstance';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerPush(anonId) {
  if (typeof anonId !== 'string' || !anonId) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return;

  const keyRes = await axiosInstance.get('/push/vapid-key');
  const publicKey = keyRes?.data?.data?.publicKey;
  if (!publicKey) return;

  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const json = subscription.toJSON();
  await axiosInstance.post('/push/subscribe', {
    anonId,
    subscription: json,
  });
}

export default registerPush;
