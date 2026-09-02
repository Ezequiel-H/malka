import { useEffect, useRef } from 'react';
import { Guirnalda, Humo, Persona, PersonaSentada, PersonaSilla, Planta, Vela } from './piezas';
import {
  Alfombra,
  Auto,
  Arco,
  Botella,
  Caja,
  Cajon,
  Candelabro,
  Copa,
  Cuerdas,
  Estante,
  Jalot,
  Laptop,
  Mesa,
  Microfono,
  Parrilla,
  Pizarra,
  Plato,
  Platillo,
  Porton,
  Rollo,
  Silla,
  Sillon,
  Taza,
  Teclado,
} from './muebles';
import { CASA, FONDO, PISOS, QUINCHO, SUELO, TRAZO, costado, planoPiso, paredFondo } from './geometria';
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
    x: (CASA.x1 + CASA.x2) / 2 + FONDO.x * 0.35 + (id === 'planta' ? 16 : 0),
    y: (p.techo + p.piso) / 2 + FONDO.y * 0.35,
    s: 1.45,
  };
};

const FOCOS = {
  todo: { x: 236, y: 268, s: 1 },
  terraza: centro('terraza'),
  primero: centro('primero'),
  planta: centro('planta'),
  subsuelo: centro('subsuelo'),
};

/* La lámina tiene cielo de más arriba de la terraza. No es decorativo: sin ese
   aire, la cámara no puede centrarse en el último piso sin salirse del dibujo,
   y el encuadre queda siempre corrido hacia abajo. */
const VISTA = { x: 0, y: -110, ancho: 480, alto: 760 };

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
  const limitar = (v, ventana, desde, total) =>
    Math.min(Math.max(v, desde + ventana / 2), desde + total - ventana / 2);
  return {
    s,
    x: limitar(x, ancho, VISTA.x, VISTA.ancho),
    y: limitar(y, alto, VISTA.y, VISTA.alto),
  };
};

/**
 * Llevar un grupo entero a una profundidad. Todo lo que va adentro se dibuja en
 * coordenadas del frente y este transform lo manda al fondo: corrido, subido y
 * un poco más chico. Es lo que evita tener que recalcular a mano cada mueble.
 */
const CENTRO = { x: (CASA.x1 + CASA.x2) / 2, y: 300 };

const fuga = (t) => {
  /* El achique de lo lejano se hace alrededor del centro del dibujo y no del
     origen del SVG. Escalar desde el origen arrastra todo hacia arriba y a la
     izquierda, y entonces un mueble al fondo y una persona al fondo terminan en
     lugares distintos aunque estén a la misma profundidad. */
  const s = 1 - 0.12 * t;
  return `translate(${FONDO.x * t} ${FONDO.y * t}) translate(${CENTRO.x} ${CENTRO.y}) scale(${s}) translate(${-CENTRO.x} ${-CENTRO.y})`;
};

