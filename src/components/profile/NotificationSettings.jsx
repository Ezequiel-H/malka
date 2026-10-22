import usePushNotifications from '../../hooks/usePushNotifications';
import { useToast } from '../../contexts/ToastContext';
import { Alert, Switch } from '../ui';

const QUE_LLEGA =
  'Actividades nuevas, recordatorio el día de una actividad a la que no te anotaste y cambios en tus inscripciones (los mismos avisos que te llegan por mail).';

/** Mi perfil → Notificaciones en este dispositivo. */
const NotificationSettings = ({ className }) => {
  const { status, busy, enable, disable } = usePushNotifications();
  const { showSuccess, showError } = useToast();

  if (status === 'loading') return null;

  const handleToggle = async (e) => {
    try {
      if (e.target.checked) {
        if (await enable()) showSuccess('Notificaciones activadas en este dispositivo');
      } else {
        await disable();
        showSuccess('Notificaciones desactivadas en este dispositivo');
      }
    } catch (error) {
      showError(error.message || 'No se pudo cambiar la configuración');
    }
  };

  return (
    <section className={className} aria-labelledby="notificaciones-titulo">
      <h2 id="notificaciones-titulo" className="mb-3 text-lg font-semibold text-ink">
        Notificaciones
      </h2>

      {status === 'needs-install' && (
        <Alert tone="info">
          En iPhone y iPad las notificaciones llegan sólo con la app instalada: abrí Malka en Safari,
          tocá Compartir y elegí «Agregar a pantalla de inicio». Después activalas desde acá.
        </Alert>
      )}

      {status === 'unsupported' && (
        <Alert tone="info">Este navegador no puede recibir notificaciones.</Alert>
      )}

      {status === 'denied' && (
        <Alert tone="warning">
          Las notificaciones están bloqueadas para Malka en este navegador. Para recibirlas,
          habilitalas desde la configuración del sitio (el candado al lado de la dirección).
        </Alert>
      )}

      {(status === 'on' || status === 'off') && (
        <Switch
          label="Recibir notificaciones en este dispositivo"
          description={QUE_LLEGA}
          checked={status === 'on'}
          onChange={handleToggle}
          disabled={busy}
        />
      )}
    </section>
  );
};

export default NotificationSettings;
