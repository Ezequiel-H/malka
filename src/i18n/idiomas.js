/**
 * Los idiomas de Malka. La landing y la plataforma usan la misma lista: la
 * landing elige por la dirección (/, /en, /he) y la plataforma por lo que la
 * persona eligió (guardado en su cuenta o, sin sesión, en el navegador).
 */
export const IDIOMAS = [
  { id: 'es', corto: 'ES', nombre: 'Español', ruta: '/', locale: 'es-AR' },
  { id: 'en', corto: 'EN', nombre: 'English', ruta: '/en', locale: 'en-US' },
  { id: 'he', corto: 'עב', nombre: 'עברית', ruta: '/he', locale: 'he-IL', rtl: true },
];

export const IDIOMA_POR_DEFECTO = 'es';
export const esIdioma = (valor) => IDIOMAS.some((i) => i.id === valor);
export const datosIdioma = (id) => IDIOMAS.find((i) => i.id === id) ?? IDIOMAS[0];

/* El locale con el que se formatean fechas y números fuera de React (utils).
   Lo actualiza el IdiomaProvider; el panel del equipo siempre queda en es-AR. */
let localeActual = 'es-AR';
export const getLocale = () => localeActual;
export const setLocaleActual = (locale) => {
  localeActual = locale;
};
