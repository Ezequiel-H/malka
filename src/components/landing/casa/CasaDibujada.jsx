import { Guirnalda, Humo, Persona, PersonaSentada, Planta, Vela } from './piezas';

/**
 * La casa, dibujada en corte.
 *
 * Es el mapa de Malka y a la vez la navegación: cada piso es una sección de la
 * página, y el piso que estás leyendo es el único que queda encendido. Los
 * demás no desaparecen —la casa entera tiene que seguir ahí, porque el
 * argumento es justamente que es una casa entera— pero bajan a un tercio.
 *
 * Está dibujada y no fotografiada por dos razones. Una: las fotos de los
 * espacios vacíos no existen, y las que hay son de encuentros con gente, que
 * sirven para otra cosa. La otra, la que manda: un dibujo puede moverse sin
 * mentir. El humo de la parrilla, el vapor del café y las velas de la mesa son
 * lo que hace que un plano se lea como una casa habitada, y eso en una foto
 * quieta no pasa.
 *
 * La geometría está toda acá, en coordenadas de un viewBox de 420×620, y no en
 * un archivo exportado de una herramienta de diseño: así se puede leer, y las
 * medidas de los pisos son las mismas que usa la página para saber dónde está
 * parada.
 */

/* Las cotas del edificio. Un solo lugar: si mañana el salón crece, se mueve
   este número y no diecisiete rectángulos. */
const CASA = { x1: 70, x2: 290, techo: 130, piso: 560 };
const NIVELES = { terraza: 130, estudio: 270, cowork: 410, salon: 560 };
const QUINCHO = { x1: 292, x2: 386, techo: 462 };

const muro = 'fill-surface stroke-ink';

