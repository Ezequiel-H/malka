import { useState } from 'react';
import useInstallPrompt from '../../hooks/useInstallPrompt';
import { Alert, Button, Icon, Modal } from '../ui';

const STORAGE_KEY = 'malka.installBanner';

const IOS_STEPS = [
  'Abrí Malka en Safari.',
  'Tocá el botón Compartir (el cuadrado con la flecha hacia arriba).',
  'Elegí "Agregar a pantalla de inicio".',
  'Confirmá con "Agregar".',
];

/**
 * Invitación a instalar la app, sólo en mobile y sólo cuando aplica:
 * en Android dispara el prompt nativo; en iOS (sin API de instalación)
 * abre instrucciones. Se descarta una vez y no vuelve a molestar.
 */
const InstallBanner = () => {
  const { canPrompt, promptInstall, ios, installed } = useInstallPrompt();
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
          title="Instalá Malka en tu teléfono"
          onClose={dismiss}
          action={
            canPrompt ? (
              <Button size="sm" icon="download" onClick={handleInstall}>
                Instalar
              </Button>
            ) : (
              <Button size="sm" icon="download" variant="secondary" onClick={() => setShowIosHelp(true)}>
                Ver cómo
              </Button>
            )
          }
        >
          La abrís desde un ícono propio, a pantalla completa.
        </Alert>
      </div>

      <Modal
        open={showIosHelp}
        onClose={() => setShowIosHelp(false)}
        title="Instalar en iPhone o iPad"
        size="sm"
        footer={<Button onClick={() => setShowIosHelp(false)}>Listo</Button>}
      >
        <ol className="space-y-3">
          {IOS_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-ink-soft">
                {step}
                {i === 1 && <Icon name="upload" size="sm" className="ml-1.5 inline-block align-text-bottom text-ink-faint" />}
              </span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
};

export default InstallBanner;
