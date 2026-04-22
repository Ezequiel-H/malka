import { formatUtcCalendarDateToString } from './dateUtils';

/**
 * URL de Google Calendar (crear evento), misma lógica que el botón «Agregar al calendario» del participante.
 * @param {object} activity
 * @param {{ fecha?: unknown, hora?: string } | null} dateOption — recurrente: día concreto + hora opcional
 * @returns {string|null}
 */
export function buildGoogleCalendarTemplateUrl(activity, dateOption = null) {
  if (!activity) return null;
  const baseDate = dateOption?.fecha ?? activity.fecha;
  if (!baseDate) return null;

  const horaStr = dateOption?.hora || activity.hora || '19:00';
  const [hours, minutes] = String(horaStr).split(':');

  const baseDateStr =
    typeof baseDate === 'string'
      ? baseDate.substring(0, 10)
      : formatUtcCalendarDateToString(baseDate);
  const [year, month, day] = baseDateStr.split('-').map(Number);
  if (!year || !month || !day) return null;

  const startTs = Date.UTC(
    year,
    month - 1,
    day,
    parseInt(hours, 10) || 19,
    parseInt(minutes, 10) || 0,
    0
  );
  const duration = activity.duracion || 60;
  const endTs = startTs + duration * 60000;

  const pad = (n) => String(n).padStart(2, '0');
  const formatCalendarDate = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
  };

  const start = formatCalendarDate(startTs);
  const end = formatCalendarDate(endTs);

  const description = `${activity.descripcion || ''}\n\n${activity.lugar ? `Lugar: ${activity.lugar}\n` : ''}${activity.ubicacionOnline ? `Ubicación: ${activity.ubicacionOnline}\n` : ''}Precio: ${activity.esGratuita ? 'Gratis' : `$${activity.precio}`}`;

  const location = activity.ubicacionOnline || activity.lugar || '';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.titulo)}&dates=${start}/${end}&ctz=${encodeURIComponent('America/Argentina/Buenos_Aires')}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
}
