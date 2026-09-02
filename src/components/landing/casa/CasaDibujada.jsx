import { useEffect, useRef } from 'react';
import { Guirnalda, Humo, Persona, PersonaSentada, PersonaSilla, Planta, Vela } from './piezas';
import {
  Alacena,
  Alfombra,
  Auto,
  Arco,
  Botella,
  Caja,
  Caracol,
  Cartel,
  Chispas,
  Cajon,
  Candelabro,
  Copa,
  Cuerdas,
  Estante,
  Jalot,
  Laptop,
  Mesa,
  Mesada,
  Campana,
  Espejo,
  Microfono,
  Notas,
  Parrilla,
  Pizarra,
  Plato,
  Platillo,
  Parlante,
  Porton,
  RinconCafe,
  Silla,
  Sillon,
  Tanque,
  Taza,
  Teclado,
} from './muebles';
import { CASA, FONDO, PISOS, SERVICIO, SUELO, TRAZO, costado, planoPiso, paredFondo } from './geometria';
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
 * nada de golpe, la vista viaja. El encuadre se interpola con una duración
 * propia y una curva suave en las dos puntas, y —lo que de verdad hace la
 * diferencia— **se abre mientras viaja y se cierra al llegar**, que es lo que
 * hace un camarógrafo cuando cambia de encuadre: abre para no perder el
 * contexto en el camino. Sin eso hay un desplazamiento; con eso hay un viaje,
 * y de paso se entiende que los pisos son parte de la misma casa.
 */

/* Dónde mira la cámara en cada piso, y cuánto se acerca. El centro se corre
   hacia adentro (un tercio del fondo) porque el volumen del piso no está sobre
   el borde del corte sino un poco más atrás. */
