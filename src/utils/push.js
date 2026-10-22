import axios from 'axios';

/**
 * Notificaciones push del lado del navegador.
 *
 * El service worker sólo existe en el build de producción (vite-plugin-pwa),
 * así que en `npm run dev` las push no están disponibles: se prueban con
 * `npm run build && npm run preview`.
 */

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** La clave VAPID viene en base64url; el navegador la quiere en bytes. */
const keyToBytes = (base64) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const registration = () => navigator.serviceWorker.getRegistration();

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Le avisa al back que este dispositivo es de quien tiene la sesión. */
export const saveSubscription = (sub) => axios.post('/push/subscribe', sub.toJSON());

/** Pide permiso (si hace falta), suscribe el dispositivo y lo guarda. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, permission };

  const reg = await registration();
  if (!reg) throw new Error('El service worker no está activo');

  const { data } = await axios.get('/push/public-key');
  if (!data.publicKey) throw new Error('Las notificaciones todavía no están configuradas en el servidor');

  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(data.publicKey) }));
  await saveSubscription(sub);
  return { ok: true, permission };
}

/**
 * Da de baja este dispositivo. `authHeader` permite hacerlo al cerrar
 * sesión, cuando el header común de axios ya se está por borrar.
 */
export async function disablePush(authHeader) {
  const sub = await currentSubscription();
  if (!sub) return;
  const { endpoint } = sub;
  await sub.unsubscribe();
  await axios.delete('/push/subscribe', {
    data: { endpoint },
    ...(authHeader ? { headers: { Authorization: authHeader } } : {}),
  });
}
