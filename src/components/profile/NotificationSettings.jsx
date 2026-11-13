import usePushNotifications from '../../hooks/usePushNotifications';
import { useToast } from '../../contexts/ToastContext';
import { Alert, Switch } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

/** Mi perfil → Notificaciones en este dispositivo. */
const NotificationSettings = ({ className }) => {
  const { status, busy, enable, disable } = usePushNotifications();
  const { showSuccess, showError } = useToast();
  const { t } = useIdioma();

  if (status === 'loading') return null;

  const handleToggle = async (e) => {
    try {
      if (e.target.checked) {
        if (await enable()) showSuccess(t('notificaciones.activadas'));
      } else {
        await disable();
        showSuccess(t('notificaciones.desactivadas'));
      }
    } catch (error) {
      showError(error.message || t('notificaciones.error'));
    }
  };

  return (
    <section className={className} aria-labelledby="notificaciones-titulo">
      <h2 id="notificaciones-titulo" className="mb-3 text-lg font-semibold text-ink">
        {t('notificaciones.titulo')}
      </h2>

      {status === 'needs-install' && (
        <Alert tone="info">
          {t('notificaciones.instalar')}
        </Alert>
      )}

      {status === 'unsupported' && (
        <Alert tone="info">{t('notificaciones.noSoporta')}</Alert>
      )}

      {status === 'denied' && (
        <Alert tone="warning">
          {t('notificaciones.bloqueadas')}
        </Alert>
      )}

      {(status === 'on' || status === 'off') && (
        <Switch
          label={t('notificaciones.recibir')}
          description={t('notificaciones.queLlega')}
          checked={status === 'on'}
          onChange={handleToggle}
          disabled={busy}
        />
      )}
    </section>
  );
};

export default NotificationSettings;
