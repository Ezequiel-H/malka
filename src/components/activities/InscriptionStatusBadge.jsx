import { Badge } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const BADGES = {
  aceptada: { tone: 'success', icon: 'success' },
  pendiente: { tone: 'warning', icon: 'time' },
  en_espera: { tone: 'info', icon: 'time' },
};

/** Píldora con el estado de una inscripción (confirmada / pendiente / en espera). */
const InscriptionStatusBadge = ({ estado }) => {
  const { t } = useIdioma();
  const badge = BADGES[estado];
  if (!badge) return null;

  return (
    <Badge tone={badge.tone} icon={badge.icon} className="min-h-[2.25rem] w-fit px-4 text-sm">
      {t(`estadoInscripcion.largo.${estado}`)}
    </Badge>
  );
};

export default InscriptionStatusBadge;
