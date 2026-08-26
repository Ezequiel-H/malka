import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import { Badge, Icon } from '../ui';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Datos del evento (fecha, hora, lugar, precio, etc.).
 * Centraliza qué campo mostrar según el `tipo` de actividad para que las
 * distintas pantallas no se desincronicen.
 *
 * Cada dato lleva su icono y habla por sí mismo: un reloj junto a "19:00" no
 * necesita el prefijo "Hora:". El patrón anterior (**Label:** valor) es el
 * formulario impreso de siempre; el icono comunica lo mismo en menos ruido.
 *
 * - variant "card": filas compactas para las tarjetas de la cartelera.
 * - variant "detail": grilla con título "Información" para la vista de detalle.
 */
const ActivityInfo = ({ activity, variant = 'detail', showPrice = true }) => {
  if (!activity) return null;

  const isDetail = variant === 'detail';
  const fmtDate = (value) =>
    isDetail ? formatUtcCalendarDateEsAR(value, LONG_DATE_OPTS) : formatUtcCalendarDateEsAR(value);

  const items = [];

  if (activity.tipo === 'recurrente' && activity.proximaOcurrencia) {
    items.push({ icon: 'activity', label: 'Próxima fecha', value: fmtDate(activity.proximaOcurrencia) });
  } else if (activity.tipo === 'viaje' && !isDetail && activity.fecha && activity.fechaFin) {
    /* En la card los dos extremos del viaje van como un solo rango: dos items
       con el mismo icono de calendario y sin label se leían como fecha
       repetida. */
    items.push({
      icon: 'activity',
      label: 'Fechas',
      value: `${fmtDate(activity.fecha)} → ${fmtDate(activity.fechaFin)}`,
    });
  } else if (activity.fecha) {
    const label = activity.tipo === 'viaje' ? 'Inicio' : 'Fecha';
    let value = fmtDate(activity.fecha);
    if (isDetail && activity.tipo === 'viaje' && activity.hora) {
      value = `${value} · ${activity.hora}`;
    }
    items.push({ icon: 'activity', label, value });
  }

  if (activity.tipo === 'viaje' && activity.fechaFin && (isDetail || !activity.fecha)) {
    let value = fmtDate(activity.fechaFin);
    if (isDetail && activity.horaFin) {
      value = `${value} · ${activity.horaFin}`;
    }
    items.push({ icon: 'activity', label: 'Finaliza', value });
  }

  if (activity.hora && activity.tipo !== 'viaje') {
    items.push({ icon: 'time', label: 'Hora', value: activity.hora });
  }

  if (isDetail && activity.duracion) {
    items.push({ icon: 'time', label: 'Duración', value: `${activity.duracion} minutos` });
  }

  if (activity.lugar) {
    items.push({ icon: 'location', label: 'Lugar', value: activity.lugar });
  }

  if (isDetail && activity.ubicacionOnline) {
    items.push({
      icon: 'location',
      label: 'Ubicación',
      value: (
        <a
          href={activity.ubicacionOnline}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          Ver en Google Maps
        </a>
      ),
    });
  }

  /* El precio se destaca aparte: es el dato que decide la inscripción. */
  const precio = activity.esGratuita ? (
    <Badge tone="success">Gratis</Badge>
  ) : (
    <span className="font-semibold text-ink">{formatActivityPrice(activity)}</span>
  );

  if (!isDetail) {
    /* Una sola línea envolvente en vez de una fila por dato: la card respira.
       El precio suele mostrarse aparte (junto al título), por eso showPrice. */
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
        {items.map(({ icon, label, value }) => (
          <span key={label} className="flex min-w-0 items-center gap-1.5">
            <Icon name={icon} size="sm" className="shrink-0 text-ink-faint" />
            <span className="truncate">{value}</span>
          </span>
        ))}
        {showPrice && (
          <span className="flex items-center gap-1.5">
            <Icon name="payment" size="sm" className="shrink-0 text-ink-faint" />
            {precio}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-card border border-surface-border bg-surface p-6">
      <h2 className="mb-4 text-xl font-semibold text-ink">Información</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map(({ icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
              <Icon name={icon} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
              <p className="text-ink">{value}</p>
            </div>
          </div>
        ))}

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary">
            <Icon name="payment" size="sm" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Precio</p>
            <p className="text-ink">{precio}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityInfo;
