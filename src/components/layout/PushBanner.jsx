import { useState } from 'react';
import usePushNotifications from '../../hooks/usePushNotifications';
import useInstallPrompt from '../../hooks/useInstallPrompt';
import { useToast } from '../../contexts/ToastContext';
import { Alert, Button } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const STORAGE_KEY = 'malka.pushBanner';

const readDismissed = (key = STORAGE_KEY) => {
  try {
    return localStorage.getItem(key) === 'dismissed';
  } catch {
    return false;
  }
};

/**
 * Invitación a activar las notificaciones, para participantes. Aparece sólo
 * si el dispositivo puede recibirlas y todavía no se decidió; se descarta una
 * vez y no vuelve (desde Mi perfil se pueden activar igual). Si está a la
 * vista la invitación a instalar la app, espera: un aviso por vez.
 */
const PushBanner = () => {
  const { status, busy, enable } = usePushNotifications();
  const { showSuccess, showError } = useToast();
  const { t } = useIdioma();
  const { canPrompt, ios, installed } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => readDismissed());

  const installBannerVisible = !installed && (canPrompt || ios) && !readDismissed('malka.installBanner');
  if (dismissed || status !== 'off' || installBannerVisible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* sin storage, el aviso vuelve la próxima vez: no es grave */
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    try {
      if (await enable()) {
        showSuccess(t('avisoPush.listo'));
        dismiss();
      }
    } catch (error) {
      showError(error.message || t('avisoPush.error'));
    }
  };

  return (
    <div className="px-4 pt-4 sm:px-6">
      <Alert
        tone="info"
        title={t('avisoPush.titulo')}
        onClose={dismiss}
        action={
          <Button size="sm" icon="bell" onClick={handleEnable} loading={busy}>
            {t('avisoPush.activar')}
          </Button>
        }
      >
        {t('avisoPush.texto')}
      </Alert>
    </div>
  );
};

export default PushBanner;
