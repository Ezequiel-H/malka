import { Badge } from '../ui';

const BADGES = {
  approved: { tone: 'success', text: 'Aprobado' },
  pending: { tone: 'warning', text: 'Pendiente' },
  rejected: { tone: 'danger', text: 'Rechazado' },
};

/** Píldora con el estado de aprobación de un usuario (aprobado / pendiente / rechazado). */
const UserStatusBadge = ({ estado }) => {
  const badge = BADGES[estado] || BADGES.pending;

  return (
    <Badge tone={badge.tone} dot>
      {badge.text}
    </Badge>
  );
};

export default UserStatusBadge;
