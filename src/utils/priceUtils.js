import { getIdiomaActual, getLocale } from '../i18n/idiomas';
import { traducir } from '../i18n/traducir';

/** Símbolo de moneda: pesos (ARS) o dólares (USD). */
export const currencySymbol = (moneda) => (moneda === 'USD' ? 'US$' : '$');


/**
 * Precio con símbolo y separador de miles, p. ej. `$12.000` o `US$100`.
 * "$12000" se lee como un número de serie; "$12.000" se lee como plata.
 */
export const formatPrice = (precio, moneda) => {
  if (precio == null || precio === '') return `${currencySymbol(moneda)}—`;
  const n = Number(precio);
  // El separador de miles va según el idioma: $12.000 en castellano, $12,000 en inglés.
  return `${currencySymbol(moneda)}${Number.isFinite(n) ? new Intl.NumberFormat(getLocale()).format(n) : precio}`;
};

/** Precio de una actividad: "Gratis" o el importe con su moneda. */
export const formatActivityPrice = (activity) =>
  activity?.esGratuita ? traducir(getIdiomaActual(), 'comun.gratis') : formatPrice(activity?.precio, activity?.moneda);
