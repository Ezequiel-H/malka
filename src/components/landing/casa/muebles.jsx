import { FONDO, TRAZO } from './geometria';

/**
 * El mobiliario y los objetos de la casa.
 *
 * Un solo sistema para todos: relleno plano de la paleta + filete de tinta del
 * mismo grosor, y volumen con la misma regla de siempre (tapa clara arriba,
 * canto oscuro a la derecha). Que todo comparta trazo y lógica de sombra es lo
 * que hace que una ilustración se lea profesional; el detalle suelto, por lindo
 * que sea, no alcanza si cada pieza está dibujada con otro criterio.
 *
 * Cada objeto se ubica por su **base**: el punto donde toca el piso o la mesa.
 * Así se los puede apoyar sin hacer cuentas, que es la operación que uno repite
 * cincuenta veces al componer una escena.
 */

const filete = 'stroke-ink';

/** Caja con volumen: tapa, frente y canto. La base de casi todo el mobiliario. */
export const Caja = ({
  x,
  y,
  ancho,
  alto,
  prof = 0.22,
  claro = 'fill-barro-claro',
  base = 'fill-barro',
  oscuro = 'fill-barro-oscuro',
  trazo = true,
}) => {
  const dx = FONDO.x * prof;
  const dy = FONDO.y * prof;
  return (
    <g className={trazo ? filete : ''} strokeWidth={trazo ? TRAZO : 0} strokeLinejoin="round">
      <path d={`M ${x} ${y} L ${x + ancho} ${y} L ${x + ancho + dx} ${y + dy} L ${x + dx} ${y + dy} Z`} className={claro} />
      <rect x={x} y={y} width={ancho} height={alto} className={base} />
      <path
        d={`M ${x + ancho} ${y} L ${x + ancho + dx} ${y + dy} L ${x + ancho + dx} ${y + alto + dy} L ${x + ancho} ${y + alto} Z`}
        className={oscuro}
      />
    </g>
  );
};

/** Mesa: tapa con volumen y dos patas. `y` es la altura de la tapa. */
export const Mesa = ({ x, y, ancho, piso, prof = 0.3 }) => (
  <g>
    <rect x={x + 6} y={y + 6} width="5" height={piso - y - 6} className="fill-barro-oscuro" />
    <rect x={x + ancho - 12} y={y + 6} width="5" height={piso - y - 6} className="fill-barro-oscuro" />
    <Caja x={x} y={y} ancho={ancho} alto={6} prof={prof} />
  </g>
);

