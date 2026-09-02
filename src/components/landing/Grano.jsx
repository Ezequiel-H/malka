/**
 * Grano de papel sobre toda la página.
 *
 * El crema plano se lee como un color de CSS; con grano se lee como papel, y es
 * la diferencia entre "una web con fondo beige" y algo impreso. Sale de un
 * `feTurbulence` embebido en un data URI: pesa menos de medio kilobyte y no baja
 * ninguna textura.
 *
 * Va fijo y no dentro del scroll a propósito: un grano que se mueve con la
 * página se nota como una capa; quieto, se lee como el material del papel.
 */
const RUIDO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const Grano = () => (
  <span
    aria-hidden
    className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-multiply"
    style={{ backgroundImage: RUIDO }}
  />
);

export default Grano;
