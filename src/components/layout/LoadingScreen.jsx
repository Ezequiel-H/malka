import { Spinner } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

/** Pantalla completa de carga: spinner centrado con un mensaje opcional. */
const LoadingScreen = ({ message }) => {
  const { t } = useIdioma();
  const texto = message ?? t('comun.cargando');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page">
      <Spinner size="lg" label={texto} />
      <p className="mt-4 text-ink-muted">{texto}</p>
    </div>
  );
};

export default LoadingScreen;