/** Silla de costado: asiento, respaldo y dos patas. */
export const Silla = ({ x, y, alto = 34, mirando = 1 }) => {
  const asiento = y - alto * 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${mirando} 1) translate(${-x} ${-y})`}>
      <g className={filete} strokeWidth={TRAZO} strokeLinecap="round">
        <path d={`M ${x - 9} ${y} L ${x - 9} ${asiento}`} className="stroke-ink" />
        <path d={`M ${x + 9} ${y} L ${x + 9} ${asiento}`} className="stroke-ink" />
        <path d={`M ${x - 10} ${asiento} L ${x + 10} ${asiento}`} className="stroke-ink" strokeWidth={TRAZO * 2} />
        <path d={`M ${x + 9} ${asiento} L ${x + 9} ${asiento - alto * 0.44}`} className="stroke-ink" />
        <path
          d={`M ${x + 4} ${asiento - alto * 0.44} L ${x + 10} ${asiento - alto * 0.44}`}
          className="stroke-ink"
          strokeWidth={TRAZO * 1.6}
        />
      </g>
    </g>
  );
};

/** Sillón de dos cuerpos, de frente. */
export const Sillon = ({ x, y, ancho = 62 }) => (
  <g className={filete} strokeWidth={TRAZO} strokeLinejoin="round">
    <rect x={x} y={y - 26} width={ancho} height={12} rx="4" className="fill-primary-200" />
    <rect x={x - 4} y={y - 34} width={10} height={26} rx="4" className="fill-primary-300" />
    <rect x={x + ancho - 6} y={y - 34} width={10} height={26} rx="4" className="fill-primary-300" />
    <rect x={x + 4} y={y - 44} width={ancho - 8} height={20} rx="5" className="fill-primary-200" />
    <rect x={x + 6} y={y - 14} width={5} height={14} className="fill-ink/70" />
    <rect x={x + ancho - 11} y={y - 14} width={5} height={14} className="fill-ink/70" />
  </g>
);

/** Estante con libros contra una pared. */
export const Estante = ({ x, y, ancho = 74 }) => (
  <g>
    {Array.from({ length: Math.floor(ancho / 11) }, (_, i) => {
      const alto = 16 + ((i * 7) % 9);
      const color = i % 3 === 0 ? 'fill-primary' : i % 3 === 1 ? 'fill-flame' : 'fill-ink/70';
      return <rect key={i} x={x + 4 + i * 11} y={y - alto} width="8" height={alto} rx="1" className={color} />;
    })}
    <rect x={x} y={y} width={ancho} height="4" className="fill-barro-oscuro" />
  </g>
);

/** Pizarra o pantalla colgada en la pared del fondo. */
export const Pizarra = ({ x, y, ancho = 70, alto = 46 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y} width={ancho} height={alto} rx="3" className="fill-primary-100" />
    <path
      d={`M ${x + 10} ${y + 16} L ${x + ancho - 14} ${y + 16} M ${x + 10} ${y + 26} L ${x + ancho - 28} ${y + 26}`}
      className="stroke-primary-600"
      strokeLinecap="round"
    />
  </g>
);

/** Atril de estudio. */
export const Atril = ({ x, y, alto = 42 }) => (
  <g className={filete} strokeWidth={TRAZO} strokeLinecap="round">
    <path d={`M ${x} ${y} L ${x} ${y - alto}`} className="stroke-ink" strokeWidth={TRAZO * 1.4} />
    <path d={`M ${x - 9} ${y} L ${x + 9} ${y}`} className="stroke-ink" />
    <path d={`M ${x - 12} ${y - alto} L ${x + 12} ${y - alto - 6} L ${x + 12} ${y - alto - 2} L ${x - 12} ${y - alto + 4} Z`} className="fill-barro stroke-ink" />
  </g>
);

/** Alfombra o colchoneta: un plano apoyado, en fuga. */
export const Alfombra = ({ x, y, ancho, prof = 0.5, color = 'fill-barro-claro' }) => (
  <path
    d={`M ${x} ${y} L ${x + ancho} ${y} L ${x + ancho + FONDO.x * prof} ${y + FONDO.y * prof} L ${x + FONDO.x * prof} ${y + FONDO.y * prof} Z`}
    className={`${color} stroke-ink/25`}
    strokeWidth="1"
  />
);

/** Colchoneta enrollada, parada contra la pared. */
export const Rollo = ({ x, y, alto = 30 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y - alto} width="11" height={alto} rx="5.5" className="fill-primary-200" />
    <ellipse cx={x + 5.5} cy={y - alto} rx="5.5" ry="2.4" className="fill-primary-300" />
  </g>
);

/* ------------------------------------------------------------------ */
/* La banda de la terraza                                              */
/* ------------------------------------------------------------------ */

/** Teclado sobre soporte en X. */
export const Teclado = ({ x, y, ancho = 54 }) => (
  <g className={filete} strokeWidth={TRAZO} strokeLinecap="round">
    <path d={`M ${x + 8} ${y} L ${x + ancho - 8} ${y - 26} M ${x + ancho - 8} ${y} L ${x + 8} ${y - 26}`} className="stroke-ink" />
    <rect x={x} y={y - 32} width={ancho} height={7} rx="2" className="fill-ink" />
    <rect x={x + 3} y={y - 30} width={ancho - 6} height="3" className="fill-surface" />
    {/* Las teclas se hunden desfasadas: al ojo le alcanza con ver dos o tres
        bajando en distinto momento para leer que alguien está tocando. */}
    {Array.from({ length: 9 }, (_, i) => (
      <rect
        key={i}
        x={x + 6 + i * 5.4}
        y={-30 + y}
        width="1.6"
        height="3"
        className="animate-tecla fill-ink motion-reduce:animate-none"
        style={{ animationDelay: `${(i % 4) * 300}ms` }}
        stroke="none"
      />
    ))}
  </g>
);

/**
 * Guitarra, bajo o violín: la misma construcción con tres medidas. El cuerpo
 * son dos elipses que se pisan —que es literalmente la forma de una caja de
 * guitarra— y el mástil un rectángulo largo.
 */
export const Cuerdas = ({ x, y, tipo = 'guitarra', mirando = 1 }) => {
  /* Medidas chicas a propósito: al lado de una persona de sesenta unidades, una
     caja de guitarra dibujada "a escala real" se convierte en una mancha que se
     come a quien la toca. Lo que tiene que leerse es la silueta. */
  const M = {
    guitarra: { cuerpo: 10, cintura: 7.4, mastil: 26, color: 'fill-barro-claro' },
    bajo: { cuerpo: 8.6, cintura: 6.2, mastil: 32, color: 'fill-barro' },
    violin: { cuerpo: 6.4, cintura: 4.6, mastil: 17, color: 'fill-barro-oscuro' },
  }[tipo];
  return (
    <g transform={`translate(${x} ${y}) scale(${mirando} 1)`} className={filete} strokeWidth={TRAZO}>
      <ellipse cx="0" cy="0" rx={M.cuerpo} ry={M.cuerpo * 0.86} className={M.color} />
      <ellipse cx="0" cy={-M.cuerpo * 1.15} rx={M.cintura} ry={M.cintura * 0.82} className={M.color} />
      <rect x={-1.9} y={-M.cuerpo * 1.15 - M.mastil} width="3.8" height={M.mastil} className="fill-ink" />
      <rect x={-3.4} y={-M.cuerpo * 1.15 - M.mastil - 6} width="6.8" height="7" rx="1.4" className="fill-ink" />
    </g>
  );
};

/** Arco de violín, yendo y viniendo sobre las cuerdas. */
export const Arco = ({ x, y, largo = 26, giro = -28 }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro})`}>
    <path
      d={`M 0 0 L ${largo} 0`}
      className="animate-arco stroke-barro-oscuro motion-reduce:animate-none"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </g>
);

