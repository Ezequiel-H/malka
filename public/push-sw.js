/* Notificaciones push. El service worker que genera Workbox importa este
   archivo (vite.config.js → workbox.importScripts).

   Payload que manda el back (utils/push.js):
   { title, body, url, tag?, actions?: [{ action, title, url }] } */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Malka', body: event.data ? event.data.text() : '' };
  }

  const actions = (data.actions || []).slice(0, 2);
  const urls = Object.fromEntries(actions.map((a) => [a.action, a.url]));

  event.waitUntil(
    self.registration.showNotification(data.title || 'Malka', {
      body: data.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: data.tag,
      lang: 'es',
      // Los botones los muestran Android y escritorio; en iPhone se toca la notificación.
      actions: actions.map((a) => ({ action: a.action, title: a.title })),
      data: { url: data.url || '/dashboard', urls },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, urls } = event.notification.data || {};
  const target = new URL((event.action && urls?.[event.action]) || url || '/dashboard', self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Si la app ya está abierta, se reusa esa ventana en vez de abrir otra.
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        return open.navigate(target);
      }
      return self.clients.openWindow(target);
    })()
  );
});
