/**
 * Los colores de los gráficos. Viven acá y no sólo en Tailwind porque
 * recharts los pide como valor, no como clase; `tailwind.config.js` los
 * importa de este archivo para que haya una sola fuente.
 *
 * La marca es apagada (verde y crema), y ningún par de sus tonos pasa el
 * piso de croma ni la separación para daltonismo que exige un gráfico de dos
 * series. El par de acá es la versión saturada del mismo verde y del ámbar de
 * las velas: pasa la validación de paleta, con aviso de contraste sobre
 * blanco que se cubre con leyenda y tooltip en todos los gráficos que lo usan.
 * No son los colores de estado (éxito/advertencia): esos no se reusan para
 * series.
 */
export const SERIE = {
  verde: '#2f7546',
  ambar: '#c98a1e',
};

/* La rampa de una sola serie y del calor (temporadas, cruce): el verde de la
   marca de claro a oscuro. */
export const RAMPA = ['#f2f7f3', '#e0ece3', '#c3d9c9', '#9cbfa6', '#7fac8c', '#689b78', '#537f61', '#42654d', '#37523f', '#2e4435'];

export const EJE = {
  grilla: '#ebe4d8',
  texto: '#6b7a72',
  tinta: '#2c3d34',
};