/** Cajón peruano: un cubo para sentarse y golpear. */
export const Cajon = ({ x, y }) => (
  <g
    className="animate-golpe motion-reduce:animate-none"
    style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
  >
    <Caja x={x} y={y - 26} ancho={20} alto={26} prof={0.3} />
    <circle cx={x + 10} cy={y - 14} r="3.4" className="fill-ink/50" />
  </g>
);

/** Platillo en su trípode. */
export const Platillo = ({ x, y, alto = 40 }) => (
  <g className={filete} strokeWidth={TRAZO} strokeLinecap="round">
    <path d={`M ${x} ${y} L ${x} ${y - alto} M ${x - 7} ${y} L ${x + 7} ${y}`} className="stroke-ink" />
    <ellipse
      cx={x}
      cy={y - alto}
      rx="12"
      ry="2.6"
      className="animate-platillo fill-flame motion-reduce:animate-none"
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  </g>
);

/** Micrófono de pie, con jirafa. */
export const Microfono = ({ x, y, alto = 52, mirando = 1, ondas = false }) => (
  <g className={filete} strokeWidth={TRAZO} strokeLinecap="round" transform={`translate(${x} ${y}) scale(${mirando} 1)`}>
    <path d="M 0 0 L 0 -34" className="stroke-ink" strokeWidth={TRAZO * 1.2} />
    <path d={`M -8 0 L 8 0 M 0 -34 L 14 ${-alto}`} className="stroke-ink" />
    <rect x={12} y={-alto - 6} width="6" height="9" rx="3" className="fill-ink" />
    {/* Tres arcos saliendo de la cápsula. Es la única licencia de historieta de
        todo el dibujo y se la gana: sin ella el micrófono es un objeto apagado. */}
    {ondas &&
      [0, 600, 1200].map((d) => (
        <path
          key={d}
          d={`M 20 ${-alto - 8} q 7 6 0 12`}
          className="animate-onda fill-none stroke-ink/60 motion-reduce:hidden"
          style={{ transformBox: 'fill-box', transformOrigin: 'left center', animationDelay: `${d}ms` }}
        />
      ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* La mesa de Shabat                                                   */
/* ------------------------------------------------------------------ */

/** Candelabro de dos brazos, con sus velas. La llama la pone `Vela`. */
export const Candelabro = ({ x, y }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path d={`M ${x - 8} ${y} L ${x + 8} ${y} L ${x + 5} ${y - 3} L ${x - 5} ${y - 3} Z`} className="fill-barro-oscuro" />
    <rect x={x - 1.6} y={y - 12} width="3.2" height="9" className="fill-barro-oscuro" />
  </g>
);

/** Copa de kidush. */
export const Copa = ({ x, y, alto = 13 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path d={`M ${x - 4.5} ${y - alto} L ${x + 4.5} ${y - alto} L ${x + 3} ${y - alto * 0.45} L ${x - 3} ${y - alto * 0.45} Z`} className="fill-flame-deep" />
    <path d={`M ${x} ${y - alto * 0.45} L ${x} ${y - 2}`} className="stroke-ink" />
    <path d={`M ${x - 4} ${y} L ${x + 4} ${y}`} className="stroke-ink" strokeWidth={TRAZO * 1.5} strokeLinecap="round" />
  </g>
);

/** Botella de vino. */
export const Botella = ({ x, y, alto = 22 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path
      d={`M ${x - 4.5} ${y} L ${x - 4.5} ${y - alto * 0.55}
          Q ${x - 4.5} ${y - alto * 0.72} ${x - 1.8} ${y - alto * 0.8}
          L ${x - 1.8} ${y - alto} L ${x + 1.8} ${y - alto}
          L ${x + 1.8} ${y - alto * 0.8}
          Q ${x + 4.5} ${y - alto * 0.72} ${x + 4.5} ${y - alto * 0.55}
          L ${x + 4.5} ${y} Z`}
      className="fill-primary-800"
    />
  </g>
);

/** Las dos jalot bajo el paño bordado: el centro de la mesa. */
export const Jalot = ({ x, y }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <ellipse cx={x - 6} cy={y - 4} rx="8" ry="4.6" className="fill-barro" />
    <ellipse cx={x + 6} cy={y - 4} rx="8" ry="4.6" className="fill-barro" />
    <path d={`M ${x - 16} ${y - 3} Q ${x} ${y - 13} ${x + 16} ${y - 3} Q ${x} ${y + 2} ${x - 16} ${y - 3} Z`} className="fill-primary-200" />
  </g>
);

/** Plato servido, visto de arriba en fuga. */
export const Plato = ({ x, y, r = 6 }) => (
  <g className={filete} strokeWidth="1.2">
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.42} className="fill-surface" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Cowork y quincho                                                    */
/* ------------------------------------------------------------------ */

/** Laptop abierta. */
export const Laptop = ({ x, y, mirando = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${mirando} 1)`} className={filete} strokeWidth={TRAZO}>
    <path d="M 0 0 L 6 -18 L 30 -18 L 28 0 Z" className="fill-ink" />
    <path
      d="M 9 -15 L 27 -15 L 25.6 -3 L 11 -3 Z"
      className="animate-pantalla fill-primary-300 motion-reduce:animate-none"
    />
  </g>
);

/** Taza con su vapor (el vapor lo agrega quien la usa). */
export const Taza = ({ x, y }) => (
  <g className={filete} strokeWidth="1.3">
    <path d={`M ${x} ${y} L ${x} ${y - 8} L ${x + 9} ${y - 8} L ${x + 9} ${y} Z`} className="fill-surface" />
    <path d={`M ${x + 9} ${y - 6} Q ${x + 13} ${y - 4} ${x + 9} ${y - 2}`} className="fill-none stroke-ink" />
  </g>
);

/** La parrilla del quincho, con sus brasas. */
export const Parrilla = ({ x, y, piso, ancho = 58 }) => (
  <g>
    <rect x={x + 3} y={y} width="4" height={piso - y} className="fill-ink/70" />
    <rect x={x + ancho - 7} y={y} width="4" height={piso - y} className="fill-ink/70" />
    <Caja x={x} y={y - 6} ancho={ancho} alto={6} prof={0.3} claro="fill-ink/70" base="fill-ink" oscuro="fill-ink" trazo={false} />
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={x + 5 + i * 9} y={y + 2} width="6" height="4" rx="1.5" className={i % 2 ? 'fill-flame' : 'fill-flame-deep'} />
    ))}
    {Array.from({ length: 5 }, (_, i) => (
      <rect key={`v-${i}`} x={x + 6 + i * 11} y={y - 10} width="7" height="4" rx="1.6" className="fill-barro-oscuro" />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* El subsuelo                                                         */
/* ------------------------------------------------------------------ */

/** Un auto de costado, para la cochera. */
export const Auto = ({ x, y, largo = 76, mirando = 1 }) => {
  const alto = largo * 0.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${mirando} 1)`} className={filete} strokeWidth={TRAZO} strokeLinejoin="round">
      <path
        d={`M 0 ${-alto * 0.42} Q 0 ${-alto * 0.72} ${largo * 0.14} ${-alto * 0.74}
            L ${largo * 0.3} ${-alto * 1.28} Q ${largo * 0.36} ${-alto * 1.5} ${largo * 0.52} ${-alto * 1.5}
            L ${largo * 0.72} ${-alto * 1.5} Q ${largo * 0.84} ${-alto * 1.48} ${largo * 0.88} ${-alto * 1.2}
            L ${largo * 0.96} ${-alto * 0.78} Q ${largo} ${-alto * 0.7} ${largo} ${-alto * 0.42}
            L ${largo} ${-alto * 0.2} L 0 ${-alto * 0.2} Z`}
        className="fill-primary-300"
      />
      {/* Ventanillas: dos trapecios separados por el parante. */}
      <path
        d={`M ${largo * 0.34} ${-alto * 0.8} L ${largo * 0.44} ${-alto * 1.34} L ${largo * 0.58} ${-alto * 1.34} L ${largo * 0.58} ${-alto * 0.8} Z`}
        className="fill-primary-100"
      />
      <path
        d={`M ${largo * 0.63} ${-alto * 0.8} L ${largo * 0.63} ${-alto * 1.34} L ${largo * 0.76} ${-alto * 1.34} L ${largo * 0.84} ${-alto * 0.8} Z`}
        className="fill-primary-100"
      />
      {[largo * 0.24, largo * 0.78].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={-alto * 0.2} r={alto * 0.3} className="fill-ink" />
          <circle cx={cx} cy={-alto * 0.2} r={alto * 0.12} className="fill-casa-piso" />
        </g>
      ))}
    </g>
  );
};

/** El portón de la cochera, con su rampa hacia la calle. */
export const Porton = ({ x, y, ancho = 52, alto = 60 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y - alto} width={ancho} height={alto} className="fill-casa-costado" />
    {Array.from({ length: 5 }, (_, i) => (
      <path key={i} d={`M ${x} ${y - alto + 10 + i * 11} L ${x + ancho} ${y - alto + 10 + i * 11}`} className="stroke-ink/40" />
    ))}
  </g>
);

/**
 * Notas flotando desde donde sale la música.
 *
 * Cada una sube, se corre un poco y se apaga antes de llegar al borde de la
 * terraza. Salen desfasadas ocho tiempos entre sí —la misma grilla que toca la
 * banda—, así que aparecen a un ritmo que coincide con lo que se está tocando
 * en vez de gotear a un compás propio.
 */
export const Notas = ({ x, y, cantidad = 4, escala = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    {Array.from({ length: cantidad }, (_, i) => (
      <g
        key={i}
        className="animate-flotar motion-reduce:hidden"
        style={{ animationDelay: `${i * 1200}ms` }}
      >
        <g transform={`translate(${(i % 2) * 9 - 4} 0)`} className="fill-ink/45">
          <ellipse cx="0" cy="0" rx="3.1" ry="2.3" transform="rotate(-22)" />
          <rect x="2.1" y="-11" width="1.3" height="11" />
          {/* La corchea lleva su corchete; la negra no. Dos formas distintas
              alcanzan para que no se lea como el mismo sello repetido. */}
          {i % 2 === 0 && <path d="M 3.4 -11 q 5.4 3 0.6 7.4" className="fill-none stroke-ink/45" strokeWidth="1.4" />}
        </g>
      </g>
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* La escalera y el techo                                              */
/* ------------------------------------------------------------------ */

/**
 * La escalera caracol, de las de hierro antiguas.
 *
 * No está dibujada peldaño por peldaño a mano: se genera girando. Cada escalón
 * sale del eje con un ángulo un poco mayor que el anterior y sube una altura
 * fija, y el achatamiento de la vuelta —lo que hace que se lea como una espiral
 * y no como un abanico— sale de multiplicar el coseno del ángulo por lo mismo
 * que achata todo el dibujo. Es la misma cuenta que usa la casa para la fuga,
 * aplicada peldaño a peldaño.
 *
 * El pasamanos es la hélice que pasa por la punta de cada escalón: se dibuja
 * como una sola polilínea y el ojo la completa. Con el eje, los escalones y esa
 * curva alcanza — una caracol de hierro no es mucho más que eso.
 */
export const Caracol = ({ x, base, alto, radio = 27, subida = 20, porVuelta = 10 }) => {
  const pasos = Math.round(alto / subida);

  const punto = (i) => {
    const ang = (i / porVuelta) * Math.PI * 2;
    return {
      i,
      dx: Math.sin(ang) * radio,
      /* El coseno achatado es la profundidad del peldaño: es la misma cuenta
         que usa la casa para la fuga, aplicada escalón por escalón. */
      dy: Math.cos(ang) * radio * 0.34,
      y: base - i * subida,
      frente: Math.cos(ang) > 0,
    };
  };

  const escalones = Array.from({ length: pasos }, (_, i) => punto(i));

  /* Cada peldaño es una chapa, no una línea: sale angosto del eje y se abre
     hacia afuera, que es la forma real de un escalón de caracol y lo que hace
     que se entienda a simple vista. */
  const chapa = (p) => `
    M ${x} ${p.y - 2.2}
    L ${x + p.dx} ${p.y + p.dy - 3.6}
    L ${x + p.dx} ${p.y + p.dy + 2.4}
    L ${x} ${p.y + 2.6} Z`;

  /* El pasamanos se muestrea cuatro veces por escalón: con un punto por
     peldaño la hélice sale poligonal y se ve el truco. */
  const rail = Array.from({ length: pasos * 4 }, (_, k) => {
    const p = punto(k / 4);
    return `${k === 0 ? 'M' : 'L'} ${x + p.dx} ${p.y + p.dy - 30}`;
  }).join(' ');

  const plancha = (grupo) =>
    grupo.map((p) => (
      <path key={p.i} d={chapa(p)} className={`${p.frente ? 'fill-barro-claro' : 'fill-barro'} stroke-ink`} strokeWidth="1.2" strokeLinejoin="round" />
    ));

  return (
    <g>
      {/* Primero los peldaños de atrás, después el eje, después los de
          adelante: ese orden es todo lo que hace falta para que la espiral se
          vea girar en vez de verse como un abanico plano. */}
      {plancha(escalones.filter((p) => !p.frente))}

      <rect x={x - 2.6} y={base - alto - 4} width="5.2" height={alto + 4} className="fill-ink" />
      <ellipse cx={x} cy={base} rx="9" ry="3" className="fill-ink/80" />

      {plancha(escalones.filter((p) => p.frente))}

      {/* Balaustres cada dos escalones y el pasamanos por encima de todo. */}
      {escalones
        .filter((p) => p.i % 2 === 0)
        .map((p) => (
          <path
            key={`b-${p.i}`}
            d={`M ${x + p.dx} ${p.y + p.dy} L ${x + p.dx} ${p.y + p.dy - 30}`}
            className={p.frente ? 'stroke-ink/45' : 'stroke-ink/25'}
            strokeWidth="1.2"
          />
        ))}
      <path d={rail} className="fill-none stroke-ink/60" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

/** El tanque de agua: no hay terraza porteña sin uno. */
export const Tanque = ({ x, y, ancho = 30, alto = 26 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path d={`M ${x + 4} ${y} L ${x + 4} ${y - 10} M ${x + ancho - 4} ${y} L ${x + ancho - 4} ${y - 10}`} className="stroke-ink" />
    <rect x={x} y={y - 10 - alto} width={ancho} height={alto} rx="4" className="fill-casa-costado" />
    <ellipse cx={x + ancho / 2} cy={y - 10 - alto} rx={ancho / 2} ry="4" className="fill-casa-fondo" />
  </g>
);

/** El cartel de la casa, al lado de la puerta. */
export const Cartel = ({ x, y, ancho = 26 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y} width={ancho} height={ancho * 0.42} rx="2" className="fill-primary" />
    <path
      d={`M ${x + 5} ${y + ancho * 0.26} L ${x + ancho - 5} ${y + ancho * 0.26}`}
      className="stroke-surface-page"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </g>
);

/** Chispas de la parrilla. */
export const Chispas = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} className="fill-flame">
    {[0, 800, 1600].map((d, i) => (
      <circle
        key={d}
        cx={i * 5 - 5}
        cy="0"
        r="1.4"
        className="animate-chispa motion-reduce:hidden"
        style={{ animationDelay: `${d}ms` }}
      />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* La cocina                                                           */
/* ------------------------------------------------------------------ */

/** Mesada con bajo mesada y una hornalla encendida. */
export const Mesada = ({ x, y, ancho = 86 }) => (
  <g>
    <Caja x={x} y={y - 34} ancho={ancho} alto={34} prof={0.24} claro="fill-casa-piso" base="fill-casa-costado" oscuro="fill-casa-sombra" />
    {/* Las puertas del bajo mesada */}
    {Array.from({ length: Math.floor(ancho / 28) }, (_, i) => (
      <rect
        key={i}
        x={x + 5 + i * 28}
        y={y - 28}
        width="22"
        height="24"
        rx="2"
        className="fill-none stroke-ink/25"
        strokeWidth="1.2"
      />
    ))}
    {/* Las hornallas, vistas desde arriba en fuga */}
    {[0.3, 0.52].map((f, i) => (
      <ellipse
        key={f}
        cx={x + ancho * f + FONDO.x * 0.12}
        cy={y - 34 + FONDO.y * 0.12}
        rx="6"
        ry="2.6"
        className={i === 0 ? 'fill-flame/70' : 'fill-ink/25'}
      />
    ))}
  </g>
);

/** Campana extractora. */
export const Campana = ({ x, y, ancho = 40 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path d={`M ${x} ${y} L ${x + ancho} ${y} L ${x + ancho - 9} ${y - 16} L ${x + 9} ${y - 16} Z`} className="fill-casa-costado" />
    <rect x={x + ancho / 2 - 6} y={y - 30} width="12" height="15" className="fill-casa-costado" />
  </g>
);

/** Alacena con vajilla a la vista. */
export const Alacena = ({ x, y, ancho = 54 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y} width={ancho} height="26" rx="2" className="fill-casa-fondo" />
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx={x + 12 + i * 15} cy={y + 18} rx="5.5" ry="5.5" className="fill-primary-100 stroke-ink/30" strokeWidth="1.1" />
    ))}
  </g>
);

/** Cafetera y torre de cakes: el rincón de café del cowork. */
export const RinconCafe = ({ x, y }) => (
  <g>
    <Caja x={x} y={y - 26} ancho={54} alto={26} prof={0.24} claro="fill-casa-piso" base="fill-casa-costado" oscuro="fill-casa-sombra" />
    <g className={filete} strokeWidth={TRAZO}>
      <rect x={x + 6} y={y - 46} width="16" height="20" rx="2" className="fill-ink" />
      <rect x={x + 9} y={y - 32} width="10" height="5" className="fill-flame/60" />
      {/* La torre de cakes, con su campana de vidrio */}
      <path d={`M ${x + 32} ${y - 26} L ${x + 32} ${y - 30} M ${x + 44} ${y - 26} L ${x + 44} ${y - 30}`} className="stroke-ink" />
      <ellipse cx={x + 38} cy={y - 30} rx="9" ry="2.6" className="fill-barro-claro" />
      <path d={`M ${x + 29} ${y - 31} a 9 11 0 0 1 18 0 Z`} className="fill-primary-100/70" />
    </g>
  </g>
);

/** El espejo de la sala del subsuelo. */
export const Espejo = ({ x, y, ancho = 110, alto = 60 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <rect x={x} y={y} width={ancho} height={alto} rx="2" className="fill-primary-100/60" />
    {/* El reflejo: dos diagonales y nada más. Cualquier intento de espejar el
        dibujo de verdad se lee como un error, no como un espejo. */}
    <path
      d={`M ${x + 10} ${y + alto - 8} L ${x + 34} ${y + 8} M ${x + 30} ${y + alto - 8} L ${x + 54} ${y + 8}`}
      className="stroke-surface/70"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </g>
);

/** Parlante en su pie: la clase necesita música. */
export const Parlante = ({ x, y, alto = 44 }) => (
  <g className={filete} strokeWidth={TRAZO}>
    <path d={`M ${x} ${y} L ${x} ${y - alto + 16} M ${x - 7} ${y} L ${x + 7} ${y}`} className="stroke-ink" strokeLinecap="round" />
    <rect x={x - 8} y={y - alto} width="16" height="18" rx="2" className="fill-ink" />
    <circle cx={x} cy={y - alto + 10} r="4" className="fill-casa-piso" />
  </g>
);
