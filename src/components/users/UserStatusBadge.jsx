const BADGES = {
  approved: { class: 'badge-success', text: 'Aprobado' },
  pending: { class: 'badge-warning', text: 'Pendiente' },
  rejected: { class: 'badge-danger', text: 'Rechazado' },
};

/** Píldora con el estado de aprobación de un usuario (aprobado / pendiente / rechazado). */
const UserStatusBadge = ({ estado }) => {
  const badge = BADGES[estado] || BADGES.pending;
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default UserStatusBadge;