const CasaDibujada = ({ activo = 'todo', className = '' }) => {
  /* Un piso está encendido si es el que se está leyendo. `todo` los prende a
     todos: es el estado de la portada, donde la casa se presenta entera. */
  const luz = (id) =>
    activo === 'todo' || activo === id || (id === 'quincho' && activo === 'salon')
      ? 'opacity-100'
      : 'opacity-30';

  const grupo = (id) =>
    `transition-opacity duration-cinematic ease-standard ${luz(id)}`;

  return (
    <svg
      viewBox="0 0 420 620"
      className={className}
      role="img"
      aria-label="Corte de la casa de Malka: la terraza y la huerta arriba, el estudio, el cowork, el salón con la mesa larga y el quincho con la parrilla."
    >
      {/* ---- estructura ---- */}
      <g strokeWidth="2" strokeLinejoin="round">
        <rect
          x={CASA.x1}
          y={CASA.techo}
          width={CASA.x2 - CASA.x1}
          height={CASA.piso - CASA.techo}
          className={muro}
        />
        <rect
          x={QUINCHO.x1}
          y={QUINCHO.techo}
          width={QUINCHO.x2 - QUINCHO.x1}
          height={CASA.piso - QUINCHO.techo}
          className={muro}
        />
        {/* Losas. La de arriba es el piso de la terraza y sobresale, como
            sobresale una losa de verdad. */}
        <rect x={CASA.x1 - 6} y={CASA.techo - 5} width={CASA.x2 - CASA.x1 + 12} height="8" className="fill-ink" />
        {[NIVELES.estudio, NIVELES.cowork, NIVELES.salon].map((y) => (
          <g key={y}>
            {/* Cada losa lleva una veta de madera arriba: es lo único que le
                mete temperatura a un dibujo que si no es todo verde y blanco. */}
            <rect x={CASA.x1} y={y - 9} width={CASA.x2 - CASA.x1} height="5" className="fill-barro-claro" />
            <rect x={CASA.x1} y={y - 4} width={CASA.x2 - CASA.x1} height="4" className="fill-ink/60" />
          </g>
        ))}
        {/* La vereda: la casa apoya en la calle, no flota. */}
        <path d={`M 8 ${CASA.piso} L 412 ${CASA.piso}`} className="stroke-ink" strokeLinecap="round" />
      </g>

      {/* ---- terraza y huerta ---- */}
      <g className={grupo('terraza')}>
        <Guirnalda x1={CASA.x1 + 8} x2={CASA.x2 - 8} y={58} />
        {/* Baranda */}
        <g className="stroke-ink/50" strokeWidth="2" strokeLinecap="round">
          <path d={`M ${CASA.x1 + 6} 88 L ${CASA.x2 - 6} 88`} />
          {Array.from({ length: 11 }, (_, i) => CASA.x1 + 12 + i * 20).map((x) => (
            <path key={x} d={`M ${x} 88 L ${x} ${NIVELES.terraza - 6}`} />
          ))}
        </g>
        {/* La huerta, a la izquierda */}
        {[
          { x: 96, alto: 30, delay: 0 },
          { x: 118, alto: 24, delay: 700 },
          { x: 140, alto: 32, delay: 1400 },
          { x: 162, alto: 26, delay: 2100 },
        ].map((p) => (
          <Planta key={p.x} x={p.x} y={NIVELES.terraza - 6} alto={p.alto} delay={p.delay} maceta={false} />
        ))}
        {/* Y el rato de estar sentado mirando la ciudad */}
        <PersonaSentada x={224} y={NIVELES.terraza - 6} alto={36} />
        <PersonaSentada x={256} y={NIVELES.terraza - 6} alto={38} color="fill-primary-700" />
      </g>

      {/* ---- estudio ---- */}
      <g className={grupo('estudio')}>
        <rect x={206} y={172} width={64} height={44} rx="3" className="fill-primary-100 stroke-primary-600" strokeWidth="2" />
        <path d="M 214 186 L 262 186 M 214 196 L 246 196" className="stroke-primary-600" strokeWidth="2" strokeLinecap="round" />
        {[
          { x: 96, w: 54 },
          { x: 158, w: 54 },
        ].map((m) => (
          <rect key={m.x} x={m.x} y={NIVELES.estudio - 12} width={m.w} height="7" rx="3.5" className="fill-barro-claro" />
        ))}
        <PersonaSentada x={124} y={NIVELES.estudio - 12} alto={42} />
        <PersonaSentada x={186} y={NIVELES.estudio - 12} alto={38} color="fill-primary-700" />
        <Planta x={274} y={NIVELES.estudio - 6} alto={30} delay={400} />
      </g>

      {/* ---- cowork ---- */}
      <g className={grupo('cowork')}>
        {/* Estante con libros */}
        <rect x={96} y={306} width={70} height="5" className="fill-ink/70" />
        {[0, 10, 20, 30, 42, 52].map((d, i) => (
          <rect
            key={d}
            x={100 + d}
            y={306 - (i % 2 === 0 ? 22 : 18)}
            width="8"
            height={i % 2 === 0 ? 22 : 18}
            className={i % 3 === 0 ? 'fill-primary' : i % 3 === 1 ? 'fill-flame' : 'fill-ink/60'}
          />
        ))}

        {/* Dos escritorios con sus laptops */}
        {[110, 202].map((x) => (
          <g key={x}>
            <rect x={x} y={368} width={78} height="6" className="fill-barro" />
            <rect x={x + 4} y={374} width="4" height={NIVELES.cowork - 374} className="fill-barro-oscuro" />
            <rect x={x + 70} y={374} width="4" height={NIVELES.cowork - 374} className="fill-barro-oscuro" />
            <path d={`M ${x + 22} 368 L ${x + 28} 350 L ${x + 54} 350 L ${x + 52} 368 Z`} className="fill-ink" />
          </g>
        ))}

        <Persona x={152} y={NIVELES.cowork} alto={72} />
        <Persona x={246} y={NIVELES.cowork} alto={68} color="fill-primary-700" mirando={-1} />

        {/* El café con cakes que ellos mismos prometen */}
        <rect x={186} y={360} width="10" height="8" rx="1.5" className="fill-surface stroke-ink" strokeWidth="1.5" />
        <Humo x={191} y={352} escala={0.7} />
      </g>

      {/* ---- salón ---- */}
      <g className={grupo('salon')}>
        {/* La puerta: un hueco en la pared y alguien entrando. La casa está
            abierta, así que no hay hoja de puerta que dibujar. */}
        <rect x={CASA.x1 - 3} y={486} width="6" height={NIVELES.salon - 486} className="fill-surface" />
        <path
          d={`M ${CASA.x1 - 3} ${NIVELES.salon} L ${CASA.x1 - 3} 486 L ${CASA.x1 + 3} 486 L ${CASA.x1 + 3} ${NIVELES.salon}`}
          className="fill-none stroke-ink"
          strokeWidth="2"
        />
        {/* El umbral, y alguien llegando. La puerta no tiene hoja a propósito:
            la casa está abierta y dibujar una hoja cerrada diría lo contrario. */}
        <rect x={CASA.x1 - 22} y={NIVELES.salon - 5} width={22} height="5" className="fill-barro" />
        <Persona x={40} y={NIVELES.salon} alto={70} color="fill-primary-700" />

        {/* Una lámpara sobre la mesa. El salón es el piso más alto del dibujo
            y sin nada colgando quedaba un techo vacío de setenta píxeles. */}
        <path d={`M 182 ${NIVELES.cowork + 4} L 182 452`} className="stroke-ink/60" strokeWidth="1.5" />
        <path d="M 166 470 L 198 470 L 190 452 L 174 452 Z" className="fill-ink" />
        <ellipse cx={182} cy={496} rx={26} ry={11} className="fill-flame/20" />

        {/* La mesa larga */}
        <rect x={96} y={516} width={172} height="6" className="fill-barro" />
        <rect x={104} y={522} width="4" height={NIVELES.salon - 522} className="fill-barro-oscuro" />
        <rect x={256} y={522} width="4" height={NIVELES.salon - 522} className="fill-barro-oscuro" />
        <Vela x={168} y={516} alto={16} />
        <Vela x={182} y={516} alto={16} delay={600} />

        {[
          { x: 118, alto: 74 },
          { x: 140, alto: 70 },
          { x: 218, alto: 76 },
          { x: 240, alto: 71 },
        ].map((p, i) => (
          <Persona
            key={p.x}
            x={p.x}
            y={NIVELES.salon}
            alto={p.alto}
            color={i % 2 ? 'fill-primary-700' : 'fill-ink'}
            mirando={i > 1 ? -1 : 1}
          />
        ))}
      </g>

      {/* ---- quincho ---- */}
      <g className={grupo('quincho')}>
        <rect x={302} y={506} width={56} height="6" className="fill-ink" />
        {/* Brasas: cinco rectangulitos ámbar debajo de la parrilla. Es el único
            fuego del dibujo además de las velas, y alcanza. */}
        {[308, 318, 328, 338, 348].map((x, i) => (
          <rect
            key={x}
            x={x}
            y={514}
            width="6"
            height="5"
            rx="1.5"
            className={i % 2 ? 'fill-flame' : 'fill-flame-deep'}
          />
        ))}
        <rect x={304} y={512} width="4" height={NIVELES.salon - 512} className="fill-ink/70" />
        <rect x={352} y={512} width="4" height={NIVELES.salon - 512} className="fill-ink/70" />
        <Humo x={320} y={498} delay={200} />
        <Humo x={340} y={500} delay={1100} escala={0.8} />
        <Persona x={366} y={NIVELES.salon} alto={68} mirando={-1} />
      </g>
    </svg>
  );
};

export default CasaDibujada;
