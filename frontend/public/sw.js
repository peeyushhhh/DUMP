/* DUMP — Web Push (deploy from frontend/public/sw.js) */
self.addEventListener('push', (event) => {
  let payload = { title: 'DUMP', body: '', url: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (_) {
    try {
      const text = event.data.text();
      if (text) payload.body = text;
    } catch (_) {
      /* ignore */
    }
  }

  const path = typeof payload.url === 'string' ? payload.url : '/';
  const rel = path.startsWith('/') ? path : `/${path}`;

  event.waitUntil(
    self.registration.showNotification(payload.title || 'DUMP', {
      body: payload.body || '',
      icon: '/favicon.svg',
      data: { url: rel },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = typeof data.url === 'string' ? data.url : '/';
  const rel = path.startsWith('/') ? path : `/${path}`;
  const prodOrigin = 'https://dump-here.vercel.app';

  event.waitUntil(
    (async () => {
      try {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const client of allClients) {
          try {
            const u = new URL(client.url);
            const target = `${u.origin}${rel}`;
            await client.focus();
            if ('navigate' in client && typeof client.navigate === 'function') {
              await client.navigate(target);
              return;
            }
          } catch (_) {
            /* try next */
          }
        }

        const prodUrl = `${prodOrigin}${rel}`;
        if (self.clients && self.clients.openWindow) {
          await self.clients.openWindow(prodUrl);
        }
      } catch (_) {
        if (self.clients && self.clients.openWindow) {
          await self.clients.openWindow(`${prodOrigin}${rel}`);
        }
      }
    })()
  );
});
