import { useEffect, useRef } from 'react';
import { Guirnalda, Humo, Persona, PersonaSentada, PersonaSilla, Vela } from './piezas';
import {
  Alacena,
  Arbol,
  Alfombra,
  Auto,
  Arco,
  Botella,
  Caja,
  Cartel,
  Ciudad,
  Chispas,
  Cajon,
  Candelabro,
  Copa,
  Cuerdas,
  Estante,
  Jalot,
  Laptop,
  Maguen,
  Menora,
  Mesa,
  Mesada,
  Mezuza,
  Campana,
  Espejo,
  Farol,
  Microfono,
  Notas,
  Parrilla,
  Pizarra,
  Plato,
  Platillo,
  Parlante,
  Pileta,
  Piso,
  Jacuzzi,
  Porton,
  PuertaEntrada,
  RinconCafe,
  Silla,
  Sauna,
  Sillon,
  Suca,
  Tanque,
  Taza,
  Teclado,
  Ventana,
  Zocalo,
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
 * **La cámara va atada al scroll**, no a un cambio de sección: el encuadre es
 * una función de dónde está la página en este instante, así que frenás a la
 * mitad y la cámara queda a la mitad. Y en el medio del viaje se abre y vuelve
 * a cerrarse, que es lo que hace un camarógrafo para no perder el contexto
 * mientras cambia de encuadre — y acá además cuenta algo: mientras pasás de un
 * piso a otro, ves la casa entera.
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
    s: id === 'planta' ? 1.42 : 1.66,
  };
};

