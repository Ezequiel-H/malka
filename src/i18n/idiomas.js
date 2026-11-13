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

/* El idioma y el locale con que se formatean fechas, números y precios fuera
   de React (utils). Los actualiza el IdiomaProvider; el panel del equipo
   siempre queda en castellano y es-AR. */
let idiomaActual = IDIOMA_POR_DEFECTO;
export const getIdiomaActual = () => idiomaActual;
export const getLocale = () => datosIdioma(idiomaActual).locale;
export const setIdiomaActual = (idioma) => {
  idiomaActual = esIdioma(idioma) ? idioma : IDIOMA_POR_DEFECTO;
};
