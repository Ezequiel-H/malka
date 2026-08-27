import { formatUtcCalendarDateEsAR } from './dateUtils';
import { formatActivityPrice } from './priceUtils';

/**
 * Plantillas de WhatsApp con variables dinámicas.
 *
 * Las plantillas viven en Ajustes (backend); acá sólo se resuelven las
 * variables y se arma el link de wa.me. Variables soportadas: {nombre},
 * {actividad}, {fecha}, {hora}, {lugar}, {precio} — las que falten en el
 * contexto quedan vacías.
 */

export const PLANTILLA_VARIABLES = ['nombre', 'actividad', 'fecha', 'hora', 'lugar', 'precio'];

export const renderPlantilla = (mensaje, ctx = {}) =>
  String(mensaje || '').replace(/\{(\w+)\}/g, (raw, clave) =>
    ctx[clave] !== undefined && ctx[clave] !== null ? String(ctx[clave]) : ''
  );

/** Contexto de variables a partir de usuario + actividad + inscripción/fecha. */
export const plantillaContext = ({ user, activity, fecha, hora } = {}) => ({
  nombre: [user?.nombre, user?.apellido].filter(Boolean).join(' '),
  actividad: activity?.titulo || '',
  fecha: fecha ? formatUtcCalendarDateEsAR(fecha) : '',
  hora: hora || activity?.hora || '',
  lugar: activity?.lugar || '',
  precio: activity ? formatActivityPrice(activity) : '',
});

export const buildWaLink = (numero, texto) => {
  const digits = String(numero || '').replace(/\D/g, '');
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
};
