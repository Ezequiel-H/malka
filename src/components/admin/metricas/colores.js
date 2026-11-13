/**
 * Los colores de los gráficos. Viven acá y no sólo en Tailwind porque
 * recharts los pide como valor, no como clase; `tailwind.config.js` los
 * importa de este archivo para que haya una sola fuente.
 *
 * Salen de la paleta de marca de Malka (la presentación «MALKA-2»): el verde
 * Cypress y el Mustard Gold para las dos series, y la escala de verdes de
 * Aloe a Moss para el calor y la serie única. Son tonos terrosos: el par se
 * distingue por luminosidad (oscuro contra claro), y pasa la separación para
 * daltonismo y la de visión normal. El validador marca el verde como apagado
 * (es el tono de la marca), así que todo gráfico de dos series lleva leyenda,
 * separación entre bloques y el número en el tooltip. Verde oliva con
 * terracota NO sirve: para quien tiene daltonismo son el mismo color.
 * No son los colores de estado (éxito/advertencia): esos no se reusan.
 */
export const SERIE = {
  verde: '#4c583e', // Cypress
  ambar: '#b07e1e', // Mustard Gold
};

/* La rampa de una sola serie y del calor (temporadas, cruce): los verdes de
   la marca, de Aloe a Moss. */
export const RAMPA = ['#f4f3ec', '#e8e9e0', '#daded8', '#c3c8b5', '#a3aa8f', '#768064', '#5f6b4e', '#4c583e', '#3b4530', '#2c3424'];

export const EJE = {
  grilla: '#e6dfd2',
  texto: '#6b6458',
  tinta: '#382c23', // Charcoal Brown
};
