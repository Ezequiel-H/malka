/**
 * Glifo de Instagram.
 *
 * Vive acá y no en el registro de iconos del DS porque lucide sacó las marcas
 * comerciales de la librería: no hay un `Instagram` que registrar. Está
 * dibujado con la misma grilla de 24 y el mismo grosor de trazo que el resto
 * de los iconos para que no cante al lado de ellos.
 */
const InstagramGlyph = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

export default InstagramGlyph;
