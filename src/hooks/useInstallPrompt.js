import { useEffect, useState } from 'react';

/* Instalada como PWA (standalone) no tiene sentido ofrecer instalarla. */
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/**
 * Estado de instalación de la PWA.
 *
 * - Android/Chrome: el navegador dispara `beforeinstallprompt` cuando la app
 *   es instalable (manifest + service worker, o sea sólo en build de prod);
 *   lo capturamos para dispararlo desde nuestro propio botón.
 * - iOS: no existe API de instalación — sólo podemos detectar el dispositivo
 *   y mostrar instrucciones (Compartir → "Agregar a pantalla de inicio").
 */
const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome === 'accepted';
  };

  return {
    canPrompt: Boolean(deferredPrompt),
    promptInstall,
    ios: isIos() && !installed,
    installed,
  };
};

export { useInstallPrompt };
export default useInstallPrompt;
