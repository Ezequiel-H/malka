import { Badge } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const BADGES = {
  aceptada: { tone: 'success' },
  pendiente: { tone: 'warning' },
  cancelada: { tone: 'danger' },
  en_espera: { tone: 'info' },
};

/**
 * Chip compacto con el estado de una inscripción, usado en tablas y listados.
 * `aceptadaLabel` permite mostrar "Confirmada" en vistas de participante en lugar de "Aceptada".
 */
const InscriptionStatusTag = ({ estado, aceptadaLabel }) => {
  const { t } = useIdioma();
  const clave = BADGES[estado] ? estado : 'pendiente';
  const badge = BADGES[clave];
  const text = clave === 'aceptada' && aceptadaLabel ? aceptadaLabel : t(`estadoInscripcion.${clave}`);

  return (
    <Badge tone={badge.tone} dot>
      {text}
    </Badge>
  );
};

export default InscriptionStatusTag;
