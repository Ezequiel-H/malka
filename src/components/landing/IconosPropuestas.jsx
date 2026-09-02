/**
 * Los seis íconos de las propuestas de Malka, dibujados a línea.
 *
 * Son los mismos seis que Malka ya usa en su sitio —Judaísmo, Actividades,
 * Coworking, Asaditos, Huerta, Música— y están redibujados en el estilo de
 * aquellos: trazo fino y parejo, sin relleno, la figura justa y nada más. Los
 * de la librería del sistema son de otra familia (más pesados y más
 * redondeados) y al lado del dibujo de la casa se notaba que venían de otro
 * lado.
 */

const comun = {
  fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Rollo de Torá: dos cilindros y el pergamino entre ellos. */
const Tora = () => (
  <>
    <path d="M6 5v14M18 5v14" {...comun} />
    <ellipse cx="6" cy="5" rx="1.6" ry="1" {...comun} />
    <ellipse cx="18" cy="5" rx="1.6" ry="1" {...comun} />
    <path d="M6 7.5h12M6 16.5h12" {...comun} />
    <path d="M9.5 10.5h5M9.5 13h3.5" {...comun} />
  </>
);

/** Actividades: la chispa de que algo está pasando. */
const Chispa = () => (
  <>
    <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9z" {...comun} />
    <path d="M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" {...comun} />
  </>
);

/** Coworking: la taza de café con cakes. */
const Taza = () => (
  <>
    <path d="M4.5 8h12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z" {...comun} />
    <path d="M16.5 9.5h1.8a2.2 2.2 0 0 1 0 4.4h-1.8" {...comun} />
    <path d="M8 5.5c0-1 1-1.2 1-2.2M11.5 5.5c0-1 1-1.2 1-2.2" {...comun} />
    <path d="M4 21h14" {...comun} />
  </>
);

/** Asaditos: la parrilla con sus barras y sus patas. */
const Parrillita = () => (
  <>
    <path d="M4 10.5h16" {...comun} />
    <path d="M5.5 10.5v3.5h13v-3.5" {...comun} />
    <path d="M8 14v5M16 14v5" {...comun} />
    <path d="M8 7.5c0-1.2 1.2-1.4 1.2-2.6M12 7.5c0-1.2 1.2-1.4 1.2-2.6M16 7.5c0-1.2 1.2-1.4 1.2-2.6" {...comun} />
  </>
);

/** Huerta: el brote saliendo de la tierra. */
const Brote = () => (
  <>
    <path d="M12 20V9.5" {...comun} />
    <path d="M12 12.5C12 9.5 9.5 7.5 6.5 7.5c0 3 2 5 5.5 5z" {...comun} />
    <path d="M12 10.5c0-3 2.5-5 5.5-5 0 3-2 5-5.5 5z" {...comun} />
    <path d="M5 20h14" {...comun} />
  </>
);

/** Música: dos corcheas unidas. */
const Corcheas = () => (
  <>
    <path d="M9 18V6.5l9-2v11.5" {...comun} />
    <path d="M9 8.5l9-2" {...comun} />
    <ellipse cx="7" cy="18" rx="2" ry="1.6" {...comun} />
    <ellipse cx="16" cy="16" rx="2" ry="1.6" {...comun} />
  </>
);

/* Los seis espacios de la casa, en el mismo trazo. Cada uno es el objeto que
   uno nombraría si tuviera que describir el ambiente en una palabra: las velas
   del viernes, la olla, la laptop, el auto, la guitarra y el árbol. Los
   anteriores eran demasiado abstractos —una mesa vista de frente, una campana
   de cocina— y a veinte píxeles no se leía ninguno. */

/** El salón: las dos velas de Shabat. */
const Velas = () => (
  <>
    <path d="M9 20V9.5M15 20V9.5" {...comun} />
    <path d="M6.5 20h11" {...comun} />
    <path d="M9 9.5c0-2 1.6-2.2 1.6-4C10.6 4.3 9 4 9 4s-1.6.3-1.6 1.5C7.4 7.3 9 7.5 9 9.5z" {...comun} />
    <path d="M15 9.5c0-2 1.6-2.2 1.6-4C16.6 4.3 15 4 15 4s-1.6.3-1.6 1.5c0 1.8 1.6 2 1.6 4z" {...comun} />
  </>
);

/** La cocina: la olla con su vapor. */
const Olla = () => (
  <>
    <path d="M4.5 11h15v5.5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3z" {...comun} />
    <path d="M3 11h18" {...comun} />
    <path d="M9 7.5c0-1.4 1.4-1.6 1.4-3M14 7.5c0-1.4 1.4-1.6 1.4-3" {...comun} />
  </>
);

/** El cowork: la laptop. */
const Laptopcita = () => (
  <>
    <path d="M6 6.5h12v9H6z" {...comun} />
    <path d="M3.5 18.5h17" {...comun} />
    <path d="M9.5 18.5h5" {...comun} />
  </>
);

/** El garage: el auto. */
const Auto = () => (
  <>
    <path d="M3.5 15v-2.2l2-4.3A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.8 1l2 4.3V15" {...comun} />
    <path d="M3.5 15h17v2.5h-17z" {...comun} />
    <path d="M5.5 12.5h13" {...comun} />
    <circle cx="7.5" cy="18.5" r="1.6" {...comun} />
    <circle cx="16.5" cy="18.5" r="1.6" {...comun} />
  </>
);

/** La terraza: la guitarra del unplugged. */
const Guitarrita = () => (
  <>
    <ellipse cx="9.5" cy="15.5" rx="5.5" ry="5" {...comun} />
    <ellipse cx="12.5" cy="10.5" rx="3.6" ry="3.2" {...comun} />
    <circle cx="9.5" cy="15.5" r="1.8" {...comun} />
    <path d="M14.5 8L19 3.5" {...comun} />
    <path d="M17.5 2l3 3" {...comun} />
  </>
);

/** El fondo: el árbol del patio. */
const Arbolito = () => (
  <>
    <path d="M12 20v-6" {...comun} />
    <path d="M12 14a5 5 0 1 1 3.6-8.5A4 4 0 1 1 12 14z" {...comun} />
    <path d="M8 20h8" {...comun} />
  </>
);

/**
 * La casa de Malka en chiquito. Techo plano y no a dos aguas: la casa de la
 * página es una caja con terraza, y un triangulito arriba sería otra casa.
 */
const Casita = () => (
  <>
    <path d="M5 20V8h14v12" {...comun} />
    <path d="M3.2 8h17.6" {...comun} />
    <path d="M5 13.2h14M5 16.6h14" {...comun} />
    <path d="M10.4 20v-3.4h3.2V20" {...comun} />
  </>
);

const FIGURAS = {
  casita: Casita,
  salon: Velas,
  cocinita: Olla,
  cowork: Laptopcita,
  garage: Auto,
  terraza: Guitarrita,
  fondo: Arbolito,
  judaismo: Tora,
  actividades: Chispa,
  coworking: Taza,
  asaditos: Parrillita,
  huerta: Brote,
  musica: Corcheas,
};

const IconoPropuesta = ({ nombre, className = '' }) => {
  const Figura = FIGURAS[nombre];
  if (!Figura) return null;
  return (
    <svg viewBox="0 0 24 24" className={className} stroke="currentColor" aria-hidden="true" focusable="false">
      <Figura />
    </svg>
  );
};

export default IconoPropuesta;
