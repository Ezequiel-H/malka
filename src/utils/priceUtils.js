/** Símbolo de moneda: pesos (ARS) o dólares (USD). */
export const currencySymbol = (moneda) => (moneda === 'USD' ? 'US$' : '$');

/** Precio con símbolo de moneda, p. ej. `$100` o `US$100`. */
export const formatPrice = (precio, moneda) => `${currencySymbol(moneda)}${precio ?? '—'}`;

/** Precio de una actividad: "Gratis" o el importe con su moneda. */
export const formatActivityPrice = (activity) =>
  activity?.esGratuita ? 'Gratis' : formatPrice(activity?.precio, activity?.moneda);
