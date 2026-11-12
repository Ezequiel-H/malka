import { useState } from 'react';
import useInstallPrompt from '../../hooks/useInstallPrompt';
import { Alert, Button, Icon, Modal } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const STORAGE_KEY = 'malka.installBanner';

const IOS_PASOS = ['paso1', 'paso2', 'paso3', 'paso4'];

/**
 * Invitación a instalar la app, sólo en mobile y sólo cuando aplica:
 * en Android dispara el prompt nativo; en iOS (sin API de instalación)
 * abre instrucciones. Se descarta una vez y no vuelve a molestar.
 */
const InstallBanner = () => {
  const { canPrompt, promptInstall, ios, installed } = useInstallPrompt();
  const { t } = useIdioma();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'dismissed'
  );
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (installed || dismissed || (!canPrompt && !ios)) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setDismissed(true);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) dismiss();
  };

  return (
    <>
      <div className="px-4 pt-4 sm:px-6 lg:hidden">
        <Alert
          tone="info"
          title={t('instalar.titulo')}
          onClose={dismiss}
          action={
            canPrompt ? (
              <Button size="sm" icon="download" onClick={handleInstall}>
                {t('instalar.instalar')}
              </Button>
            ) : (
              <Button size="sm" icon="download" variant="secondary" onClick={() => setShowIosHelp(true)}>
                {t('instalar.verComo')}
              </Button>
            )
          }
        >
          {t('instalar.texto')}
        </Alert>
      </div>

      <Modal
        open={showIosHelp}
        onClose={() => setShowIosHelp(false)}
        title={t('instalar.iosTitulo')}
        size="sm"
        footer={<Button onClick={() => setShowIosHelp(false)}>{t('instalar.listo')}</Button>}
      >
        <ol className="space-y-3">
          {IOS_PASOS.map((paso, i) => (
            <li key={paso} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-ink-soft">
                {t(`instalar.${paso}`)}
                {i === 1 && <Icon name="upload" size="sm" className="ms-1.5 inline-block align-text-bottom text-ink-faint" />}
              </span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
};

export default InstallBanner;
