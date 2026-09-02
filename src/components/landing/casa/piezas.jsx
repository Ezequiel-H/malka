
/**
 * Las piezas sueltas del dibujo de la casa.
 *
 * Todo es geometría: rectángulos, círculos y un par de curvas. No es una
 * limitación asumida a regañadientes — es el mismo lenguaje del logo de Malka,
 * donde la K es un candelabro hecho de tres barras y tres puntos. Un dibujo a
 * mano alzada al lado de ese wordmark se vería de otra marca.
 *
 * Desde que la casa es axonométrica, cada pieza tiene que resolver dos cosas
 * más: **apoyarse** (una sombra que la pega al piso; sin eso todo flota) y
 * **tener canto** (una cara superior y una lateral, que es lo que convierte un
 * rectángulo en un mueble).
 *
 * Cada pieza se anima en su propio tiempo — los `delay` nunca son múltiplos
 * exactos: si la huerta entera se mece al unísono se ve un GIF, y si cada
 * planta va por su lado se ve viento. Todas respetan `prefers-reduced-motion` y
 * quedan quietas sin romperse.
 */

/** La sombra que apoya cualquier cosa contra el piso. */
export const Sombra = ({ x, y, ancho, opacidad = 0.5 }) => (
  <ellipse
    cx={x + ancho * 0.1}
    cy={y - 1}
    rx={ancho * 0.62}
    ry={ancho * 0.2}
    className="fill-casa-sombra"
    opacity={opacidad}
  />
);

