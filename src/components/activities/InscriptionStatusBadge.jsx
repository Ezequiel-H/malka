import { Badge } from '../ui';

const BADGES = {
  aceptada: { tone: 'success', icon: 'success', text: 'Inscripción confirmada' },
  pendiente: { tone: 'warning', icon: 'time', text: 'Pendiente de confirmación' },
  en_espera: { tone: 'info', icon: 'time', text: 'En lista de espera' },
};

/** Píldora con el estado de una inscripción (confirmada / pendiente / en espera). */
const InscriptionStatusBadge = ({ estado }) => {
  const badge = BADGES[estado];
  if (!badge) return null;

  return (
    <Badge tone={badge.tone} icon={badge.icon} className="min-h-[2.25rem] w-fit px-4 text-sm">
      {badge.text}
    </Badge>
  );
};

export default InscriptionStatusBadge;
