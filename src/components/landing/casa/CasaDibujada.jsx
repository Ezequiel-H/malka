import { useEffect, useRef } from 'react';
import { Caja, Guirnalda, Humo, Persona, PersonaSentada, Planta, Sombra, Vela } from './piezas';
import { CASA, FONDO, PISOS, QUINCHO, SUELO, costado, escala, hondo, planoPiso, paredFondo } from './geometria';
import { quiereQuietud } from '../scrollFx';

/**
 * La casa, dibujada en corte axonométrico.
 *
 * Es el mapa de Malka y a la vez la navegación: cada piso es una sección de la
 * página, y el piso que estás leyendo queda encendido mientras el resto baja a
 * un tercio. Los demás no desaparecen —la casa entera tiene que seguir ahí,
 * porque el argumento es justamente que es una casa entera.
 *
 * Está dibujada y no fotografiada por dos razones. Una: las fotos de los
 * espacios vacíos no existen. La otra, la que manda: un dibujo puede moverse
 * sin mentir. El humo de la parrilla, el vapor del café y las velas de la mesa
 * son lo que hace que un plano se lea como una casa habitada, y eso en una
 * foto quieta no pasa.
 *
 * **La profundidad**, que es lo que la sacó de ser un alzado plano: cada piso
 * tiene pared de fondo, canto lateral y plano de piso, todo derivado de un
 * único vector (`FONDO`). Cada cosa apoya con su sombra y las que están más
 * atrás van un poco más chicas. No hay perspectiva de un punto a propósito: en
 * axonométrica las paralelas siguen paralelas y el dibujo se sostiene como
 * dibujo, mientras que una perspectiva empieza a pedir realismo.
 *
 * **La cámara** es el otro cambio: al pasar de piso no se enciende y apaga
 * nada de golpe, la vista se acerca. El encuadre se interpola frame a frame
 * hacia el piso activo con un amortiguado simple —cada frame recorre el 8% de
 * lo que falta—, que es lo que hace que se sienta una cámara y no un salto.
 */

/* Dónde mira la cámara en cada piso, y cuánto se acerca. El centro se corre
   hacia adentro (un tercio del fondo) porque el volumen del piso no está sobre
   el borde del corte sino un poco más atrás. */
const centro = (id) => {
  const p = PISOS[id];
  return {
    x: (CASA.x1 + CASA.x2) / 2 + FONDO.x * 0.35 + (id === 'salon' ? 34 : 0),
    y: (p.techo + p.piso) / 2 + FONDO.y * 0.35,
    s: 1.45,
  };
};

const FOCOS = {
  todo: { x: 232, y: 318, s: 1 },
  terraza: centro('terraza'),
  estudio: centro('estudio'),
  cowork: centro('cowork'),
  salon: centro('salon'),
};

const VISTA = { ancho: 460, alto: 620 };

/**
 * El encuadre, atado a los bordes del dibujo.
 *
 * Sin esto, acercarse al salón —que está abajo de todo— dejaba media pantalla
 * de crema vacío debajo de la casa: la cámara apuntaba a un punto que no tiene
 * dibujo alrededor. Se limita el centro para que la ventana visible nunca se
 * salga de la lámina, que es lo que hace cualquier visor de mapas.
 */
const encuadrar = ({ x, y, s }) => {
  const ancho = VISTA.ancho / s;
  const alto = VISTA.alto / s;
  const limitar = (v, medio, total) => Math.min(Math.max(v, medio / 2), total - medio / 2);
  return { s, x: limitar(x, ancho, VISTA.ancho), y: limitar(y, alto, VISTA.alto) };
};

