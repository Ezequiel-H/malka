import { Badge } from '../ui';

const BADGES = {
  aceptada: { tone: 'success', text: 'Aceptada' },
  pendiente: { tone: 'warning', text: 'Pendiente' },
  cancelada: { tone: 'danger', text: 'Cancelada' },
  en_espera: { tone: 'info', text: 'En lista de espera' },
};

/**
 * Chip compacto con el estado de una inscripción, usado en tablas y listados.
 * `aceptadaLabel` permite mostrar "Confirmada" en vistas de participante en lugar de "Aceptada".
 */
const InscriptionStatusTag = ({ estado, aceptadaLabel = 'Aceptada' }) => {
  const badge = BADGES[estado] || BADGES.pendiente;
  const text = estado === 'aceptada' ? aceptadaLabel : badge.text;

  return (
    <Badge tone={badge.tone} dot>
      {text}
    </Badge>
  );
};

export default InscriptionStatusTag;
