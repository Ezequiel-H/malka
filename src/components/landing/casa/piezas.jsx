/**
 * Las piezas sueltas del dibujo de la casa.
 *
 * Todo es geometría: rectángulos, círculos y un par de curvas. No es una
 * limitación asumida a regañadientes — es el mismo lenguaje del logo de Malka,
 * donde la K es un candelabro hecho de tres barras y tres puntos. Un dibujo a
 * mano alzada al lado de ese wordmark se vería de otra marca.
 *
 * Cada pieza se anima sola y en su propio tiempo (los `delay` nunca son
 * múltiplos exactos: si la huerta entera se mece al unísono se ve un GIF, y si
 * cada planta va por su lado se ve viento). Todas respetan
 * `prefers-reduced-motion` y quedan quietas sin romperse.
 */

/** Una persona: cabeza, cuerpo y nada más. A esta escala, una cara sería ruido. */
export const Persona = ({ x, y, alto = 34, color = 'fill-ink', mirando = 1 }) => {
  /* Proporciones de persona y no de muñeco: la cabeza entra unas cinco veces y
     media en el alto. Con la cabeza más grande el dibujo se va a infantil, que
     es justo lo que no queremos para un público de treinta años. */
  const cabeza = alto * 0.115;
  const ancho = alto * 0.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${mirando} 1)`} className={color}>
      <circle cx="0" cy={-alto + cabeza} r={cabeza} />
      {/* Cuello corto y hombros caídos: el tronco arranca apenas debajo de la
          cabeza y se ensancha, que es lo que hace que una silueta se lea como
          alguien parado y no como un bolo. */}
      <path
        d={`M ${-ancho / 2} 0
            L ${-ancho / 2} ${-alto + cabeza * 3.4}
            Q ${-ancho / 2} ${-alto + cabeza * 2.2} ${-ancho * 0.16} ${-alto + cabeza * 2.1}
            L ${ancho * 0.16} ${-alto + cabeza * 2.1}
            Q ${ancho / 2} ${-alto + cabeza * 2.2} ${ancho / 2} ${-alto + cabeza * 3.4}
            L ${ancho / 2} 0 Z`}
      />
    </g>
  );
};

/** Alguien sentado con las piernas cruzadas: un triángulo y una cabeza. */
export const PersonaSentada = ({ x, y, alto = 26, color = 'fill-ink' }) => (
  <g transform={`translate(${x} ${y})`} className={color}>
    <circle cx="0" cy={-alto + alto * 0.17} r={alto * 0.17} />
    {/* El tronco es un trapecio angosto y las piernas cruzadas, la base ancha.
        Un triángulo entero se lee como un cono. */}
    <path
      d={`M ${-alto * 0.19} ${-alto * 0.42}
          L ${-alto * 0.14} ${-alto + alto * 0.36}
          L ${alto * 0.14} ${-alto + alto * 0.36}
          L ${alto * 0.19} ${-alto * 0.42} Z`}
    />
    <path d={`M ${-alto * 0.52} 0 Q 0 ${-alto * 0.58} ${alto * 0.52} 0 Z`} />
  </g>
);

/** Planta en maceta. Se mece desde la base, que es donde se doblan las plantas. */
export const Planta = ({ x, y, alto = 26, delay = 0, maceta = true }) => (
  <g transform={`translate(${x} ${y})`}>
    {maceta && <path d="M -7 0 L 7 0 L 5 -9 L -5 -9 Z" className="fill-barro" />}
    <g
      className="origin-bottom animate-mecer motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms`, transformBox: 'fill-box', transformOrigin: 'bottom' }}
    >
      <path
        d={`M 0 ${maceta ? -8 : 0} L 0 ${-alto}`}
        className="stroke-primary-600"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx={-5} cy={-alto * 0.72} rx="6" ry="3.4" className="fill-primary-400" transform={`rotate(-28 ${-5} ${-alto * 0.72})`} />
      <ellipse cx={5} cy={-alto * 0.86} rx="6" ry="3.4" className="fill-primary" transform={`rotate(26 5 ${-alto * 0.86})`} />
    </g>
  </g>
);

/** Humo o vapor: tres bocanadas desfasadas que suben y se abren. */
export const Humo = ({ x, y, delay = 0, escala = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`} className="fill-ink/25">
    {[0, 900, 1800].map((d) => (
      <ellipse
        key={d}
        cx="0"
        cy="0"
        rx="4.5"
        ry="6"
        className="animate-humo motion-reduce:hidden"
        style={{ animationDelay: `${delay + d}ms` }}
      />
    ))}
  </g>
);

/** Vela encendida. Acá sí son velas: es la mesa de Shabat. */
export const Vela = ({ x, y, alto = 16, delay = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-2" y={-alto} width="4" height={alto} rx="1.4" className="fill-surface" />
    <path
      d={`M 0 ${-alto - 8} Q 3 ${-alto - 3} 0 ${-alto - 1} Q -3 ${-alto - 3} 0 ${-alto - 8} Z`}
      className="animate-llama fill-flame motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms`, transformBox: 'fill-box', transformOrigin: 'bottom' }}
    />
  </g>
);

/** Guirnalda de luces: una cuerda floja y sus bombitas. */
export const Guirnalda = ({ x1, x2, y, caida = 16 }) => {
  const bombitas = 9;
  const puntos = Array.from({ length: bombitas }, (_, i) => {
    const t = (i + 0.5) / bombitas;
    return {
      x: x1 + (x2 - x1) * t,
      /* La cuerda es una parábola, así que las bombitas cuelgan de ella y no
         de una recta: sin esto, las del medio flotan. */
      y: y + caida * 4 * t * (1 - t),
      delay: i * 210,
    };
  });

  return (
    <g>
      <path
        d={`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + caida * 2} ${x2} ${y}`}
        className="stroke-ink/35"
        strokeWidth="1.2"
        fill="none"
      />
      {puntos.map((p) => (
        <circle
          key={p.x}
          cx={p.x}
          cy={p.y + 4}
          r="2.6"
          className="animate-titilar fill-flame motion-reduce:animate-none"
          style={{ animationDelay: `${p.delay}ms` }}
        />
      ))}
    </g>
  );
};
