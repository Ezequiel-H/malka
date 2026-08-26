import { useEffect } from 'react';
import { Alert } from '../ui';

/* El tipo que emite ToastContext no coincide con el tono del Alert: 'error'
   se dibuja como 'danger'. El resto mapea uno a uno. */
const TONES = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

/**
 * Avisos flotantes y efímeros.
 *
 * Reusa el Alert del design system en vez de tener su propio dibujo: antes
 * este archivo llevaba cuatro iconos SVG embebidos y su propia tabla de
 * colores, que ya se habían desincronizado de los del sistema.
 */
const Toast = ({ toasts, removeToast }) => (
  <div
    // aria-live en el contenedor y no en cada aviso: así el lector de pantalla
    // anuncia los que van entrando sin tener que re-registrar la región.
    role="region"
    aria-live="polite"
    aria-label="Notificaciones"
    className="pointer-events-none fixed left-4 right-4 top-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-md"
  >
    {toasts.map((toast) => (
      <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
    ))}
  </div>
);

const ToastItem = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <Alert
      tone={TONES[toast.type] ?? 'info'}
      onClose={() => removeToast(toast.id)}
      className="pointer-events-auto animate-slide-in"
    >
      <span className="block whitespace-pre-line break-words font-medium">{toast.message}</span>
    </Alert>
  );
};

export default Toast;