const FOCOS = {
  todo: { x: 236, y: 262, s: 0.92 },
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

  useEffect(() => {
    const g = camaraRef.current;
    if (!g) return undefined;

    const aplicar = ({ x, y, s }) => {
      g.setAttribute(
        'transform',
        `translate(${VISTA.x + VISTA.ancho / 2 - s * x} ${VISTA.y + VISTA.alto / 2 - s * y}) scale(${s})`
      );
    };

    const secciones = [...document.querySelectorAll('[data-piso]')];
    if (!secciones.length) return undefined;

    const suave = (t) => t * t * (3 - 2 * t);

    /**
     * La cámara es una función del scroll, no una animación disparada por un
     * cambio de sección.
     *
     * Antes viajaba de un piso al siguiente cuando un observer avisaba que
     * habías llegado: el movimiento arrancaba tarde y terminaba solo, y por eso
     * se sentía despegado de la mano. Ahora el encuadre se interpola entre el
     * piso que dejás y el que viene según **dónde está el scroll en este
     * instante**: frenás a la mitad y la cámara queda a la mitad. Nada corre
     * por su cuenta.
     *
     * Y en el medio del viaje se abre —el zoom baja hasta un tercio y vuelve a
     * subir— que es lo que hace un camarógrafo para no perder el contexto
     * mientras cambia de encuadre. Acá además cuenta algo: mientras pasás de un
     * piso a otro, ves la casa entera.
     */
    const encuadreDelScroll = () => {
      const centro = window.innerHeight / 2;
      const marcas = secciones.map((n) => {
        const r = n.getBoundingClientRect();
        return { piso: n.dataset.piso, y: r.top + r.height / 2 };
      });

      if (centro >= marcas[0].y) return { ...encuadrar(FOCOS[marcas[0].piso] ?? FOCOS.todo) };
      const ultima = marcas[marcas.length - 1];
      if (centro <= ultima.y) return { ...encuadrar(FOCOS[ultima.piso] ?? FOCOS.todo) };

      const i = marcas.findIndex((m, k) => k < marcas.length - 1 && m.y > centro && marcas[k + 1].y <= centro);
      const a = encuadrar(FOCOS[marcas[i].piso] ?? FOCOS.todo);
      const b = encuadrar(FOCOS[marcas[i + 1].piso] ?? FOCOS.todo);
      const t = suave((marcas[i].y - centro) / Math.max(1, marcas[i].y - marcas[i + 1].y));

      const salto = Math.hypot(b.x - a.x, b.y - a.y);
      const apertura = Math.min(0.32, salto / 820);

      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        s: (a.s + (b.s - a.s) * t) * (1 - apertura * Math.sin(Math.PI * t)),
      };
    };

    /* Si el sistema pide menos movimiento, la cámara se queda mostrando la casa
       entera y no se mueve nunca. */
    if (quiereQuietud()) {
      aplicar(encuadrar(FOCOS.todo));
      return undefined;
    }

    let pedido = null;
    const actualizar = () => {
      pedido = null;
      const pose = encuadreDelScroll();
      poseRef.current = pose;
      aplicar(pose);
    };
    const alScrollear = () => {
      if (pedido == null) pedido = requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener('scroll', alScrollear, { passive: true });
    window.addEventListener('resize', alScrollear);
    return () => {
      if (pedido != null) cancelAnimationFrame(pedido);
      window.removeEventListener('scroll', alScrollear);
      window.removeEventListener('resize', alScrollear);
    };
  }, []);

  const enFoco = (id) => activo === 'todo' || activo === id;

  const grupo = (id) =>
    `transition-opacity duration-cinematic ease-standard ${enFoco(id) ? 'opacity-100' : 'opacity-45'}`;

  /* El filtro va como atributo y no como clase de Tailwind: es un filtro de
     SVG, no de CSS. Bajarles la opacidad a los pisos que no estás leyendo no
     alcanzaba —seguían compitiendo, porque todo el dibujo estaba igual de
     nítido—; con el desenfoque el ojo entiende cuál es el plano de foco, que es
     exactamente lo que hace una cámara. */
  const foco = (id) => (enFoco(id) ? undefined : 'url(#casa-fuera-de-foco)');

  /* Atajos: la altura de piso de cada nivel. Todo el interior se cuelga de
     estos tres números, así que mover un piso no obliga a tocar cada mueble. */
  const P1 = PISOS.primero.piso;
  const P0 = PISOS.planta.piso;
  const SS = PISOS.subsuelo.piso;

  /**
   * El volumen de un piso: fondo, canto, piso y terminaciones.
   *
   * Las terminaciones no son adorno. El material del piso a la vista, el zócalo
   * contra la pared y las ventanas son las tres cosas que convierten un
   * rectángulo de color en una habitación; sin ellas, cualquier ambiente se ve
   * como una maqueta de cartón.
   */
  const Volumen = ({ techo, piso, x1 = CASA.x1, x2 = CASA.x2, material = 'madera', ventanas = [] }) => (
    <g>
      {/* El cielorraso, visto desde abajo. Es el plano que faltaba: sin él, cada
          piso es una caja abierta arriba y el edificio no se lee como un
          edificio sino como tres bandejas apiladas. */}
      <path d={planoPiso(techo, x1, x2)} className="fill-casa-costado" />
      <path d={paredFondo(techo, piso, x1, x2)} className="fill-casa-fondo" />
      {/* Oscurecimiento en el encuentro de la pared con el techo. Es el truco
          más barato que hay para que un plano se lea cóncavo. */}
      <path d={paredFondo(techo, techo + 46, x1, x2)} fill="url(#casa-rincon)" />
      <path d={costado(techo, piso, x2)} className="fill-casa-costado" />
      {/* El espesor del muro medianero izquierdo, en el plano del corte. */}
      <path
        d={`M ${x1 - 6} ${piso} L ${x1 - 6} ${techo} L ${x1} ${techo} L ${x1} ${piso} Z`}
        className="fill-casa-sombra"
      />
      <path d={planoPiso(piso, x1, x2)} className="fill-casa-piso" />
      <Piso x1={x1} x2={x2} y={piso} material={material} />
      <Zocalo x1={x1} x2={x2} y={piso} />
      <g transform={fuga(1)}>
        {ventanas.map((v) => (
          <Ventana key={v.x} x={v.x} y={v.y} ancho={v.ancho} alto={v.alto} />
        ))}
      </g>
      {/* El canto de la losa, en el plano del corte: la franja de hormigón que
          se ve cuando cortás un edificio. Es lo que separa un piso del
          siguiente y lo que faltaba para entender el corte. */}
      <path
        d={`M ${x1 - 6} ${piso} L ${x2} ${piso} L ${x2} ${piso + 8} L ${x1 - 6} ${piso + 8} Z`}
        className="fill-casa-costado stroke-ink/40"
        strokeWidth="1"
      />
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
        {/* El desenfoque de los pisos que no estás leyendo. Bajarles la
            opacidad no alcanzaba: seguían compitiendo por la atención porque
            todo el dibujo estaba igual de nítido. Con dos píxeles y medio de
            desenfoque el ojo entiende cuál es el plano de foco, que es
            exactamente lo que hace una cámara. */}
        <filter id="casa-fuera-de-foco" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
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

        {/* ---- la ciudad, atrás de todo ---- */}
        <Ciudad x1={VISTA.x} x2={VISTA.x + VISTA.ancho} y={PISOS.terraza.piso + 4} />

        {/* ---- la vereda ---- */}
        <g>
          {/* La vereda es un plano en fuga como todos los demás, no una raya.
              Con una línea sola el edificio flotaba: no se entendía sobre qué
              está apoyado ni hacia dónde sigue el suelo. */}
          <path
            d={planoPiso(SUELO, VISTA.x + 8, CASA.x2 + 24)}
            className="fill-casa-piso stroke-ink/25"
            strokeWidth="1"
          />
          <path
            d={`M ${VISTA.x + 8} ${SUELO} L ${CASA.x2 + 24} ${SUELO}`}
            className="stroke-ink/70"
            strokeWidth={TRAZO * 1.2}
            strokeLinecap="round"
          />
          {/* El cordón: dos líneas y la vereda deja de ser una raya para pasar
              a ser una vereda. */}
          <path
            d={`M ${VISTA.x + 8} ${SUELO + 7} L ${CASA.x1 - 6} ${SUELO + 7}`}
            className="stroke-ink/25"
            strokeWidth="2"
          />
          {/* Las juntas de la vereda, también en fuga */}
          {Array.from({ length: 7 }, (_, i) => VISTA.x + 20 + i * 22).map((x) => (
            <path
              key={x}
              d={`M ${x} ${SUELO} L ${x + FONDO.x * 0.5} ${SUELO + FONDO.y * 0.5}`}
              className="stroke-ink/15"
              strokeWidth="1"
            />
          ))}
          <Arbol x={VISTA.x + 26} y={SUELO} alto={132} />
          <Farol x={CASA.x1 - 40} y={SUELO} alto={100} />
        </g>

        {/* ================= PRIMER PISO: cowork, charlas y el baño ======= */}
        <g className={grupo('primero')} filter={foco('primero')}>
          <Volumen
            {...PISOS.primero}
            ventanas={[
              { x: 214, y: P1 - 116, ancho: 54, alto: 42 },
              { x: 118, y: P1 - 116, ancho: 44, alto: 42 },
            ]}
          />

          <g transform={fuga(0.86)}>
            <Pizarra x={176} y={P1 - 128} ancho={72} alto={44} />
          </g>

          {/* El rincón del café, contra la pared de la izquierda */}
          <g transform={fuga(0.74)}>
            <RinconCafe x={CASA.x1 + 10} y={P1} />
            <Estante x={CASA.x1 + 8} y={P1 - 92} ancho={62} />
          </g>

          {/* El sillón */}
          <g transform={fuga(0.6)}>
            <Sillon x={CASA.x1 + 76} y={P1} ancho={64} />
            <PersonaSilla x={CASA.x1 + 108} y={P1} alto={58} color="fill-primary-700" pelo delay={900} brazo="estirar" brazoDelay={2400} />
          </g>

          {/* La mesa larga compartida: cuatro puestos, dos de cada lado. Un
              cowork son personas de los dos lados de una misma mesa, no
              escritorios sueltos. */}
          <g transform={fuga(0.56)}>
            <Mesa x={172} y={P1 - 48} ancho={104} piso={P1} prof={0.34} />
            <Laptop x={182} y={P1 - 48} />
            <Laptop x={240} y={P1 - 48} mirando={-1} />
            <Taza x={218} y={P1 - 48} />
            <Humo x={223} y={P1 - 60} escala={0.6} />
          </g>
          <g transform={fuga(0.76)}>
            <Silla x={194} y={P1} alto={42} mirando={-1} />
            <Silla x={244} y={P1} alto={42} mirando={-1} />
            <PersonaSilla x={194} y={P1} alto={62} mirando={-1} kipa delay={700} brazo="teclear" brazoDelay={220} />
            <PersonaSilla x={244} y={P1} alto={60} mirando={-1} color="fill-primary-700" pelo delay={2100} brazo="tomar" brazoDelay={3400} />
          </g>
          <g transform={fuga(0.16)}>
            <Silla x={206} y={P1} alto={42} />
            <Silla x={256} y={P1} alto={42} />
            <PersonaSilla x={206} y={P1} alto={66} kipa delay={300} brazo="tomar" brazoDelay={900} />
            <PersonaSilla x={256} y={P1} alto={64} color="fill-primary-700" pelo delay={1600} brazo="teclear" brazoDelay={480} />
          </g>

          {/* El baño con sauna y jacuzzi, detrás de su tabique. La mezuzá va en
              todas las puertas de la casa menos en esta: un baño está exento, y
              ponerle una sería el tipo de detalle que delata que el dibujo no
              sabe de qué está hablando. */}
          <path
            d={`M ${SERVICIO.x1 - 8} ${P1} L ${SERVICIO.x1 - 8} ${PISOS.primero.techo + 6}`}
            className="stroke-ink/25"
            strokeWidth={TRAZO * 1.5}
          />
          <g transform={fuga(0.72)}>
            <Sauna x={SERVICIO.x1 + 30} y={P1} ancho={76} alto={88} />
            <Humo x={SERVICIO.x1 + 74} y={P1 - 92} delay={0} escala={0.9} />
            <Humo x={SERVICIO.x1 + 88} y={P1 - 88} delay={1500} escala={0.7} />
          </g>
          <g transform={fuga(0.24)}>
            <Jacuzzi x={SERVICIO.x1 - 2} y={P1} ancho={62} />
            <PersonaSentada x={SERVICIO.x1 + 28} y={P1 - 26} alto={40} pelo delay={1200} />
          </g>
        </g>

        {/* ================= PLANTA BAJA: salón, cocina y parrilla ========= */}
        <g className={grupo('planta')} filter={foco('planta')}>
          <Volumen
            {...PISOS.planta}
            ventanas={[{ x: 250, y: P0 - 120, ancho: 56, alto: 44 }]}
          />

          {/* La lámpara y su charco de luz sobre la mesa */}
          <path d={`M 176 ${PISOS.planta.techo} L 176 ${P0 - 92}`} className="stroke-ink/50" strokeWidth={TRAZO} />
          <path d={`M 160 ${P0 - 74} L 192 ${P0 - 74} L 184 ${P0 - 92} L 168 ${P0 - 92} Z`} className="fill-ink" />
          <ellipse cx={180} cy={P0 - 32} rx={96} ry={44} fill="url(#casa-luz)" className="animate-latir motion-reduce:animate-none" />

          {/* La puerta: un hueco en la pared, sin hoja. La casa está abierta y
              dibujar una hoja cerrada diría lo contrario. */}
          <path
            d={`M ${CASA.x1} ${P0} L ${CASA.x1} ${P0 - 84} L ${CASA.x1 + FONDO.x * 0.5} ${P0 - 84 + FONDO.y * 0.5} L ${CASA.x1 + FONDO.x * 0.5} ${P0 + FONDO.y * 0.5} Z`}
            className="fill-casa-costado"
          />
          <PuertaEntrada x={CASA.x1 - 2} y={P0} ancho={30} alto={84} />
          {/* La mezuzá de la puerta de calle, en la jamba derecha y a la
              altura que va: el tercio de arriba del vano. */}
          <Mezuza x={CASA.x1 + 32} y={P0 - 56} alto={13} />
          <Cartel x={CASA.x1 - 4} y={P0 - 120} ancho={34} />

          {/* Quien llega y quien recibe. Antes había alguien cruzando la
              vereda en loop: una silueta sin pies que apoyar no camina por más
              que se le saque el rebote, y encima obligaba a mirar el mismo
              gesto cada veinte segundos. Un saludo desde la puerta cuenta lo
              mismo —la casa recibe— y no depende de fingir un paso. */}
          <Persona x={30} y={P0} alto={66} color="fill-primary-700" pelo delay={600} />
          <g transform={fuga(0.3)}>
            <Persona x={CASA.x1 + 44} y={P0} alto={70} kipa delay={200} brazo="saludar" brazoDelay={1400} />
          </g>

          <Alfombra x={84} y={P0 - 3} ancho={170} prof={0.6} color="fill-barro-claro" />

          {/* La menorá de siete brazos sobre el aparador, y un maguen david en
              el vidrio de la ventana del salón. Los dos son de la casa, no
              decoración: una menorá no es una januquiá y va todo el año. */}
          <g transform={fuga(0.84)}>
            <Caja x={96} y={P0 - 40} ancho={54} alto={36} prof={0.24} claro="fill-barro-claro" base="fill-barro" oscuro="fill-barro-oscuro" />
            <Menora x={123} y={P0 - 40} alto={22} />
          </g>
          <g transform={fuga(1)}>
            <Maguen x={278} y={P0 - 98} r={9} className="stroke-primary-600/70" />
          </g>

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
            <PersonaSilla x={116} y={P0} alto={74} mirando={-1} kipa delay={0} brazo="palmas" ritmo />
            <PersonaSilla x={170} y={P0} alto={72} mirando={-1} color="fill-primary-700" pelo delay={900} ritmo />
            <PersonaSilla x={212} y={P0} alto={76} mirando={-1} kipa delay={1800} brazo="brindar" brazoDelay={3200} />
          </g>
          <g transform={fuga(0.06)}>
            <Silla x={134} y={P0} alto={44} />
            <Silla x={192} y={P0} alto={44} />
            <PersonaSilla x={134} y={P0} alto={78} pelo delay={500} brazo="palmas" brazoDelay={600} ritmo />
            <PersonaSilla x={192} y={P0} alto={76} color="fill-primary-700" kipa delay={2200} ritmo />
          </g>

          {/* La cocina y la parrilla, en la franja de servicio. Un tabique bajo
              las separa del salón: en la casa son dos ambientes, no uno. */}
          <path
            d={`M ${SERVICIO.x1 - 12} ${P0} L ${SERVICIO.x1 - 12} ${P0 - 58}`}
            className="stroke-ink/25"
            strokeWidth={TRAZO * 1.5}
          />
          <Mezuza x={SERVICIO.x1 - 12} y={P0 - 44} alto={11} />
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
        <g className={grupo('subsuelo')} filter={foco('subsuelo')}>
          <Volumen
            {...PISOS.subsuelo}
            material="cemento"
            /* Ventanucos a ras del techo: es toda la luz natural que puede
               tener un subsuelo, y decirlo es más honesto que dibujar
               ventanales que no existen. */
            ventanas={[
              { x: 120, y: SS - 118, ancho: 40, alto: 16 },
              { x: 300, y: SS - 118, ancho: 40, alto: 16 },
            ]}
          />

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
        <g className={grupo('terraza')} filter={foco('terraza')}>
          <path d={planoPiso(PISOS.terraza.piso)} className="fill-casa-piso stroke-ink/15" strokeWidth="1" />
          <g transform={fuga(0.86)}>
            <Tanque x={CASA.x2 - 16} y={PISOS.terraza.piso - 4} ancho={22} alto={20} />
          </g>
          {/* La sucá, contra el fondo: paños, sjaj de ramas —que tiene que
              dejar ver el cielo, esa es toda la gracia— y la fruta colgando. */}
          <g transform={fuga(0.62)}>
            <Suca x={CASA.x2 - 100} y={PISOS.terraza.piso} ancho={78} alto={62} />
          </g>
          <Guirnalda x1={CASA.x1 + 12} x2={CASA.x2 + FONDO.x - 12} y={44} caida={13} />

          {/* La pileta, del lado del sol. Estaba en el texto de Malka desde
              siempre —"una pileta para disfrutar el verano"— y no estaba
              dibujada en ningún lado. */}
          <g transform={fuga(0.34)}>
            <Pileta x={CASA.x1 + 12} y={PISOS.terraza.piso - 6} ancho={104} fondo={0.42} />
          </g>
          <g transform={fuga(0.12)}>
            <PersonaSentada x={CASA.x1 + 128} y={PISOS.terraza.piso - 2} alto={44} pelo delay={800} />
          </g>

          {/* El unplugged: teclado y voz al fondo, cuerdas en el medio,
              percusión adelante. Es el orden real de una banda chica y, de
              paso, el que deja ver a todos. */}
          <g transform={fuga(0.74)}>
            <Teclado x={182} y={PISOS.terraza.piso} ancho={54} />
            <Persona x={212} y={PISOS.terraza.piso} alto={52} kipa delay={400} brazo="teclear" ritmo />
          </g>

          <g transform={fuga(0.52)}>
            <Microfono x={252} y={PISOS.terraza.piso} alto={46} ondas />
            <Persona x={268} y={PISOS.terraza.piso} alto={54} pelo delay={1200} brazo="arco-brazo" ritmo />
            <Cuerdas x={256} y={PISOS.terraza.piso - 28} tipo="violin" mirando={-1} />
            <Arco x={246} y={PISOS.terraza.piso - 31} largo={20} />
          </g>

          <g transform={fuga(0.3)}>
            <Microfono x={300} y={PISOS.terraza.piso} alto={44} mirando={-1} />
            <Persona x={316} y={PISOS.terraza.piso} alto={56} kipa delay={2000} brazo="rasgueo" ritmo />
            <Cuerdas x={326} y={PISOS.terraza.piso - 26} tipo="guitarra" />
            <Persona x={352} y={PISOS.terraza.piso} alto={54} color="fill-primary-700" delay={800} brazo="rasgueo" brazoDelay={300} ritmo />
            <Cuerdas x={361} y={PISOS.terraza.piso - 25} tipo="bajo" />
          </g>

          <g transform={fuga(0.1)}>
            <Cajon x={222} y={PISOS.terraza.piso} />
            <PersonaSilla x={232} y={PISOS.terraza.piso} alto={52} color="fill-primary-700" pelo delay={1600} brazo="golpear" ritmo />
            <Platillo x={256} y={PISOS.terraza.piso} alto={34} />
          </g>

          <Notas x={240} y={PISOS.terraza.piso - 62} cantidad={4} />
          <Notas x={338} y={PISOS.terraza.piso - 58} cantidad={3} escala={0.9} />

          {/* La baranda va al final: pasa por delante de todos y por eso el
              conjunto se lee arriba de una terraza y no flotando. */}
          <g className="stroke-ink/45" strokeWidth={TRAZO} strokeLinecap="round">
            <path d={`M ${CASA.x1 + 4} 98 L ${CASA.x2 - 4} 98`} />
            {Array.from({ length: 18 }, (_, i) => CASA.x1 + 10 + i * 20).map((x) => (
              <path key={x} d={`M ${x} 98 L ${x} ${PISOS.terraza.piso - 4}`} />
            ))}
          </g>
          {/* Un maguen david forjado en la baranda, como el de las rejas
              viejas de la comunidad. */}
          <g>
            <Maguen x={CASA.x1 + 130} y={PISOS.terraza.piso - 20} r={11} className="stroke-ink/45" />
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
        </g>
      </g>
    </svg>
  );
};

export default CasaDibujada;