const centro = (id) => {
  const p = PISOS[id];
  return {
    x: (CASA.x1 + CASA.x2) / 2 + FONDO.x * 0.35,
    y: (p.techo + p.piso) / 2 + FONDO.y * 0.35,
    /* La planta baja se mira más de lejos que el resto: es la escena más ancha
       de la casa —la vereda por donde llega alguien de un lado, el quincho del
       otro— y con el zoom de los demás pisos se recortaba justo la puerta. */
    s: id === 'planta' ? 1.16 : 1.45,
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
const VISTA = { x: -62, y: -110, ancho: 544, alto: 760 };

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

/* La caracol va contra la pared derecha: es donde no le roba lugar a ninguna
   escena y donde estaría en una casa angosta de verdad. */
const ESCALERA = { x: 276 };

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
  const foco = activo;

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

    const desde = { ...poseRef.current };
    const salto = Math.hypot(destino.x - desde.x, destino.y - desde.y);
    if (salto < 0.5 && Math.abs(destino.s - desde.s) < 0.01) return undefined;

    /* Viajes largos tardan más, pero no proporcionalmente: si la duración
       creciera con la distancia, ir del subsuelo a la terraza se sentiría
       eterno. */
    const duracion = Math.min(1500, 620 + salto * 1.1);

    /* La cámara se aleja mientras viaja y vuelve a acercarse al llegar. Es lo
       que hace un camarógrafo cuando tiene que cambiar de encuadre: abre para
       no perder el contexto en el camino. Sin esto el movimiento es un
       desplazamiento; con esto es un viaje, y además se entiende que los pisos
       son parte de la misma casa. */
    const apertura = Math.min(0.3, salto / 900);

    let id;
    const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const arranque = performance.now();

    const paso = (ahora) => {
      const t = Math.min(1, (ahora - arranque) / duracion);
      const e = suave(t);
      const pose = {
        x: desde.x + (destino.x - desde.x) * e,
        y: desde.y + (destino.y - desde.y) * e,
        s: (desde.s + (destino.s - desde.s) * e) * (1 - apertura * Math.sin(Math.PI * e)),
      };
      poseRef.current = pose;
      aplicar(pose);
      if (t < 1) id = requestAnimationFrame(paso);
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
          d={`M ${VISTA.x} ${SUELO} L ${VISTA.x + VISTA.ancho} ${SUELO} L ${VISTA.x + VISTA.ancho} ${PISOS.subsuelo.piso + 26} L ${VISTA.x} ${PISOS.subsuelo.piso + 26} Z`}
          className="fill-casa-sombra/25"
        />

        {/* ---- la vereda ---- */}
        <path
          d={`M ${VISTA.x + 8} ${SUELO} L ${CASA.x2 + FONDO.x + 14} ${SUELO}`}
          className="stroke-ink/70"
          strokeWidth={TRAZO * 1.2}
          strokeLinecap="round"
        />

        {/* ================= PRIMER PISO: cowork y charlas ================ */}
        <g className={grupo('primero')}>
          <Volumen {...PISOS.primero} />

          <g transform={fuga(0.86)}>
            <Pizarra x={168} y={P1 - 126} ancho={74} alto={46} />
            <Estante x={70} y={P1 - 96} ancho={86} />
          </g>

          {/* El sillón, que en la casa real existe y es donde la gente termina
              sentada */}
          <g transform={fuga(0.68)}>
            <Sillon x={66} y={P1} ancho={68} />
            <PersonaSilla x={100} y={P1} alto={58} color="fill-primary-700" pelo delay={900} brazo="estirar" brazoDelay={2400} />
          </g>

          {/* La mesa larga compartida: cuatro puestos, dos de cada lado. Un
              cowork son personas de los dos lados de una misma mesa, no
              escritorios sueltos. */}
          <g transform={fuga(0.56)}>
            <Mesa x={150} y={P1 - 48} ancho={110} piso={P1} prof={0.34} />
            <Laptop x={168} y={P1 - 48} />
            <Laptop x={222} y={P1 - 48} mirando={-1} />
            <Taza x={198} y={P1 - 48} />
            <Humo x={203} y={P1 - 60} escala={0.6} />
          </g>
          <g transform={fuga(0.76)}>
            <Silla x={172} y={P1} alto={42} mirando={-1} />
            <Silla x={226} y={P1} alto={42} mirando={-1} />
            <PersonaSilla x={172} y={P1} alto={62} mirando={-1} kipa delay={700} brazo="teclear" brazoDelay={220} />
            <PersonaSilla x={226} y={P1} alto={60} mirando={-1} color="fill-primary-700" pelo delay={2100} />
          </g>
          <g transform={fuga(0.16)}>
            <Silla x={186} y={P1} alto={42} />
            <Silla x={238} y={P1} alto={42} />
            <PersonaSilla x={186} y={P1} alto={66} kipa delay={300} brazo="tomar" brazoDelay={900} />
            <PersonaSilla x={238} y={P1} alto={64} color="fill-primary-700" pelo delay={1600} brazo="teclear" brazoDelay={480} />
          </g>

          {/* El rincón de café, en la franja de servicio */}
          <g transform={fuga(0.72)}>
            <RinconCafe x={SERVICIO.x1 + 34} y={P1} />
            <Estante x={SERVICIO.x1 + 30} y={P1 - 84} ancho={62} />
          </g>
          <g transform={fuga(0.2)}>
            <Persona x={SERVICIO.x1 + 22} y={P1} alto={68} mirando={-1} pelo delay={1900} brazo="tomar" brazoDelay={4200} />
            <Planta x={SERVICIO.x2 - 8} y={P1 - 2} alto={34} delay={1100} />
          </g>
        </g>

        {/* ================= PLANTA BAJA: salón, cocina y parrilla ========= */}
        <g className={grupo('planta')}>
          <Volumen {...PISOS.planta} />

          {/* La lámpara y su charco de luz sobre la mesa */}
          <path d={`M 176 ${PISOS.planta.techo} L 176 ${P0 - 92}`} className="stroke-ink/50" strokeWidth={TRAZO} />
          <path d={`M 160 ${P0 - 74} L 192 ${P0 - 74} L 184 ${P0 - 92} L 168 ${P0 - 92} Z`} className="fill-ink" />
          <ellipse cx={180} cy={P0 - 32} rx={96} ry={44} fill="url(#casa-luz)" className="animate-latir motion-reduce:animate-none" />

          {/* La puerta: un hueco en la pared, sin hoja. La casa está abierta y
              dibujar una hoja cerrada diría lo contrario. */}
          <path
            d={`M ${CASA.x1} ${P0} L ${CASA.x1} ${P0 - 74} L ${CASA.x1 + FONDO.x * 0.5} ${P0 - 74 + FONDO.y * 0.5} L ${CASA.x1 + FONDO.x * 0.5} ${P0 + FONDO.y * 0.5} Z`}
            className="fill-casa-costado"
          />
          <rect x={CASA.x1 - 24} y={P0 - 4} width={24} height="4" className="fill-barro" />
          <Cartel x={CASA.x1 + 8} y={P0 - 68} />

          <g className="animate-caminar motion-reduce:animate-none">
            <g
              className="animate-andar motion-reduce:animate-none"
              style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            >
              <Persona x={38} y={P0} alto={66} color="fill-primary-700" pelo delay={600} />
            </g>
          </g>

          <Alfombra x={84} y={P0 - 3} ancho={170} prof={0.6} color="fill-barro-claro/60" />

          {/* La mesa puesta: velas, kidush, vino, las dos jalot bajo el paño */}
          <g transform={fuga(0.5)}>
            <Mesa x={80} y={P0 - 50} ancho={158} piso={P0} prof={0.36} />
            <Candelabro x={126} y={P0 - 50} />
            <Candelabro x={144} y={P0 - 50} />
            <Jalot x={184} y={P0 - 50} />
            <Copa x={202} y={P0 - 50} />
            <Botella x={216} y={P0 - 50} />
            <Plato x={104} y={P0 - 52} />
            <Plato x={164} y={P0 - 52} />
            <Plato x={228} y={P0 - 52} />
            <Humo x={104} y={P0 - 58} escala={0.5} delay={400} />
            <Humo x={228} y={P0 - 58} escala={0.5} delay={2600} />
            <Vela x={126} y={P0 - 62} alto={14} />
            <Vela x={144} y={P0 - 62} alto={14} delay={700} />
          </g>

          <g transform={fuga(0.74)}>
            <Silla x={116} y={P0} alto={44} mirando={-1} />
            <Silla x={170} y={P0} alto={44} mirando={-1} />
            <Silla x={212} y={P0} alto={44} mirando={-1} />
            <PersonaSilla x={116} y={P0} alto={74} mirando={-1} kipa delay={0} />
            <PersonaSilla x={170} y={P0} alto={72} mirando={-1} color="fill-primary-700" pelo delay={900} ritmo />
            <PersonaSilla x={212} y={P0} alto={76} mirando={-1} kipa delay={1800} brazo="brindar" brazoDelay={3200} />
          </g>
          <g transform={fuga(0.06)}>
            <Silla x={134} y={P0} alto={44} />
            <Silla x={192} y={P0} alto={44} />
            <PersonaSilla x={134} y={P0} alto={78} pelo delay={500} brazo="brindar" />
            <PersonaSilla x={192} y={P0} alto={76} color="fill-primary-700" kipa delay={2200} ritmo />
          </g>

          {/* La cocina y la parrilla, en la franja de servicio. Un tabique bajo
              las separa del salón: en la casa son dos ambientes, no uno. */}
          <path
            d={`M ${SERVICIO.x1 - 12} ${P0} L ${SERVICIO.x1 - 12} ${P0 - 58}`}
            className="stroke-ink/25"
            strokeWidth={TRAZO * 1.5}
          />
          <g transform={fuga(0.8)}>
            <Campana x={SERVICIO.x1 + 16} y={P0 - 78} ancho={40} />
            <Alacena x={SERVICIO.x1 + 62} y={P0 - 96} ancho={48} />
            <Mesada x={SERVICIO.x1 + 8} y={P0} ancho={100} />
          </g>
          <g transform={fuga(0.46)}>
            <Parrilla x={SERVICIO.x1 + 46} y={P0 - 46} piso={P0} ancho={54} />
            <Humo x={SERVICIO.x1 + 60} y={P0 - 60} delay={200} />
            <Humo x={SERVICIO.x1 + 80} y={P0 - 58} delay={1100} escala={0.8} />
            <Chispas x={SERVICIO.x1 + 70} y={P0 - 50} />
          </g>
          <g transform={fuga(0.2)}>
            <Persona x={SERVICIO.x1 + 26} y={P0 - 2} alto={74} kipa delay={1200} brazo="voltear" brazoDelay={600} />
            <Persona x={SERVICIO.x2 - 14} y={P0 - 2} alto={70} mirando={-1} pelo delay={2400} brazo="servir" brazoDelay={2600} />
          </g>
        </g>

        {/* ================= SUBSUELO: cochera y sala de movimiento ======== */}
        <g className={grupo('subsuelo')}>
          <Volumen {...PISOS.subsuelo} />

          {/* La cochera, a la izquierda */}
          <g transform={fuga(0.82)}>
            <Porton x={CASA.x1 + 10} y={SS} ancho={52} alto={62} />
          </g>
          <g transform={fuga(0.34)}>
            <Auto x={CASA.x1 + 20} y={SS} largo={86} />
          </g>

          {/* La sala: espejo al fondo, parlante y la clase en fila */}
          <g transform={fuga(0.86)}>
            <Espejo x={230} y={SS - 88} ancho={162} alto={58} />
          </g>
          <g transform={fuga(0.66)}>
            <Parlante x={214} y={SS} alto={46} />
          </g>

          {[
            { x: 246, t: 0.44, alto: 54, pelo: true },
            { x: 290, t: 0.32, alto: 56, pelo: false },
            { x: 334, t: 0.2, alto: 52, pelo: true },
            { x: 378, t: 0.08, alto: 55, pelo: false },
          ].map((y) => (
            <g key={y.x} transform={fuga(y.t)}>
              <Alfombra x={y.x - 18} y={SS - 2} ancho={38} prof={0.3} color="fill-primary-200" />
              <PersonaSentada
                x={y.x}
                y={SS - 2}
                alto={y.alto}
                pelo={y.pelo}
                color={y.pelo ? 'fill-ink' : 'fill-primary-700'}
                delay={0}
                brazo="estirar"
              />
            </g>
          ))}

          {/* Quien guía la clase levanta los brazos medio segundo antes. */}
          <g transform={fuga(0.6)}>
            <Persona x={404} y={SS} alto={64} mirando={-1} delay={1400} brazo="estirar" brazoDelay={-600} />
          </g>
        </g>

        {/* ================= TERRAZA: la huerta y el unplugged ============= */}
        <g className={grupo('terraza')}>
          <path d={planoPiso(PISOS.terraza.piso)} className="fill-casa-piso stroke-ink/15" strokeWidth="1" />
          <g transform={fuga(0.86)}>
            <Tanque x={CASA.x2 - 58} y={PISOS.terraza.piso - 4} />
          </g>
          <Guirnalda x1={CASA.x1 + 12} x2={CASA.x2 + FONDO.x - 12} y={44} caida={13} />

          {/* La huerta, en cantero contra el fondo */}
          <g transform={fuga(0.8)}>
            <Caja x={CASA.x1 + 6} y={PISOS.terraza.piso - 10} ancho={84} alto={10} prof={0.26} />
            {[10, 30, 50, 70].map((dx, i) => (
              <Planta
                key={dx}
                x={CASA.x1 + 6 + dx}
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
            <Teclado x={168} y={PISOS.terraza.piso} ancho={52} />
            <Persona x={196} y={PISOS.terraza.piso} alto={52} kipa delay={400} brazo="teclear" ritmo />
          </g>

          <g transform={fuga(0.52)}>
            <Microfono x={236} y={PISOS.terraza.piso} alto={46} ondas />
            <Persona x={252} y={PISOS.terraza.piso} alto={54} pelo delay={1200} brazo="arco-brazo" ritmo />
            <Cuerdas x={240} y={PISOS.terraza.piso - 28} tipo="violin" mirando={-1} />
            <Arco x={230} y={PISOS.terraza.piso - 31} largo={20} />
          </g>

          <g transform={fuga(0.3)}>
            <Microfono x={284} y={PISOS.terraza.piso} alto={44} mirando={-1} />
            <Persona x={300} y={PISOS.terraza.piso} alto={56} kipa delay={2000} brazo="rasgueo" ritmo />
            <Cuerdas x={310} y={PISOS.terraza.piso - 26} tipo="guitarra" />
            <Persona x={344} y={PISOS.terraza.piso} alto={54} color="fill-primary-700" delay={800} brazo="rasgueo" brazoDelay={300} ritmo />
            <Cuerdas x={353} y={PISOS.terraza.piso - 25} tipo="bajo" />
          </g>

          <g transform={fuga(0.1)}>
            <Cajon x={200} y={PISOS.terraza.piso} />
            <PersonaSilla x={210} y={PISOS.terraza.piso} alto={52} color="fill-primary-700" pelo delay={1600} brazo="golpear" ritmo />
            <Platillo x={234} y={PISOS.terraza.piso} alto={34} />
          </g>

          <Notas x={222} y={PISOS.terraza.piso - 62} cantidad={4} />
          <Notas x={322} y={PISOS.terraza.piso - 58} cantidad={3} escala={0.9} />

          {/* La baranda va al final: pasa por delante de todos y por eso el
              conjunto se lee arriba de una terraza y no flotando. */}
          <g className="stroke-ink/45" strokeWidth={TRAZO} strokeLinecap="round">
            <path d={`M ${CASA.x1 + 4} 98 L ${CASA.x2 - 4} 98`} />
            {Array.from({ length: 18 }, (_, i) => CASA.x1 + 10 + i * 20).map((x) => (
              <path key={x} d={`M ${x} 98 L ${x} ${PISOS.terraza.piso - 4}`} />
            ))}
          </g>
        </g>

        {/* ================= LA ESCALERA ================================== */}
        {/* Va después de los pisos porque los atraviesa: en un corte, la
            escalera es lo único que se ve entero de arriba abajo. El hueco de
            cada losa se sugiere con un plano más oscuro por donde pasa. */}
        <g className="transition-opacity duration-cinematic ease-standard opacity-100">
          {[PISOS.primero.piso, PISOS.planta.piso].map((y) => (
            <path key={y} d={planoPiso(y, ESCALERA.x - 30, ESCALERA.x + 30)} className="fill-casa-fondo" />
          ))}
          <Caracol
            x={ESCALERA.x}
            base={PISOS.subsuelo.piso}
            alto={PISOS.subsuelo.piso - PISOS.terraza.piso}
            radio={27}
          />
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
        </g>
      </g>
    </svg>
  );
};

export default CasaDibujada;