/** Una persona: cabeza, cuerpo, sombra y respiración. */
export const Persona = ({ x, y, alto = 34, color = 'fill-ink', mirando = 1, delay = 0, kipa = false, pelo = false }) => {
  /* Proporciones de persona y no de muñeco: la cabeza entra unas cinco veces y
     media en el alto. Con la cabeza más grande el dibujo se va a infantil, que
     es justo lo que no queremos para un público de treinta años. */
  const cabeza = alto * 0.115;
  const ancho = alto * 0.3;
  return (
    /* Tres nodos y no uno, y la razón es una trampa clásica de SVG: una
       animación CSS que toca `transform` **reemplaza** al atributo `transform`
       del elemento. Si la posición y la respiración viven en el mismo nodo, la
       figura se va al origen del dibujo en cuanto arranca la animación. Así
       que uno ubica, otro respira y el de adentro espeja. */
    <g transform={`translate(${x} ${y})`}>
      <Sombra x={0} y={0} ancho={ancho * 1.5} />
      <g
        className={`${color} animate-respirar motion-reduce:animate-none`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <g transform={`scale(${mirando} 1)`}>
          {/* Pelo largo y kipá: dos siluetas distintas sobre la misma cabeza.
              Es lo único que diferencia a una persona de otra a este tamaño, y
              alcanza para que un grupo deje de parecer una fila de clones. */}
          {pelo && (
            <path
              d={`M ${-cabeza * 1.15} ${-alto + cabeza * 0.6}
                  a ${cabeza * 1.15} ${cabeza * 1.15} 0 0 1 ${cabeza * 2.3} 0
                  l 0 ${cabeza * 2.4} l ${-cabeza * 0.7} 0 l 0 ${-cabeza * 1.6}
                  l ${-cabeza * 0.9} 0 l 0 ${cabeza * 1.6} l ${-cabeza * 0.7} 0 Z`}
            />
          )}
          {kipa && (
            <path d={`M ${-cabeza * 0.78} ${-alto + cabeza * 0.42} a ${cabeza * 0.8} ${cabeza * 0.8} 0 0 1 ${cabeza * 1.56} 0 Z`} />
          )}
          <circle cx="0" cy={-alto + cabeza} r={cabeza} />
          {/* Cuello corto y hombros caídos: el tronco arranca apenas debajo
              de la cabeza y se ensancha, que es lo que hace que una silueta se
              lea como alguien parado y no como un bolo. */}
          <path
            d={`M ${-ancho / 2} 0
              L ${-ancho / 2} ${-alto + cabeza * 3.4}
              Q ${-ancho / 2} ${-alto + cabeza * 2.2} ${-ancho * 0.16} ${-alto + cabeza * 2.1}
              L ${ancho * 0.16} ${-alto + cabeza * 2.1}
              Q ${ancho / 2} ${-alto + cabeza * 2.2} ${ancho / 2} ${-alto + cabeza * 3.4}
              L ${ancho / 2} 0 Z`}
          />
        </g>
      </g>
    </g>
  );
};

/** Alguien sentado con las piernas cruzadas. */
export const PersonaSentada = ({ x, y, alto = 26, color = 'fill-ink', delay = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <Sombra x={0} y={0} ancho={alto * 0.9} opacidad={0.4} />
    <g
      className={`${color} animate-respirar motion-reduce:animate-none`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <circle cx="0" cy={-alto + alto * 0.17} r={alto * 0.17} />
      {/* El tronco es un trapecio angosto y las piernas cruzadas, la base
          ancha. Un triángulo entero se lee como un cono. */}
      <path
        d={`M ${-alto * 0.19} ${-alto * 0.42}
            L ${-alto * 0.14} ${-alto + alto * 0.36}
            L ${alto * 0.14} ${-alto + alto * 0.36}
            L ${alto * 0.19} ${-alto * 0.42} Z`}
      />
      <path d={`M ${-alto * 0.52} 0 Q 0 ${-alto * 0.58} ${alto * 0.52} 0 Z`} />
    </g>
  </g>
);

/**
 * Alguien sentado en una silla, de costado: cabeza, torso apenas inclinado
 * hacia adelante, muslo horizontal y pierna al piso. Es la pose que hace que
 * un cowork o una mesa se lean como tales — con todos parados, cualquier
 * ambiente parece un cóctel.
 */
export const PersonaSilla = ({ x, y, alto = 62, color = 'fill-ink', mirando = 1, delay = 0, kipa = false, pelo = false }) => {
  const cabeza = alto * 0.115;
  const asiento = -alto * 0.46;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Sombra x={0} y={0} ancho={alto * 0.42} opacidad={0.34} />
      <g
        className={`${color} animate-respirar motion-reduce:animate-none`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <g transform={`scale(${mirando} 1)`}>
          {pelo && (
            <path
              d={`M ${-cabeza * 1.15} ${asiento - alto * 0.34 + cabeza * 0.6}
                  a ${cabeza * 1.15} ${cabeza * 1.15} 0 0 1 ${cabeza * 2.3} 0
                  l 0 ${cabeza * 2.2} l ${-cabeza * 2.3} 0 Z`}
            />
          )}
          {kipa && (
            <path
              d={`M ${-cabeza * 0.78} ${asiento - alto * 0.34 + cabeza * 0.42} a ${cabeza * 0.8} ${cabeza * 0.8} 0 0 1 ${cabeza * 1.56} 0 Z`}
            />
          )}
          <circle cx="0" cy={asiento - alto * 0.34 + cabeza} r={cabeza} />
          {/* Torso */}
          <path
            d={`M ${-alto * 0.075} ${asiento}
                L ${-alto * 0.085} ${asiento - alto * 0.3}
                Q ${-alto * 0.04} ${asiento - alto * 0.36} 0 ${asiento - alto * 0.36}
                Q ${alto * 0.06} ${asiento - alto * 0.35} ${alto * 0.085} ${asiento - alto * 0.28}
                L ${alto * 0.09} ${asiento} Z`}
          />
          {/* Muslo y pierna */}
          <path d={`M ${-alto * 0.08} ${asiento} L ${alto * 0.24} ${asiento} L ${alto * 0.24} ${asiento + alto * 0.11} L ${-alto * 0.08} ${asiento + alto * 0.11} Z`} />
          <path d={`M ${alto * 0.15} ${asiento + alto * 0.08} L ${alto * 0.24} ${asiento + alto * 0.08} L ${alto * 0.22} 0 L ${alto * 0.13} 0 Z`} />
        </g>
      </g>
    </g>
  );
};

/** Planta en maceta. Se mece desde la base, que es donde se doblan las plantas. */
export const Planta = ({ x, y, alto = 26, delay = 0, maceta = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <Sombra x={0} y={0} ancho={14} opacidad={0.35} />
    <g>
      {maceta && (
        <>
          <path d="M -7 0 L 7 0 L 5 -9 L -5 -9 Z" className="fill-barro" />
          <path d="M -5 -9 L 5 -9 L 7 -11 L -3 -11 Z" className="fill-barro-claro" />
        </>
      )}
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
  </g>
);

/** Humo o vapor: tres bocanadas desfasadas que suben y se abren. */
export const Humo = ({ x, y, delay = 0, escala = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`} className="fill-ink/20">
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
    <ellipse cx="0" cy={-alto - 4} rx="9" ry="9" className="fill-flame/25" />
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
        <g key={p.x}>
          <circle cx={p.x} cy={p.y + 4} r="7" className="animate-titilar fill-flame/20 motion-reduce:animate-none" style={{ animationDelay: `${p.delay}ms` }} />
          <circle
            cx={p.x}
            cy={p.y + 4}
            r="2.6"
            className="animate-titilar fill-flame motion-reduce:animate-none"
            style={{ animationDelay: `${p.delay}ms` }}
          />
        </g>
      ))}
    </g>
  );
};
