import { useCallback, useEffect, useState } from 'react';
import {
  currentSubscription,
  disablePush,
  enablePush,
  isIos,
  isStandalone,
  pushSupported,
  saveSubscription,
} from '../utils/push';

/**
 * Estado de las notificaciones push en este dispositivo.
 *
 * status:
 * - 'unsupported': el navegador no tiene push (o es `npm run dev`, sin SW).
 * - 'needs-install': iPhone/iPad sin instalar; Apple sólo da push a la app instalada.
 * - 'denied': las bloquearon en el navegador; sólo se destraban desde su configuración.
 * - 'off' | 'on'.
 */
const usePushNotifications = () => {
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (isIos() && !isStandalone()) return setStatus('needs-install');
    if (!pushSupported()) return setStatus('unsupported');
    if (Notification.permission === 'denied') return setStatus('denied');
    const sub = await currentSubscription();
    if (sub && Notification.permission === 'granted') {
      // Por si en este dispositivo antes había otra cuenta: queda a nombre de esta.
      saveSubscription(sub).catch(() => {});
      return setStatus('on');
    }
    return setStatus('off');
  }, []);

  useEffect(() => {
    refresh().catch(() => setStatus('unsupported'));
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const { ok, permission } = await enablePush();
      setStatus(ok ? 'on' : permission === 'denied' ? 'denied' : 'off');
      return ok;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await disablePush();
      setStatus('off');
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable, disable };
};

export default usePushNotifications;
