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

const FIGURAS = {
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
