import { formatUtcCalendarDateToString } from './dateUtils';
import { formatActivityPrice } from './priceUtils';

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

  // Viaje: la finalización usa fechaFin/horaFin (evento de varios días).
  let endTs = null;
  if (!dateOption && activity.tipo === 'viaje' && activity.fechaFin) {
    const endDateStr =
      typeof activity.fechaFin === 'string'
        ? activity.fechaFin.substring(0, 10)
        : formatUtcCalendarDateToString(activity.fechaFin);
    const [ey, em, ed] = endDateStr.split('-').map(Number);
    if (ey && em && ed) {
      const [endHours, endMinutes] = String(activity.horaFin || activity.hora || '19:00').split(':');
      endTs = Date.UTC(
        ey,
        em - 1,
        ed,
        parseInt(endHours, 10) || 19,
        parseInt(endMinutes, 10) || 0,
        0
      );
    }
  }
  if (endTs === null || endTs <= startTs) {
    const duration = activity.duracion || 60;
    endTs = startTs + duration * 60000;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const formatCalendarDate = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
  };

  const start = formatCalendarDate(startTs);
  const end = formatCalendarDate(endTs);

  const description = `${activity.descripcion || ''}\n\n${activity.lugar ? `Lugar: ${activity.lugar}\n` : ''}${activity.ubicacionOnline ? `Ubicación: ${activity.ubicacionOnline}\n` : ''}Precio: ${formatActivityPrice(activity)}`;

  const location = activity.ubicacionOnline || activity.lugar || '';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activity.titulo)}&dates=${start}/${end}&ctz=${encodeURIComponent('America/Argentina/Buenos_Aires')}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
}
