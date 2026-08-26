/** Símbolo de moneda: pesos (ARS) o dólares (USD). */
export const currencySymbol = (moneda) => (moneda === 'USD' ? 'US$' : '$');

const NUMBER_FORMAT = new Intl.NumberFormat('es-AR');

/**
 * Precio con símbolo y separador de miles, p. ej. `$12.000` o `US$100`.
 * "$12000" se lee como un número de serie; "$12.000" se lee como plata.
 */
export const formatPrice = (precio, moneda) => {
  if (precio == null || precio === '') return `${currencySymbol(moneda)}—`;
  const n = Number(precio);
  return `${currencySymbol(moneda)}${Number.isFinite(n) ? NUMBER_FORMAT.format(n) : precio}`;
};

/** Precio de una actividad: "Gratis" o el importe con su moneda. */
export const formatActivityPrice = (activity) =>
  activity?.esGratuita ? 'Gratis' : formatPrice(activity?.precio, activity?.moneda);