const CasaDibujada = ({ activo = 'todo', className = '' }) => {
  const camaraRef = useRef(null);
  const poseRef = useRef({ ...FOCOS.todo });

  /* El quincho es planta baja: mirar el salón es mirar los dos. */
  const foco = activo === 'quincho' ? 'salon' : activo;

  useEffect(() => {
    const g = camaraRef.current;
    if (!g) return undefined;

    const destino = encuadrar(FOCOS[foco] ?? FOCOS.todo);
    const aplicar = ({ x, y, s }) => {
      g.setAttribute(
        'transform',
        `translate(${VISTA.ancho / 2 - s * x} ${VISTA.alto / 2 - s * y}) scale(${s})`
      );
    };

    /* Quien pidió menos movimiento no recibe un viaje de cámara: se le pone el
       encuadre nuevo y listo. */
    if (quiereQuietud()) {
      poseRef.current = { ...destino };
      aplicar(destino);
      return undefined;
    }

    let id;
    const paso = () => {
      const p = poseRef.current;
      p.x += (destino.x - p.x) * 0.08;
      p.y += (destino.y - p.y) * 0.08;
      p.s += (destino.s - p.s) * 0.08;
      aplicar(p);

      const falta =
        Math.abs(destino.x - p.x) + Math.abs(destino.y - p.y) + Math.abs(destino.s - p.s) * 100;
      /* Se corta cuando ya no se distingue: seguir interpolando medio píxel es
         tener un requestAnimationFrame vivo para siempre sin que se note. */
      if (falta > 0.4) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [foco]);

  const luz = (id) =>
    activo === 'todo' || activo === id || (id === 'quincho' && activo === 'salon')
      ? 'opacity-100'
      : 'opacity-25';

  const grupo = (id) => `transition-opacity duration-cinematic ease-standard ${luz(id)}`;

  /** El volumen vacío de un piso: fondo, canto y piso, en ese orden. */
  const Volumen = ({ techo, piso, x1 = CASA.x1, x2 = CASA.x2 }) => (
    <g>
      <path d={paredFondo(techo, piso, x1, x2)} className="fill-casa-fondo" />
      {/* Oscurecimiento en el encuentro de la pared con el techo. Es el truco
          más barato que hay para que un plano se lea cóncavo. */}
      <path d={paredFondo(techo, techo + 46, x1, x2)} fill="url(#casa-rincon)" />
      <path d={costado(techo, piso, x2)} className="fill-casa-costado" />
      <path d={planoPiso(piso, x1, x2)} className="fill-casa-piso stroke-ink/15" strokeWidth="1" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${VISTA.ancho} ${VISTA.alto}`}
      className={className}
      role="img"
      aria-label="Corte de la casa de Malka: la terraza y la huerta arriba, el estudio, el cowork, el salón con la mesa larga y el quincho con la parrilla."
    >
      <defs>
        <linearGradient id="casa-rincon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c3d34" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#2c3d34" stopOpacity="0" />
        </linearGradient>
        {/* La luz que cae de la lámpara y de las brasas: cálida, corta y sin
            paradas claras en el medio, que sobre un piso claro se leen sucias. */}
        <radialGradient id="casa-luz">
          <stop offset="0%" stopColor="#f0a63a" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#f0a63a" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#f0a63a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g ref={camaraRef}>
        {/* ---- la vereda ---- */}
        <path
          d={`M 10 ${SUELO} L ${QUINCHO.x2 + FONDO.x + 16} ${SUELO}`}
          className="stroke-ink/70"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* ---- estudio ---- */}
        <g className={grupo('estudio')}>
          <Volumen {...PISOS.estudio} />
          <g transform={`translate(${FONDO.x * 0.78} ${FONDO.y * 0.78}) scale(${escala(0.78)})`}>
            <rect x={196} y={176} width={68} height={46} rx="3" className="fill-primary-100 stroke-primary-600" strokeWidth="2" />
            <path d="M 204 192 L 254 192 M 204 202 L 238 202" className="stroke-primary-600" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Las colchonetas, apoyadas en el piso y por lo tanto en fuga. No
              llevan escala propia: ya vienen achicadas por estar más al fondo,
              y encima de eso un `scale` las mandaba a otro lado del dibujo. */}
          {[
            { x: 116, w: 54, t: 0.62 },
            { x: 182, w: 54, t: 0.52 },
          ].map((m) => {
            const p = hondo(m.x, PISOS.estudio.piso - 4, m.t);
            return (
              <path
                key={m.x}
                d={planoPiso(p.y, p.x, p.x + m.w * escala(m.t))}
                className="fill-barro-claro"
              />
            );
          })}
          <PersonaSentada {...hondo(122, PISOS.estudio.piso - 2, 0.12)} alto={58} delay={0} />
          <PersonaSentada {...hondo(186, PISOS.estudio.piso - 2, 0.06)} alto={56} color="fill-primary-700" delay={900} />
          <Planta {...hondo(258, PISOS.estudio.piso - 2, 0.14)} alto={34} delay={400} />
        </g>

        {/* ---- cowork ---- */}
        <g className={grupo('cowork')}>
          <Volumen {...PISOS.cowork} />
          {/* Estante contra la pared del fondo */}
          <g transform={`translate(${FONDO.x * 0.85} ${FONDO.y * 0.85}) scale(${escala(0.85)})`}>
            <rect x={96} y={344} width={74} height="5" className="fill-barro-oscuro" />
            {[0, 11, 22, 33, 45, 56].map((d, i) => (
              <rect
                key={d}
                x={100 + d}
                y={344 - (i % 2 === 0 ? 22 : 18)}
                width="8"
                height={i % 2 === 0 ? 22 : 18}
                className={i % 3 === 0 ? 'fill-primary' : i % 3 === 1 ? 'fill-flame' : 'fill-ink/60'}
              />
            ))}
          </g>

          {/* Dos escritorios, uno más al fondo que el otro */}
          {[
            { x: 112, t: 0.62 },
            { x: 198, t: 0.44 },
          ].map((d) => {
            const p = hondo(d.x, 370, d.t);
            const e = escala(d.t);
            return (
              <g key={d.x}>
                <Sombra x={p.x + 40 * e} y={hondo(d.x, PISOS.cowork.piso, d.t).y} ancho={70 * e} opacidad={0.35} />
                <Caja x={p.x} y={p.y} ancho={78 * e} alto={5} prof={0.26} />
                <rect x={p.x + 4} y={p.y + 5} width="4" height={hondo(0, PISOS.cowork.piso, d.t).y - p.y - 5} className="fill-barro-oscuro" />
                <rect x={p.x + 68 * e} y={p.y + 5} width="4" height={hondo(0, PISOS.cowork.piso, d.t).y - p.y - 5} className="fill-barro-oscuro" />
                {/* La laptop, con la pantalla apenas encendida */}
                <path d={`M ${p.x + 22} ${p.y} L ${p.x + 28} ${p.y - 18} L ${p.x + 52} ${p.y - 18} L ${p.x + 50} ${p.y} Z`} className="fill-ink" />
                <path d={`M ${p.x + 31} ${p.y - 15} L ${p.x + 49} ${p.y - 15} L ${p.x + 47.5} ${p.y - 3} L ${p.x + 33} ${p.y - 3} Z`} className="fill-primary-300/70" />
              </g>
            );
          })}

          <Persona {...hondo(126, PISOS.cowork.piso - 2, 0.08)} alto={78} delay={300} />
          <Persona {...hondo(236, PISOS.cowork.piso - 2, 0.04)} alto={74} color="fill-primary-700" mirando={-1} delay={1500} />

          {/* El café con cakes que ellos mismos prometen */}
          <rect x={262} y={352} width="9" height="8" rx="1.5" className="fill-surface stroke-ink" strokeWidth="1.5" />
          <Humo x={266} y={344} escala={0.7} />
        </g>

        {/* ---- salón ---- */}
        <g className={grupo('salon')}>
          <Volumen {...PISOS.salon} />

          {/* La lámpara y su charco de luz sobre la mesa */}
          <path d={`M 196 ${PISOS.salon.techo} L 196 470`} className="stroke-ink/50" strokeWidth="1.5" />
          <path d="M 180 488 L 212 488 L 204 470 L 188 470 Z" className="fill-ink" />
          <ellipse cx={196} cy={520} rx={78} ry={40} fill="url(#casa-luz)" className="animate-latir motion-reduce:animate-none" />

          {/* La puerta: un hueco en la pared, sin hoja. La casa está abierta y
              dibujar una hoja cerrada diría lo contrario. */}
          <path
            d={`M ${CASA.x1} ${SUELO} L ${CASA.x1} 486 L ${CASA.x1 + FONDO.x * 0.5} ${486 + FONDO.y * 0.5} L ${CASA.x1 + FONDO.x * 0.5} ${SUELO + FONDO.y * 0.5} Z`}
            className="fill-casa-costado"
          />
          <rect x={CASA.x1 - 24} y={SUELO - 4} width={24} height="4" className="fill-barro" />
          <Persona x={42} y={SUELO} alto={70} color="fill-primary-700" delay={600} />

          {/* La mesa larga */}
          {(() => {
            const p = hondo(104, 508, 0.46);
            const e = escala(0.46);
            return (
              <g>
                <Sombra x={p.x + 78 * e} y={hondo(0, SUELO, 0.46).y} ancho={130 * e} opacidad={0.3} />
                <Caja x={p.x} y={p.y} ancho={168 * e} alto={6} prof={0.34} />
                <rect x={p.x + 8} y={p.y + 6} width="5" height={hondo(0, SUELO, 0.46).y - p.y - 6} className="fill-barro-oscuro" />
                <rect x={p.x + 150 * e} y={p.y + 6} width="5" height={hondo(0, SUELO, 0.46).y - p.y - 6} className="fill-barro-oscuro" />
                <Vela x={p.x + 68} y={p.y} alto={15} />
                <Vela x={p.x + 82} y={p.y} alto={15} delay={600} />
              </g>
            );
          })()}

          {/* Gente de los dos lados de la mesa: los del fondo más chicos y más
              arriba, que es lo que arma la vuelta alrededor de la mesa. */}
          {[
            { x: 128, t: 0.74, alto: 74, mirando: 1 },
            { x: 182, t: 0.74, alto: 72, mirando: 1 },
            { x: 232, t: 0.74, alto: 76, mirando: -1 },
            { x: 116, t: 0.04, alto: 82, mirando: -1 },
            { x: 196, t: 0.04, alto: 78, mirando: 1 },
          ].map((g, i) => {
            const p = hondo(g.x, SUELO, g.t);
            return (
              <Persona
                key={`${g.x}-${g.t}`}
                x={p.x}
                y={p.y}
                alto={g.alto * escala(g.t)}
                mirando={g.mirando}
                color={i % 2 ? 'fill-primary-700' : 'fill-ink'}
                delay={i * 520}
              />
            );
          })}
        </g>

        {/* ---- quincho ---- */}
        <g className={grupo('quincho')}>
          <Volumen techo={452} piso={SUELO} x1={QUINCHO.x1} x2={QUINCHO.x2} />
          {(() => {
            const p = hondo(308, 502, 0.52);
            const e = escala(0.52);
            return (
              <g>
                <Sombra x={p.x + 26 * e} y={hondo(0, SUELO, 0.52).y} ancho={52 * e} opacidad={0.32} />
                <Caja x={p.x} y={p.y} ancho={54 * e} alto={5} prof={0.3} claro="fill-ink/70" base="fill-ink" oscuro="fill-ink" />
                <ellipse cx={p.x + 26 * e} cy={p.y + 14} rx={40} ry={18} fill="url(#casa-luz)" className="animate-latir motion-reduce:animate-none" />
                {/* Brasas: el único fuego del dibujo además de las velas. */}
                {[0, 10, 20, 30, 40].map((d, i) => (
                  <rect
                    key={d}
                    x={p.x + 4 + d}
                    y={p.y + 8}
                    width="6"
                    height="4"
                    rx="1.5"
                    className={i % 2 ? 'fill-flame' : 'fill-flame-deep'}
                  />
                ))}
                <rect x={p.x + 2} y={p.y + 5} width="4" height={hondo(0, SUELO, 0.52).y - p.y - 5} className="fill-ink/70" />
                <rect x={p.x + 46 * e} y={p.y + 5} width="4" height={hondo(0, SUELO, 0.52).y - p.y - 5} className="fill-ink/70" />
                <Humo x={p.x + 14} y={p.y - 6} delay={200} />
                <Humo x={p.x + 34} y={p.y - 4} delay={1100} escala={0.8} />
              </g>
            );
          })()}
          <Persona {...hondo(352, SUELO - 2, 0.06)} alto={72} mirando={-1} delay={1200} />
        </g>

        {/* ---- terraza y huerta ---- */}
        <g className={grupo('terraza')}>
          <path d={planoPiso(PISOS.terraza.piso)} className="fill-casa-piso" />
          <Guirnalda x1={CASA.x1 + 10} x2={CASA.x2 + FONDO.x - 10} y={PISOS.terraza.techo - 4} />

          {/* La baranda, contra el borde del corte */}
          <g className="stroke-ink/45" strokeWidth="2" strokeLinecap="round">
            <path d={`M ${CASA.x1 + 6} 92 L ${CASA.x2 - 6} 92`} />
            {Array.from({ length: 11 }, (_, i) => CASA.x1 + 12 + i * 20).map((x) => (
              <path key={x} d={`M ${x} 92 L ${x} ${PISOS.terraza.piso - 4}`} />
            ))}
          </g>

          {/* La huerta, en cantero contra el fondo */}
          {(() => {
            const p = hondo(104, PISOS.terraza.piso - 4, 0.72);
            return (
              <g>
                <Caja x={p.x} y={p.y - 8} ancho={92} alto={8} prof={0.3} claro="fill-barro-claro" base="fill-barro" oscuro="fill-barro-oscuro" />
                {[
                  { dx: 10, alto: 28, delay: 0 },
                  { dx: 32, alto: 22, delay: 700 },
                  { dx: 54, alto: 30, delay: 1400 },
                  { dx: 76, alto: 24, delay: 2100 },
                ].map((pl) => (
                  <Planta key={pl.dx} x={p.x + pl.dx} y={p.y - 8} alto={pl.alto} delay={pl.delay} maceta={false} />
                ))}
              </g>
            );
          })()}

          {/* Y el rato de estar sentado mirando la ciudad */}
          <PersonaSentada {...hondo(228, PISOS.terraza.piso - 2, 0.1)} alto={44} delay={200} />
          <PersonaSentada {...hondo(262, PISOS.terraza.piso - 2, 0.1)} alto={46} color="fill-primary-700" delay={1300} />
        </g>

        {/* ---- las líneas del corte, siempre encima ---- */}
        <g className="fill-none stroke-ink" strokeWidth="2" strokeLinejoin="round">
          <path d={`M ${CASA.x1} ${SUELO} L ${CASA.x1} ${PISOS.terraza.piso}`} />
          <path d={`M ${CASA.x2} ${SUELO} L ${CASA.x2} ${PISOS.terraza.piso}`} />
          {Object.values(PISOS).map((p) => (
            <path key={p.piso} d={`M ${CASA.x1} ${p.piso} L ${CASA.x2} ${p.piso}`} />
          ))}
          <path d={`M ${CASA.x1} ${PISOS.terraza.piso} L ${CASA.x1 + FONDO.x} ${PISOS.terraza.piso + FONDO.y} L ${CASA.x2 + FONDO.x} ${PISOS.terraza.piso + FONDO.y} L ${CASA.x2} ${PISOS.terraza.piso}`} />
          <path d={`M ${QUINCHO.x1} ${SUELO} L ${QUINCHO.x1} 452 L ${QUINCHO.x2} 452 L ${QUINCHO.x2} ${SUELO}`} />
        </g>
      </g>
    </svg>
  );
};

export default CasaDibujada;
