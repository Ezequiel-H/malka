import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { formatActivityPrice } from '../../utils/priceUtils';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Datos del evento (fecha, hora, lugar, precio, etc.).
 * Centraliza qué campo mostrar según el `tipo` de actividad para que las
 * distintas pantallas no se desincronicen.
 * - variant "card": versión compacta para las tarjetas de la cartelera.
 * - variant "detail": grilla con título "Información" para la vista de detalle.
 */
const ActivityInfo = ({ activity, variant = 'detail' }) => {
  if (!activity) return null;

  const isDetail = variant === 'detail';
  const fmtDate = (value) =>
    isDetail ? formatUtcCalendarDateEsAR(value, LONG_DATE_OPTS) : formatUtcCalendarDateEsAR(value);

  const items = [];

  if (activity.tipo === 'recurrente' && activity.proximaOcurrencia) {
    items.push({ label: 'Próxima fecha:', value: fmtDate(activity.proximaOcurrencia) });
  } else if (activity.fecha) {
    const label = activity.tipo === 'viaje' ? 'Inicio:' : 'Fecha:';
    let value = fmtDate(activity.fecha);
    if (isDetail && activity.tipo === 'viaje' && activity.hora) {
      value = `${value} · ${activity.hora}`;
    }
    items.push({ label, value });
  }

  if (activity.tipo === 'viaje' && activity.fechaFin) {
    let value = fmtDate(activity.fechaFin);
    if (isDetail && activity.horaFin) {
      value = `${value} · ${activity.horaFin}`;
    }
    items.push({ label: 'Finaliza:', value });
  }

  if (activity.hora && activity.tipo !== 'viaje') {
    items.push({ label: 'Hora:', value: activity.hora });
  }

  if (isDetail && activity.duracion) {
    items.push({ label: 'Duración:', value: `${activity.duracion} minutos` });
  }

  if (activity.lugar) {
    items.push({ label: 'Lugar:', value: activity.lugar });
  }

  if (isDetail && activity.ubicacionOnline) {
    items.push({
      label: 'Ubicación:',
      value: (
        <a
          href={activity.ubicacionOnline}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Ver en Google Maps
        </a>
      ),
    });
  }

  items.push({ label: 'Precio:', value: formatActivityPrice(activity) });

  if (!isDetail) {
    return (
      <div className="mb-4 text-sm text-gray-600 space-y-1">
        {items.map(({ label, value }) => (
          <p key={label}>
            <strong>{label}</strong> {value}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-3">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Información</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ label, value }) => (
          <div key={label}>
            <span className="font-semibold text-gray-700">{label}</span>
            <span className="ml-2 text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityInfo;
