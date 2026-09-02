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

/* Los seis espacios de la casa, en el mismo trazo. */

/** El salón: la mesa larga con sus dos velas. */
const Mesa = () => (
  <>
    <path d="M3.5 13h17" {...comun} />
    <path d="M5.5 13v6M18.5 13v6" {...comun} />
    <path d="M9.5 13V8M14.5 13V8" {...comun} />
    <path d="M9.5 8c0-1 .8-1.2.8-2.2M14.5 8c0-1 .8-1.2.8-2.2" {...comun} />
  </>
);

/** La cocina: la campana sobre las hornallas. */
const Campanita = () => (
  <>
    <path d="M5 9.5l2-4h10l2 4z" {...comun} />
    <path d="M8 5.5V4" {...comun} />
    <path d="M4.5 14.5h15v5h-15z" {...comun} />
    <circle cx="8.5" cy="17" r="1.2" {...comun} />
    <circle cx="15.5" cy="17" r="1.2" {...comun} />
  </>
);

/** El cowork: la laptop abierta. */
const Laptopcita = () => (
  <>
    <path d="M6 6.5h12v9H6z" {...comun} />
    <path d="M3.5 18.5h17" {...comun} />
    <path d="M9.5 18.5h5" {...comun} />
  </>
);

/** La sala de abajo: la colchoneta enrollada. */
const Colchoneta = () => (
  <>
    <rect x="4.5" y="7" width="15" height="10" rx="5" {...comun} />
    <ellipse cx="8" cy="12" rx="2.5" ry="4" {...comun} />
    <path d="M14 9.5h3M14 14.5h3" {...comun} />
  </>
);

/** La terraza: la guirnalda de luces. */
const Guirnaldita = () => (
  <>
    <path d="M3 6c4 5 14 5 18 0" {...comun} />
    <path d="M7 8.5v2M12 10.5v2M17 8.5v2" {...comun} />
    <circle cx="7" cy="12" r="1.4" {...comun} />
    <circle cx="12" cy="14" r="1.4" {...comun} />
    <circle cx="17" cy="12" r="1.4" {...comun} />
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

const FIGURAS = {
  salon: Mesa,
  cocinita: Campanita,
  cowork: Laptopcita,
  sala: Colchoneta,
  terraza: Guirnaldita,
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