const CasaDibujada = ({ activo = 'todo', className = '' }) => {
  const camaraRef = useRef(null);
  const poseRef = useRef({ ...FOCOS.todo });

  /* El quincho es planta baja: mirar el salón es mirar los dos. */
  const foco = activo === 'quincho' ? 'planta' : activo;

  useEffect(() => {
    const g = camaraRef.current;
    if (!g) return undefined;

    const destino = encuadrar(FOCOS[foco] ?? FOCOS.todo);
    const aplicar = ({ x, y, s }) => {
      g.setAttribute(
        'transform',
        `translate(${VISTA.x + VISTA.ancho / 2 - s * x} ${VISTA.y + VISTA.alto / 2 - s * y}) scale(${s})`
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

  /* Atajos: la altura de piso de cada nivel. Todo el interior se cuelga de
     estos tres números, así que mover un piso no obliga a tocar cada mueble. */
  const P1 = PISOS.primero.piso;
  const P0 = PISOS.planta.piso;
  const SS = PISOS.subsuelo.piso;

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
      viewBox={`${VISTA.x} ${VISTA.y} ${VISTA.ancho} ${VISTA.alto}`}
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
        {/* La tierra en la que está enterrado el subsuelo. Sin este tono
            alrededor, el nivel de abajo se lee como un piso más de un edificio
            flotando, y no como lo que es. */}
        <path
          d={`M 0 ${SUELO} L ${VISTA.ancho} ${SUELO} L ${VISTA.ancho} ${PISOS.subsuelo.piso + 26} L 0 ${PISOS.subsuelo.piso + 26} Z`}
          className="fill-casa-sombra/25"
        />

        {/* ---- la vereda ---- */}
        <path
          d={`M 8 ${SUELO} L ${QUINCHO.x2 + FONDO.x + 14} ${SUELO}`}
          className="stroke-ink/70"
          strokeWidth={TRAZO * 1.2}
          strokeLinecap="round"
        />

        {/* ================= PRIMER PISO: cowork y charlas ================ */}
        <g className={grupo('primero')}>
          <Volumen {...PISOS.primero} />

          <g transform={fuga(0.85)}>
            <Estante x={146} y={P1 - 92} ancho={86} />
            <Pizarra x={240} y={P1 - 130} ancho={64} alto={42} />
          </g>

          {/* El sillón del cowork, que en la casa real existe y es donde la
              gente termina sentada */}
          <g transform={fuga(0.66)}>
            <Sillon x={68} y={P1} ancho={64} />
            <PersonaSilla x={98} y={P1} alto={58} color="fill-primary-700" pelo delay={900} />
          </g>

          {/* Dos escritorios con sus sillas */}
          <g transform={fuga(0.55)}>
            <Mesa x={150} y={P1 - 48} ancho={78} piso={P1} />
            <Laptop x={168} y={P1 - 48} />
            <Taza x={210} y={P1 - 48} />
            <Humo x={215} y={P1 - 60} escala={0.6} />
          </g>
          <g transform={fuga(0.2)}>
            <Silla x={182} y={P1} alto={42} />
            <PersonaSilla x={182} y={P1} alto={64} kipa delay={300} />
          </g>

          <g transform={fuga(0.34)}>
            <Mesa x={242} y={P1 - 48} ancho={78} piso={P1} />
            <Laptop x={260} y={P1 - 48} />
          </g>
          <g transform={fuga(0.04)}>
            <Silla x={274} y={P1} alto={42} />
            <PersonaSilla x={274} y={P1} alto={62} color="fill-primary-700" pelo delay={1600} />
          </g>

          <g transform={fuga(0.12)}>
            <Planta x={302} y={P1 - 2} alto={34} delay={1100} />
          </g>
        </g>

        {/* ================= PLANTA BAJA: el salón y la mesa de Shabat ===== */}
        <g className={grupo('planta')}>
          <Volumen {...PISOS.planta} />

          {/* La lámpara y su charco de luz */}
          <path d={`M 196 ${PISOS.planta.techo} L 196 ${P0 - 92}`} className="stroke-ink/50" strokeWidth={TRAZO} />
          <path d={`M 180 ${P0 - 74} L 212 ${P0 - 74} L 204 ${P0 - 92} L 188 ${P0 - 92} Z`} className="fill-ink" />
          <ellipse cx={200} cy={P0 - 32} rx={96} ry={44} fill="url(#casa-luz)" className="animate-latir motion-reduce:animate-none" />

          {/* La puerta: un hueco en la pared, sin hoja. La casa está abierta y
              dibujar una hoja cerrada diría lo contrario. */}
          <path
            d={`M ${CASA.x1} ${P0} L ${CASA.x1} ${P0 - 74} L ${CASA.x1 + FONDO.x * 0.5} ${P0 - 74 + FONDO.y * 0.5} L ${CASA.x1 + FONDO.x * 0.5} ${P0 + FONDO.y * 0.5} Z`}
            className="fill-casa-costado"
          />
          <rect x={CASA.x1 - 24} y={P0 - 4} width={24} height="4" className="fill-barro" />
          <Persona x={38} y={P0} alto={66} color="fill-primary-700" pelo delay={600} />

          <Alfombra x={96} y={P0 - 3} ancho={186} prof={0.6} color="fill-barro-claro/60" />

          {/* La mesa puesta: velas, kidush, vino y las dos jalot bajo el paño */}
          <g transform={fuga(0.5)}>
            <Mesa x={94} y={P0 - 50} ancho={182} piso={P0} prof={0.36} />
            <Candelabro x={140} y={P0 - 50} />
            <Candelabro x={158} y={P0 - 50} />
            <Jalot x={200} y={P0 - 50} />
            <Copa x={228} y={P0 - 50} />
            <Botella x={244} y={P0 - 50} />
            <Plato x={116} y={P0 - 52} />
            <Plato x={178} y={P0 - 52} />
            <Plato x={262} y={P0 - 52} />
            <Vela x={140} y={P0 - 62} alto={14} />
            <Vela x={158} y={P0 - 62} alto={14} delay={700} />
          </g>

          {/* Sentados de los dos lados, y alguien de pie sirviendo */}
          <g transform={fuga(0.74)}>
            <Silla x={128} y={P0} alto={44} mirando={-1} />
            <Silla x={182} y={P0} alto={44} mirando={-1} />
            <Silla x={236} y={P0} alto={44} mirando={-1} />
            <PersonaSilla x={128} y={P0} alto={74} mirando={-1} kipa delay={0} />
            <PersonaSilla x={182} y={P0} alto={72} mirando={-1} color="fill-primary-700" pelo delay={900} />
            <PersonaSilla x={236} y={P0} alto={76} mirando={-1} kipa delay={1800} />
          </g>
          <g transform={fuga(0.06)}>
            <Silla x={146} y={P0} alto={44} />
            <Silla x={214} y={P0} alto={44} />
            <PersonaSilla x={146} y={P0} alto={78} pelo delay={500} />
            <PersonaSilla x={214} y={P0} alto={76} color="fill-primary-700" kipa delay={2200} />
            <Persona x={280} y={P0} alto={82} mirando={-1} pelo delay={1300} />
          </g>
        </g>

        {/* ================= QUINCHO ====================================== */}
        <g className={grupo('quincho')}>
          <Volumen techo={QUINCHO.techo} piso={P0} x1={QUINCHO.x1} x2={QUINCHO.x2} />
          <g transform={fuga(0.5)}>
            <Parrilla x={QUINCHO.x1 + 10} y={P0 - 46} piso={P0} ancho={58} />
            <Humo x={QUINCHO.x1 + 24} y={P0 - 60} delay={200} />
            <Humo x={QUINCHO.x1 + 44} y={P0 - 58} delay={1100} escala={0.8} />
          </g>
          <g transform={fuga(0.12)}>
            <Persona x={QUINCHO.x2 - 22} y={P0 - 2} alto={74} mirando={-1} kipa delay={1200} />
          </g>
        </g>

        {/* ================= SUBSUELO: yoga y cochera ===================== */}
        <g className={grupo('subsuelo')}>
          <Volumen {...PISOS.subsuelo} />

          {/* El portón y la rampa por donde bajan los autos */}
          <g transform={fuga(0.8)}>
            <Porton x={CASA.x1 + 8} y={SS} ancho={46} alto={56} />
          </g>
          <g transform={fuga(0.34)}>
            <Auto x={CASA.x1 + 14} y={SS} largo={74} />
          </g>

          {/* La clase: colchonetas apoyadas y gente sentada arriba */}
          {/* Cada colchoneta a la misma profundidad que quien está sentado
              arriba: si la colchoneta va más al fondo que la persona, se ve
              flotando a la altura de su cabeza. */}
          <g transform={fuga(0.34)}>
            <Alfombra x={182} y={SS - 2} ancho={38} prof={0.3} color="fill-primary-200" />
            <PersonaSentada x={200} y={SS - 2} alto={54} pelo delay={0} />
          </g>
          <g transform={fuga(0.22)}>
            <Alfombra x={228} y={SS - 2} ancho={38} prof={0.3} color="fill-primary-200" />
            <PersonaSentada x={246} y={SS - 2} alto={56} color="fill-primary-700" delay={900} />
          </g>
          <g transform={fuga(0.1)}>
            <Alfombra x={272} y={SS - 2} ancho={38} prof={0.3} color="fill-primary-200" />
            <PersonaSentada x={290} y={SS - 2} alto={52} pelo delay={1800} />
          </g>
          <g transform={fuga(0.5)}>
            <Persona x={306} y={SS} alto={62} mirando={-1} delay={1400} />
          </g>
          <g transform={fuga(0.78)}>
            <Rollo x={168} y={SS} alto={28} />
            <Rollo x={181} y={SS} alto={24} />
          </g>
        </g>

        {/* ================= TERRAZA: la huerta y el unplugged ============= */}
        <g className={grupo('terraza')}>
          <path d={planoPiso(PISOS.terraza.piso)} className="fill-casa-piso stroke-ink/15" strokeWidth="1" />
          <Guirnalda x1={CASA.x1 + 12} x2={CASA.x2 + FONDO.x - 12} y={44} caida={13} />

          {/* La huerta, en cantero contra el fondo */}
          <g transform={fuga(0.8)}>
            <Caja x={CASA.x1 + 4} y={PISOS.terraza.piso - 10} ancho={62} alto={10} prof={0.26} />
            {[9, 25, 41, 55].map((dx, i) => (
              <Planta
                key={dx}
                x={CASA.x1 + 4 + dx}
                y={PISOS.terraza.piso - 10}
                alto={24 + (i % 3) * 5}
                delay={i * 700}
                maceta={false}
              />
            ))}
          </g>

          {/* El unplugged: teclado y voz al fondo, cuerdas en el medio,
              percusión adelante. Es el orden real de una banda chica y, de
              paso, el que deja ver a todos. */}
          <g transform={fuga(0.74)}>
            <Teclado x={134} y={PISOS.terraza.piso} ancho={48} />
            <Persona x={158} y={PISOS.terraza.piso} alto={52} kipa delay={400} />
          </g>

          <g transform={fuga(0.52)}>
            <Microfono x={196} y={PISOS.terraza.piso} alto={46} />
            <Persona x={212} y={PISOS.terraza.piso} alto={54} pelo delay={1200} />
            <Cuerdas x={200} y={PISOS.terraza.piso - 28} tipo="violin" mirando={-1} />
            <Arco x={190} y={PISOS.terraza.piso - 31} largo={20} />
          </g>

          <g transform={fuga(0.3)}>
            <Microfono x={238} y={PISOS.terraza.piso} alto={44} mirando={-1} />
            <Persona x={254} y={PISOS.terraza.piso} alto={56} kipa delay={2000} />
            <Cuerdas x={264} y={PISOS.terraza.piso - 26} tipo="guitarra" />
            <Persona x={296} y={PISOS.terraza.piso} alto={54} color="fill-primary-700" delay={800} />
            <Cuerdas x={305} y={PISOS.terraza.piso - 25} tipo="bajo" />
          </g>

          <g transform={fuga(0.1)}>
            <Cajon x={162} y={PISOS.terraza.piso} />
            <PersonaSilla x={172} y={PISOS.terraza.piso} alto={52} color="fill-primary-700" pelo delay={1600} />
            <Platillo x={196} y={PISOS.terraza.piso} alto={34} />
          </g>

          {/* La baranda va al final: pasa por delante de todos y por eso el
              conjunto se lee arriba de una terraza y no flotando. */}
          <g className="stroke-ink/45" strokeWidth={TRAZO} strokeLinecap="round">
            <path d={`M ${CASA.x1 + 4} 98 L ${CASA.x2 - 4} 98`} />
            {Array.from({ length: 13 }, (_, i) => CASA.x1 + 10 + i * 20).map((x) => (
              <path key={x} d={`M ${x} 98 L ${x} ${PISOS.terraza.piso - 4}`} />
            ))}
          </g>
        </g>

        {/* ---- las líneas del corte, siempre encima ---- */}
        <g className="fill-none stroke-ink" strokeWidth={TRAZO * 1.25} strokeLinejoin="round">
          <path d={`M ${CASA.x1} ${PISOS.subsuelo.piso} L ${CASA.x1} ${PISOS.terraza.piso}`} />
          <path d={`M ${CASA.x2} ${PISOS.subsuelo.piso} L ${CASA.x2} ${PISOS.terraza.piso}`} />
          {Object.values(PISOS).map((p) => (
            <path key={p.piso} d={`M ${CASA.x1} ${p.piso} L ${CASA.x2} ${p.piso}`} />
          ))}
          <path
            d={`M ${CASA.x1} ${PISOS.terraza.piso} L ${CASA.x1 + FONDO.x} ${PISOS.terraza.piso + FONDO.y} L ${CASA.x2 + FONDO.x} ${PISOS.terraza.piso + FONDO.y} L ${CASA.x2} ${PISOS.terraza.piso}`}
          />
          <path d={`M ${QUINCHO.x1} ${SUELO} L ${QUINCHO.x1} ${QUINCHO.techo} L ${QUINCHO.x2} ${QUINCHO.techo} L ${QUINCHO.x2} ${SUELO}`} />
        </g>
      </g>
    </svg>
  );
};

export default CasaDibujada;
