import { formatUtcCalendarDateToString } from './dateUtils';

/* Lo que comparten las pantallas de quien participa: días, fechas en su
   idioma y qué actividades hay cada día. Las fechas van como "YYYY-MM-DD"
   (día de calendario de Argentina), igual que en el back. */

/** Hoy en Argentina, como "YYYY-MM-DD". */
export const hoyIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

/** "YYYY-MM-DD" más n días. */
export const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Una fecha de calendario en el idioma de la persona. */
export const fechaEn = (iso, locale, opciones = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  iso ? new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opciones }).format(new Date(`${String(iso).slice(0, 10)}T12:00:00.000Z`)) : '';

/** Cuántos días faltan de hoy a `iso` (0 = hoy). */
export const diasHasta = (iso, desde = hoyIso()) => Math.round((new Date(`${iso}T00:00:00Z`) - new Date(`${desde}T00:00:00Z`)) / 86_400_000);

const diaDe = (valor) => (valor ? formatUtcCalendarDateToString(valor) : null);

/**
 * Si una actividad tiene encuentro el día `iso`. Las únicas y los viajes por
 * su fecha (el viaje, mientras dura); las recurrentes por sus reglas.
 */
export const ocurreEl = (activity, iso) => {
  const inicio = diaDe(activity.fecha);
  if (activity.tipo !== 'recurrente') {
    const fin = activity.tipo === 'viaje' ? diaDe(activity.fechaFin) ?? inicio : inicio;
    return Boolean(inicio) && iso >= inicio && iso <= fin;
  }
  const r = activity.recurrence;
  if (!r) return false;
  if (inicio && iso < inicio) return false;
  const fin = diaDe(r.endDate);
  if (fin && iso > fin) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  if (r.frequency === 'daily') return true;
  if (r.frequency === 'weekly') {
    const dias = r.daysOfWeek?.length ? r.daysOfWeek : r.dayOfWeek !== undefined ? [r.dayOfWeek] : [];
    return dias.includes(d.getUTCDay());
  }
  if (r.frequency === 'monthly') return (r.dayOfMonth ?? []).includes(d.getUTCDate());
  return false;
};

/** La hora de una actividad (la recurrente puede tenerla en su regla). */
export const horaDe = (activity) => activity?.recurrence?.hora || activity?.hora || '';

/** Las inscripciones que siguen vigentes (no canceladas), con su día. */
export const inscripcionesVigentes = (inscriptions = []) =>
  inscriptions.filter((i) => i.estado !== 'cancelada' && i.activityId).map((i) => ({ ...i, dia: diaDe(i.fecha) }));
