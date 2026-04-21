const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const parseDateSafely = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (DATE_ONLY_REGEX.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return new Date(trimmed);
    }
  }

  return new Date(value);
};

/** YYYY-MM-DD del calendario local (navegador). */
export const formatLocalDateToString = (value) => {
  const parsed = parseDateSafely(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateToString = (value) => {
  const parsed = parseDateSafely(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateEsAR = (value, options) => {
  const parsed = parseDateSafely(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es-AR', options);
};

/**
 * Fecha de “día de evento” guardada en backend como medianoche UTC
 * (p. ej. inscripciones: `new Date(fecha + 'T00:00:00.000Z')`).
 * Mostrar el día del calendario en UTC coincide con la DB y con `getUTC*` del servidor.
 */
export const formatUtcCalendarDateToString = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatUtcCalendarDateEsAR = (value, options) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { timeZone: 'UTC', ...options });
};
