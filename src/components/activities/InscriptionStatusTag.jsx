const BADGES = {
  aceptada: { class: 'badge-success', text: 'Aceptada' },
  pendiente: { class: 'badge-warning', text: 'Pendiente' },
  cancelada: { class: 'badge-danger', text: 'Cancelada' },
  en_espera: { class: 'badge-info', text: 'En lista de espera' },
};

/**
 * Chip compacto (clase `badge`) con el estado de una inscripción, usado en tablas y listados.
 * `aceptadaLabel` permite mostrar "Confirmada" en vistas de participante en lugar de "Aceptada".
 */
const InscriptionStatusTag = ({ estado, aceptadaLabel = 'Aceptada' }) => {
  const badge = BADGES[estado] || BADGES.pendiente;
  const text = estado === 'aceptada' ? aceptadaLabel : badge.text;
  return <span className={`badge ${badge.class}`}>{text}</span>;
};

export default InscriptionStatusTag;
