import { Spinner } from '../ui';

/** Pantalla completa de carga: spinner centrado con un mensaje opcional. */
const LoadingScreen = ({ message = 'Cargando...' }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page">
    <Spinner size="lg" label={message} />
    <p className="mt-4 text-ink-muted">{message}</p>
  </div>
);

export default LoadingScreen;
