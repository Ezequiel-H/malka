import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../components/ui';
import IconoPropuesta from '../components/landing/IconosPropuestas';
import Grano from '../components/landing/Grano';
import CasaDibujada, { PROPORCION } from '../components/landing/casa/CasaDibujada';
import LandingButton from '../components/landing/LandingButton';
import { IDIOMAS, TEXTOS } from '../components/landing/textos';
import logoMalka from '../assets/logo-malka-positivo.png';
import fotoWally from '../assets/landing/staff/wally.jpg';
import fotoMati from '../assets/landing/staff/mati.jpg';
import fotoBrian from '../assets/landing/staff/brian.jpg';
import fotoCaro from '../assets/landing/staff/caro.jpg';

/**
 * La landing como plano de la casa.
 *
 * La idea de fondo: Malka no es un programa de actividades, es un edificio al
 * que se entra, y eso es lo único que ninguna otra institución de la comunidad
 * puede copiar. Así que la página **es** la casa: el dibujo queda fijo a un
 * costado y el texto sube piso por piso, encendiendo el piso del que se está
 * hablando.
 *
 * Explica sin esforzarse porque cada piso es una respuesta concreta a "¿qué
 * hago yo acá?": abajo se come, en el primero se labura, en el segundo se
 * estudia, arriba se mira la ciudad. Nadie tiene que imaginarse nada.
 *
 * Está dibujado y no fotografiado a pedido: si algo se va a mover, que sea
 * dibujo. Un dibujo puede tener humo saliendo de la parrilla sin mentirle a
 * nadie sobre cómo es la casa; una foto animada, no.
 *
 * El scroll no controla ninguna coreografía: sólo dice qué piso está activo.
 * Nada se traba, nada hay que esperar, y quien llega con el navegador en
 * "menos movimiento" ve la casa entera quieta y no se pierde nada.
 */

/**
 * Las secciones de la página.
 *
 * `piso` decide qué nivel queda en foco y `zona` a qué **espacio** se acerca la
 * cámara: una planta baja son dos escenas distintas —la mesa puesta y la
 * cocina— y mirarlas juntas es no mirar ninguna.
 */
/* Las seis puertas de la casa, con el encuadre al que lleva cada una. Viven
   afuera de las secciones porque las usan dos lugares: la lista de "quiénes
   somos" y la barra que en el teléfono va pegada abajo del dibujo. Los nombres
   salen de `textos.js` según el idioma; la clave es la zona. */
const ESPACIOS = [
  { icono: 'salon', zona: 'mesa', piso: 'planta' },
  { icono: 'cocinita', zona: 'cocina', piso: 'planta' },
  { icono: 'cowork', zona: 'cowork', piso: 'primero' },
  { icono: 'garage', zona: 'clase', piso: 'subsuelo' },
  { icono: 'terraza', zona: 'banda', piso: 'terraza' },
  { icono: 'fondo', zona: 'parrilla', piso: 'todo' },
];

const SECCIONES = [
  /* La portada no lleva texto en la columna: el texto de la portada es el
     wordmark y la frase. Dos titulares en la misma pantalla era el problema. */
  { id: 'entrada', piso: 'todo', zona: 'todo', portada: true },
  /* Cada espacio lleva su encuadre: tocarlo lleva la cámara ahí. Es la forma
     más directa de mostrar una casa —dejar que el otro elija por dónde
     empieza— y de paso convierte la lista en el índice del dibujo. */
  { id: 'quienes', piso: 'todo', zona: 'casa', conEspacios: true },
  { id: 'propuestas', piso: 'planta', zona: 'mesa' },
  { id: 'sauna', piso: 'primero', zona: 'bano' },
];

/* Las seis puertas de Malka, que ya son las suyas: están en su sitio desde
   siempre y son la mejor manera de decir qué se puede hacer acá sin escribir
   una lista de actividades que vence en una semana. */
const PROPUESTAS = ['judaismo', 'actividades', 'coworking', 'asaditos', 'huerta', 'musica'];

/* Los cuatro que te reciben, con sus caras. Las fotos llegaron de Malka y están
   recortadas al mismo alto y a la misma proporción: cuatro retratos con encuadres
   distintos se leen como cuatro fichas prestadas de otro lado. */
const STAFF = [
  { nombre: 'Wally Liebhaber', rol: 'direccion', foto: fotoWally },
  { nombre: 'Rab Mati Bomse', rol: 'direccion', foto: fotoMati },
  { nombre: 'Sem. Brian Bruh', rol: 'direccion', foto: fotoBrian },
  { nombre: 'Caro Weber', rol: 'asistente', foto: fotoCaro },
];

/* Los datos de la casa. Los que se pueden abrir, se abren. `dato` es fijo en
   todos los idiomas; `datoDe` lo busca en los textos del idioma. */
const CONTACTO = [
  {
    que: 'donde',
    dato: '3 de Febrero 1325, CABA',
    icono: 'pin',
    href: 'https://maps.google.com/?q=3+de+Febrero+1325,+CABA',
  },
  { que: 'cuando', datoDe: 'horario', icono: 'reloj' },
  { que: 'whatsapp', dato: '+54 9 11 3440-5730', icono: 'whatsapp', href: 'https://wa.me/5491134405730' },
  {
    que: 'instagram',
    dato: '@somosmalka',
    icono: 'instagram',
    href: 'https://www.instagram.com/somosmalka/',
  },
  { que: 'mail', dato: 'malka@casamalka.org', icono: 'sobre', href: 'mailto:malka@casamalka.org' },
  { que: 'creada', datoDe: 'amijai', icono: 'maguen', href: 'https://amijai.org/' },
];

const INDICE = ['quienes', 'propuestas', 'sauna', 'staff', 'sumate'];

/* Los espacios con sus nombres en el idioma de la página. */
const espaciosEn = (t) => ESPACIOS.map((e) => ({ ...e, ...t.espacios[e.zona] }));

/**
 * El cambio de idioma: tres links cortos. Cada idioma tiene su dirección
 * (`/`, `/en`, `/he`), así que se puede compartir el link en el idioma justo.
 */
const SelectorIdioma = ({ idioma, t, className = '' }) => (
  <nav aria-label={t.ui.idioma} className={`flex items-center gap-1 ${className}`}>
    {IDIOMAS.map((i) => (
      <Link
        key={i.id}
        to={i.ruta}
        lang={i.id}
        aria-current={i.id === idioma ? 'true' : undefined}
        title={i.nombre}
        className={`inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-pill px-2 font-grotesk text-[0.7rem] font-semibold tracking-label transition-colors duration-base ${
          i.id === idioma ? 'bg-ink/10 text-ink' : 'text-ink-faint hover:bg-ink/5 hover:text-ink'
        }`}
      >
        {i.corto}
      </Link>
    ))}
  </nav>
);

/**
 * Una puerta de la casa, en forma de píldora.
 *
 * Es el mismo control en los dos lugares donde aparece —la lista de la sección
 * y la barra pegada abajo del dibujo en el teléfono—, así que elegir un espacio
 * se ve y se siente igual en cualquier pantalla.
 */
const PildoraEspacio = ({ espacio, elegido, onClick, compacta = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={elegido}
    className={`group inline-flex shrink-0 items-center rounded-pill border transition-all duration-base ease-standard focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 ${
      /* En el teléfono la píldora es lo que se toca con el pulgar: 44 px de alto
         es el mínimo cómodo, y el nombre entero tiene que entrar sin cortarse
         en tres columnas —de ahí el aire justo entre el ícono y la palabra. */
      compacta ? 'w-full min-w-0 justify-center gap-1.5 px-1.5 py-3' : 'gap-2 py-1.5 pl-1.5 pr-3.5'
    } ${
      elegido
        ? 'border-primary bg-primary text-surface shadow-subtle'
        : 'border-ink/10 bg-surface/70 text-ink-soft hover:border-ink/25 hover:text-ink'
    }`}
  >
    <span
      className={`flex shrink-0 items-center justify-center rounded-pill transition-colors duration-base ${
        compacta ? 'h-[1.1rem] w-[1.1rem]' : 'h-6 w-6'
      } ${
        elegido
          ? compacta
            ? 'text-surface'
            : 'bg-surface/20 text-surface'
          : `text-ink-soft group-hover:text-ink ${compacta ? '' : 'bg-ink/5'}`
      }`}
    >
      <IconoPropuesta nombre={espacio.icono} className={compacta ? 'h-[1.1rem] w-[1.1rem]' : 'h-3.5 w-3.5'} />
    </span>
    <span className={`min-w-0 truncate font-grotesk font-semibold uppercase leading-none tracking-label ${compacta ? 'text-[0.66rem]' : 'whitespace-nowrap text-[0.72rem]'}`}>
      {compacta ? espacio.corto : espacio.nombre}
    </span>
  </button>
);

/**
 * La casa a pantalla completa, para el teléfono.
 *
 * En un monitor la casa vive al costado y la cámara acompaña la lectura: hay
 * lugar para las dos cosas a la vez. En un teléfono no. Meter el dibujo pegado
 * arriba dejaba media pantalla para el texto y la casa en miniatura, y encima
 * el texto pasaba por atrás. Así que en el teléfono el dibujo no acompaña el
 * scroll: se abre cuando lo pedís, ocupa todo, y ahí sí se recorre espacio por
 * espacio con el pulgar.
 */
const VisorCasa = ({ onCerrar, t }) => {
  const [espacio, setEspacio] = useState(null);

  /**
   * Cuánto del dibujo queda a la vista.
   *
   * La caja del visor es vertical y la lámina es apaisada, así que el dibujo
   * tapa la caja: llena el alto y de su ancho se ve poco más de la mitad. La
   * cuenta es la que traduce el tamaño de la caja en esa fracción, y el dibujo
   * la necesita por dos cosas: para saber que tiene que tapar en vez de entrar
   * —entrar en una caja alta lo dejaba flotando en el medio, del tamaño de una
   * estampilla— y para poder centrarse en la casa sin creer que se le ve todo
   * el ancho.
   */
  const cajaRef = useRef(null);
  const [recorte, setRecorte] = useState(1);
  /* La medición va antes del primer pintado y no después: la cámara tiene una
     transición de un segundo, así que si el encuadre se corrigiera en el frame
     siguiente al de la apertura, abrir el visor empezaría con un viaje que
     nadie pidió. */
  useLayoutEffect(() => {
    const medir = () => {
      const caja = cajaRef.current;
      if (!caja) return;
      setRecorte(Math.min(1, caja.clientWidth / (caja.clientHeight * PROPORCION)));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar();
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.ui.casaPorDentro}
      className="fixed inset-0 z-[70] animate-fade-in bg-surface-page md:hidden"
    >
      {/* El dibujo ocupa la pantalla entera y todo lo demás flota encima: en un
          teléfono, repartir la altura entre dibujo, texto y botones deja tres
          cosas chicas. La caja de la cámara termina donde empieza la barra de
          abajo, así que el espacio queda centrado en lo que se ve, no en lo que
          tapa la barra. */}
      <div
        ref={cajaRef}
        className="absolute inset-x-0 bottom-[9.25rem] top-14 flex items-center justify-center overflow-hidden"
      >
        <CasaDibujada
          activo={espacio?.piso ?? 'todo'}
          /* Sin espacio elegido la cámara no se va lejos: se para justo delante
             de la casa, que llena el ancho de la pantalla de medianera a
             medianera. Alejarse hasta que entrara también la lámina —el cielo,
             la vereda, el patio— dejaba la casa del tamaño de una estampilla en
             medio del crema, y la primera cosa que ves al abrir el visor es
             justamente ésta. */
          zona={espacio?.zona ?? 'entera'}
          /* Un espacio se mira de un poco más lejos que en el monitor: la caja
             es alta y angosta, y que asomen el piso de arriba y el de abajo
             —desenfocados— es lo que ubica el ambiente dentro de la casa.
             Lo que no cambia nunca es el elemento: antes la vista general venía
             en una caja de otro tamaño que la de los espacios y al elegir uno
             el dibujo saltaba. Acá lo único que se mueve es la cámara, así que
             el viaje hasta un espacio es una sola transición continua. */
          acercar={espacio ? 0.9 : 1}
          recorte={recorte}
          /* Los bordes se desvanecen, como en la portada: la caja del visor
             corta el dibujo por los costados —una lámina apaisada en una
             pantalla vertical no tiene otra— y una línea recta ahí convierte el
             corte en un error. Con la máscara, lo que queda afuera se pierde en
             el papel. */
          className="h-full w-full [mask-image:radial-gradient(122%_104%_at_50%_46%,#000_62%,transparent_98%)]"
        />
      </div>

      <header className="relative flex items-center justify-between px-5 pt-4">
        <p className="text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
          {t.ui.casaPorDentro}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label={t.ui.cerrar}
          className="-me-2 inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink transition-control duration-fast hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/25"
        >
          <Icon name="close" size="md" />
        </button>
      </header>

      {/* Los seis espacios entran juntos en dos filas: en la tira que se
          arrastraba, los dos últimos no existían hasta que alguien adivinaba
          que había que deslizar. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-page via-surface-page to-transparent pb-5 pt-10">
        <p className="px-5 pb-3 text-sm leading-snug text-ink-soft">
          <span className="font-semibold text-ink">{espacio ? espacio.nombre : t.ui.todaLaCasa}</span>
          {' — '}
          {espacio ? espacio.que : t.ui.elegiEspacio}
        </p>
        <ul className="grid grid-cols-3 gap-2 px-5">
          {espaciosEn(t).map((e) => (
            <li key={e.zona} className="min-w-0">
              <PildoraEspacio
                compacta
                espacio={e}
                elegido={espacio?.zona === e.zona}
                onClick={() => setEspacio((actual) => (actual?.zona === e.zona ? null : e))}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* El idioma sale de la dirección: /en y /he; todo lo demás es castellano. */
const idiomaDeRuta = (pathname) => IDIOMAS.find((i) => i.id !== 'es' && pathname === i.ruta)?.id ?? 'es';

/* Cuánto tarda en apagarse el contenido antes de cambiar de idioma. */
const FUNDIDO_IDIOMA_MS = 220;

/**
 * La landing es siempre la de un visitante: no mira la sesión. Quien ya tiene
 * cuenta no llega acá (App lo manda a la app), así la vitrina y la plataforma
 * no se mezclan.
 */
const Landing = () => {
  const { pathname } = useLocation();
  const pedido = idiomaDeRuta(pathname);

  /**
   * El idioma que se ve va un paso atrás del de la dirección: al tocar otro,
   * el contenido se apaga, cambia el texto (y en hebreo se espeja) mientras
   * no se ve, y vuelve a aparecer. Cambiar de golpe hacía saltar la página
   * entera, sobre todo al pasar a hebreo, que da vuelta el armado.
   */
  const [idioma, setIdioma] = useState(pedido);
  const [fundido, setFundido] = useState(false);
  useEffect(() => {
    if (pedido === idioma) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIdioma(pedido);
      return undefined;
    }
    setFundido(true);
    const espera = window.setTimeout(() => {
      setIdioma(pedido);
      setFundido(false);
    }, FUNDIDO_IDIOMA_MS);
    return () => window.clearTimeout(espera);
  }, [pedido, idioma]);
  const capa = `transition-opacity duration-200 ease-standard motion-reduce:transition-none ${
    fundido ? 'opacity-0' : 'opacity-100'
  }`;

  const t = TEXTOS[idioma] ?? TEXTOS.es;
  const rtl = Boolean(IDIOMAS.find((i) => i.id === idioma)?.rtl);
  /* En hebreo se espeja la página entera: la casa pasa a la derecha, el texto
     a la izquierda y la barra arranca del otro lado. Por eso los márgenes y
     posiciones de acá usan los lógicos (ms, me, end) y no left/right. */
  const dir = rtl ? 'rtl' : undefined;

  /* El idioma de la página entera: lo usan el lector de pantalla, el
     traductor del navegador y Google. Al salir de la landing vuelve a ser el
     castellano de la app. */
  useEffect(() => {
    const html = document.documentElement;
    const titulo = document.title;
    html.lang = idioma;
    document.title = t.titulo;
    return () => {
      html.lang = 'es';
      document.title = titulo;
    };
  }, [idioma, t]);
  const [activo, setActivo] = useState('todo');
  const [zona, setZona] = useState('todo');
  const [seccion, setSeccion] = useState('entrada');

  /**
   * El espacio que el visitante eligió a mano.
   *
   * Manda por encima del scroll mientras siga en la misma sección; al salir de
   * ella, la casa vuelve a seguir la lectura. Sin esa regla, o el clic no dura
   * nada —el primer scroll lo pisa— o queda pegado y el resto de la página
   * muestra el ambiente equivocado.
   */
  const [manual, setManual] = useState(null);
  const [pregunta, setPregunta] = useState(0);

  /* Cuánto tiene que acercarse la cámara para compensar el tamaño de la caja
     donde vive el dibujo: en el teléfono es una franja de un tercio de
     pantalla, en tablet una columna angosta, y recién en escritorio grande la
     casa tiene todo el ancho que pide. */
  const cuantoAcercar = (ancho) => (ancho < 1280 ? 1.08 : 1);
  const esTelefono = () => typeof window !== 'undefined' && window.innerWidth < 768;
  const [acercar, setAcercar] = useState(
    typeof window !== 'undefined' ? cuantoAcercar(window.innerWidth) : 1
  );
  /* En el teléfono la casa no acompaña el scroll: se abre a pantalla completa
     cuando la piden. Así que abajo de 768 no hace falta ni el dibujo al
     costado ni el observer que lo mueve. */
  const [telefono, setTelefono] = useState(esTelefono);
  const [visor, setVisor] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const medir = () => {
      setAcercar(cuantoAcercar(window.innerWidth));
      setTelefono(esTelefono());
    };
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);
  /* Si la ventana crece con el visor abierto, la casa ya está al costado: el
     visor sobra y se cierra solo. Lo mismo el menú, que es de teléfono. */
  useEffect(() => {
    if (telefono) return;
    if (visor) setVisor(false);
    if (menu) setMenu(false);
  }, [telefono, visor, menu]);

  useEffect(() => {
    if (!menu) return undefined;
    const alTeclear = (e) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [menu]);
  const manualRef = useRef(null);
  const mirar = (seccionId, espacio) => {
    const elegido = { seccion: seccionId, zona: espacio.zona, piso: espacio.piso };
    manualRef.current = elegido;
    setManual(elegido);
  };

  /**
   * La portada: la casa arranca centrada y se corre a su columna al bajar.
   *
   * El movimiento va por clase y transición, no por scroll. La versión anterior
   * escribía un `transform` en cada scroll **sobre el elemento pegado con
   * `sticky`**, y eso es lo que hacía vibrar todo: un elemento sticky con
   * transform se compone en una capa aparte y queda un frame atrás de la
   * página. Acá el transform vive en un envoltorio interno —el sticky queda
   * limpio— y cambia una sola vez, cuando dejás la portada.
   */
  /* En el teléfono la cámara no corre, así que `zona` se queda en 'todo' para
     siempre: la barra de arriba necesita su propia señal, que es haber bajado
     de la portada. */
  const [bajado, setBajado] = useState(false);
  useEffect(() => {
    if (!telefono) return undefined;
    const alScrollear = () => setBajado(window.scrollY > window.innerHeight * 0.5);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, [telefono]);

  const enPortada = telefono ? !bajado : zona === 'todo';

  /**
   * "Conocé la casa" hace dos cosas distintas según la pantalla, y en las dos
   * hace lo que dice.
   *
   * En un monitor la casa ya está ahí al costado: el botón baja, y la cámara
   * —que sólo mira en qué sección estás— acompaña sola. En un teléfono la casa
   * no está a la vista, así que el botón la abre a pantalla completa.
   */
  const conocerLaCasa = () => {
    if (telefono) {
      setVisor(true);
      return;
    }
    document.getElementById('quienes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /**
   * Qué sección está activa.
   *
   * El observer avisa **que algo cambió**, pero no sirve para decidir cuál es
   * la sección activa: cuando scrolleás rápido o cambiás de dirección, la
   * misma tanda de avisos puede traer dos o tres secciones y el orden en que
   * llegan no es el orden de la página. Eso es lo que hacía saltar el encuadre
   * al subir y bajar.
   *
   * Así que el observer sólo despierta el cálculo, y la decisión se toma
   * mirando la página: gana la sección cuyo centro está más cerca del centro de
   * la pantalla. Es determinista, no depende de la dirección del scroll y
   * cuesta una docena de mediciones cada vez que algo entra o sale, no por
   * frame.
   */
  useEffect(() => {
    if (telefono) return undefined;
    const secciones = [...document.querySelectorAll('[data-zona]')];
    if (!secciones.length) return undefined;

    const elegir = () => {
      const centro = window.innerHeight / 2;
      let mejor = secciones[0];
      let menor = Infinity;
      for (const n of secciones) {
        const r = n.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - centro);
        if (d < menor) {
          menor = d;
          mejor = n;
        }
      }
      if (manualRef.current && manualRef.current.seccion !== mejor.id) {
        manualRef.current = null;
        setManual(null);
      }
      setActivo(mejor.dataset.piso);
      setZona(mejor.dataset.zona);
      if (mejor.id) setSeccion(mejor.id);
    };

    let pedido = null;
    const pedir = () => {
      if (pedido == null) pedido = requestAnimationFrame(() => {
        pedido = null;
        elegir();
      });
    };

    const obs = new IntersectionObserver(pedir, {
      /* Umbrales repartidos: así el observer avisa varias veces mientras una
         sección entra, y no sólo cuando cruza un punto exacto — que es donde se
         perdía el aviso si el salto de scroll era grande. */
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '-20% 0px -20% 0px',
    });
    secciones.forEach((n) => obs.observe(n));

    /* Y un aviso más por scroll, con el mismo cálculo: si alguien salta con la
       barra o con "fin", el observer puede no disparar nunca. */
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    elegir();

    return () => {
      obs.disconnect();
      if (pedido != null) cancelAnimationFrame(pedido);
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
    };
  }, [telefono]);

  return (
    <div dir={dir} className="relative min-h-screen bg-surface-page font-grotesk text-ink">
      {visor && <VisorCasa t={t} onCerrar={() => setVisor(false)} />}
      {/* El crema plano se leía como un vacío. Estas dos capas no se ven de
          frente pero se sienten: la primera son tres manchas de luz muy
          abiertas —las mismas que usa el login de la app— y la segunda es
          grano de papel. Juntas convierten el fondo en un material. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-paper-cream" />
      <Grano />
      {/* La barra no existe en la portada: aparece cuando empezás a recorrer.
          Una casa no te recibe con el cartel de "iniciar sesión" en la cara. */}
      <header
        className={`sticky top-0 z-50 border-b bg-surface-page/90 backdrop-blur-xl transition-all duration-500 ${
          enPortada && !menu
            ? 'pointer-events-none -translate-y-3 border-transparent opacity-0'
            : 'translate-y-0 border-ink/10 opacity-100'
        }`}
      >
        <nav aria-label={t.ui.principal} className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 sm:gap-4 sm:px-8">
          <img src={logoMalka} alt="Malka" className="h-5 w-auto shrink-0 sm:h-6" />
          <div className={`ms-auto flex items-center gap-3 ${capa}`}>
            {!telefono && <SelectorIdioma idioma={pedido} t={t} />}
                <LandingButton
                  to="/login"
                  variant="outline"
                  size="sm"
                  icon={null}
                  className="hidden whitespace-nowrap sm:inline-flex"
                >
                  {t.ui.iniciarSesion}
                </LandingButton>
                <LandingButton to="/register" size="sm" icon={telefono ? null : undefined} className="whitespace-nowrap">
                  {t.ui.registrate}
                </LandingButton>
            {/* En el teléfono, un menú de verdad: renglones de 56px que se
                tocan sin apuntar, en vez de tres controles chicos apretados
                contra el borde. Ahí adentro viven las secciones, la casa y el
                ingreso. */}
            {telefono && (
              <button
                type="button"
                aria-expanded={menu}
                aria-controls="menu-casa"
                aria-label={menu ? t.ui.cerrarMenu : t.ui.abrirMenu}
                onClick={() => setMenu((abierto) => !abierto)}
                className="-me-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink transition-control duration-fast hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/25"
              >
                <Icon name={menu ? 'close' : 'menu'} size="md" />
              </button>
            )}
          </div>
        </nav>

        {menu && telefono && (
          /* Absoluto y no en el flujo. Cuando el panel empujaba la página, al
             tocar una sección pasaban dos cosas en el mismo frame: el panel
             desaparecía —y todo subía 400px— y el navegador scrolleaba al
             destino calculado con la página vieja. Resultado: caías media
             pantalla más abajo, en la sección siguiente. */
          <div
            id="menu-casa"
            className="absolute inset-x-0 top-full animate-fade-in-up border-b border-ink/10 bg-surface-page px-5 pb-8 pt-2 shadow-[0_18px_24px_-18px_rgba(44,61,52,0.35)]"
          >
            <ul className="flex flex-col divide-y divide-ink/10">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    setVisor(true);
                  }}
                  className="flex w-full items-center gap-3 py-4 text-start font-grotesk text-base font-semibold text-ink"
                >
                  <IconoPropuesta nombre="casita" className="h-5 w-5 shrink-0 text-ink-soft" />
                  {t.ui.verCasa}
                </button>
              </li>
              {INDICE.filter((id) => id !== 'sauna').map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenu(false);
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="block py-4 font-grotesk text-base font-semibold text-ink"
                  >
                    {t.indice[id]}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  onClick={() => setMenu(false)}
                  className="block py-4 font-grotesk text-base font-semibold text-ink-soft"
                >
                  {t.ui.ingresar}
                </Link>
              </li>
              <li className="py-3">
                <SelectorIdioma idioma={pedido} t={t} />
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* El índice del recorrido, contra el borde. Con seis secciones y una
          casa que cambia de encuadre, lo que faltaba para entender el flujo era
          saber dónde estás parado y cuánto falta: eso lo resuelve una lista de
          seis renglones, no más animación. */}
      <nav
        aria-label={t.ui.secciones}
        className={`fixed end-7 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 transition-opacity duration-500 2xl:flex ${
          enPortada || fundido ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {INDICE.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="group flex flex-row-reverse items-center gap-3"
          >
            {/* Va contra el borde de afuera (el derecho; en hebreo, el izquierdo): es el único costado que el dibujo
                nunca invade, y ahí el índice se lee sin pelearse con la casa. */}
            <span
              className={`h-px transition-all duration-500 ${
                seccion === id ? 'w-8 bg-ink' : 'w-4 bg-ink/25 group-hover:w-6 group-hover:bg-ink/50'
              }`}
            />
            <span
              className={`text-[0.62rem] font-semibold uppercase tracking-label transition-all duration-300 ${
                seccion === id
                  ? 'text-ink opacity-100'
                  : 'text-ink-faint opacity-0 group-hover:opacity-100'
              }`}
            >
              {t.indice[id]}
            </span>
          </a>
        ))}
      </nav>

      <main className={`relative z-10 mx-auto max-w-6xl px-5 sm:px-8 ${capa}`}>
        <div className="md:grid md:grid-cols-12 md:gap-x-8 xl:gap-x-12">
          {/* El dibujo al costado, siguiendo la lectura: de tablet para
              arriba. En el teléfono no existe —la casa se abre a pantalla
              completa desde la portada— porque una franja pegada arriba dejaba
              media pantalla para el texto y la casa en miniatura. */}
          {!telefono && (
          <div className="sticky top-16 z-30 md:z-auto md:col-span-6 md:flex md:h-[calc(100vh-4rem)] md:items-center lg:col-span-5 xl:col-span-6">
            {/* La casa no se mueve nunca de su columna. Antes se corría al
                centro en la portada y volvía al scrollear: ese viaje lateral, con
                el texto cortándose al mismo tiempo, era el momento más brusco de
                la página. Ahora lo único que cambia es el encuadre de la cámara,
                que ya sabe moverse suave. */}
            <div className="relative w-full">
            {/* Dos cosas para que la casa deje de verse metida en una caja:
                se sale de su columna hacia el borde de la página —rompe la
                grilla, que es lo que la saca de la vitrina— y sus bordes se
                desvanecen con una máscara, así el dibujo termina en el aire y
                no en un rectángulo. */}
            <CasaDibujada
              activo={manual?.piso ?? activo}
              zona={manual?.zona ?? zona}
              acercar={acercar}
              className="mx-auto h-auto max-h-[calc(100vh-5rem)] w-[112%] max-w-none -ms-[9%] lg:w-[112%] lg:-ms-[12%] 2xl:w-[116%] 2xl:-ms-[16%] [mask-image:radial-gradient(106%_94%_at_53%_45%,#000_50%,transparent_90%)]"
            />
            </div>
          </div>
          )}

          <div className="md:col-span-6 lg:col-span-7 xl:col-span-6">
            {/* En el teléfono el sauna se cae: es un remate de dos líneas que
                sólo funciona con el dibujo al lado mostrando el baño. Sin la
                casa, "sí, también hay sauna" es una frase suelta. */}
            {SECCIONES.filter((p) => !(telefono && p.id === 'sauna')).map((p, i) =>
              p.portada ? (
                /* La portada es la primera sección de la columna, no una capa
                   flotando encima: así entra y sale con el scroll como todo lo
                   demás y no hay ninguna coreografía que sincronizar. */
                <section
                  key={p.id}
                  id={p.id}
                  data-piso={p.piso}
                  data-zona={p.zona}
                  /* La portada no lleva el colchón de las demás: viene justo
                     después de la franja del dibujo, que en mobile ya ocupa su
                     lugar en el flujo. Con el colchón, el wordmark caía fuera
                     de la primera pantalla. */
                  className="flex min-h-[42vh] flex-col justify-start pb-16 pt-7 md:min-h-screen md:justify-center md:py-24 xl:py-32"
                >
                  {/* En el teléfono la casa aparece una vez, quieta, arriba de
                      todo: es la cara de la página y la puerta al recorrido,
                      pero no persigue el scroll. */}
                  {telefono && (
                    <button
                      type="button"
                      onClick={() => setVisor(true)}
                      aria-label={t.ui.verCasa}
                      className="-mx-5 -mt-[4vh] mb-1 block w-[calc(100%+2.5rem)] animate-fade-in-up [animation-duration:900ms] [animation-fill-mode:backwards]"
                    >
                      <CasaDibujada
                        activo="todo"
                        /* La portada no muestra la lámina entera: encuadra la
                           casa con su patio. Con todo el aire alrededor la casa
                           quedaba en el medio de un rectángulo de crema, y lo
                           que se leía primero era el rectángulo. */
                        zona="portada"
                        /* Y los bordes se desvanecen, como en el monitor: si el
                           dibujo termina en una línea recta, lo que hay arriba
                           del wordmark es una foto pegada. Con la máscara la
                           casa se apoya en el papel. */
                        className="h-auto w-full [mask-image:radial-gradient(128%_112%_at_50%_40%,#000_56%,transparent_94%)]"
                      />
                    </button>
                  )}
                  <img
                    src={logoMalka}
                    alt="Malka"
                    /* El logo es latino en todos los idiomas: en hebreo también
                       arranca a la izquierda, como en la barra. */
                    className="h-12 w-auto self-start animate-fade-in-up [animation-delay:1250ms] [animation-duration:700ms] [animation-fill-mode:backwards]"
                  />
                  {/* El titular de la página es esta frase, no el wordmark:
                      el logo es una imagen y el h1 tiene que ser texto, que es
                      lo que leen Google y un lector de pantalla. */}
                  <h1 className="mt-7 max-w-xl animate-fade-in-up font-grotesk text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold leading-[1.1] tracking-tight text-ink [animation-delay:1400ms] [animation-duration:700ms] [animation-fill-mode:backwards]">
                    {t.ui.h1}
                  </h1>
                  <ul className="mt-7 flex animate-fade-in-up flex-col items-start gap-1.5 text-[0.68rem] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:text-[0.68rem] font-semibold uppercase tracking-label text-ink-soft [animation-delay:1520ms] [animation-fill-mode:backwards]">
                    {t.ui.datos.map((d, i) => (
                      <li key={d} className="flex items-center gap-3">
                        {i > 0 && <span className="hidden h-1 w-1 rounded-pill bg-ink-faint sm:block" />}
                        {/* bdi: la dirección es latina y en hebreo no se
                            tiene que desordenar con el texto de alrededor. */}
                        <bdi>{d}</bdi>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-9 flex animate-fade-in-up flex-wrap items-center gap-3 [animation-delay:1640ms] [animation-fill-mode:backwards]">
                    <LandingButton size="lg" icon={telefono ? 'forward' : 'chevronDown'} onClick={conocerLaCasa}>
                      {t.ui.conoce}
                    </LandingButton>
                    <LandingButton to="/register" variant="outline" size="lg">
                      {t.ui.entra}
                    </LandingButton>
                  </div>
                  {/* En la portada no hay barra, así que el idioma se elige acá. */}
                  <SelectorIdioma
                    idioma={pedido}
                    t={t}
                    className="mt-6 -ms-2 animate-fade-in-up [animation-delay:1760ms] [animation-fill-mode:backwards]"
                  />
                </section>
              ) : (
              <section
                key={p.id}
                id={p.id}
                data-piso={p.piso}
                data-zona={p.zona}
                /* En el teléfono no hay dibujo al costado ni franja arriba:
                   la sección es texto y ocupa lo que necesita. */
                className="flex min-h-[62vh] scroll-mt-16 flex-col justify-center py-14 md:min-h-screen md:scroll-mt-0 md:py-0 md:pt-24 md:pb-24 xl:pt-32 xl:pb-32"
              >
                {/* El nombre del espacio: es lo que ata el
                    texto con lo que la cámara está mirando. Sin esa etiqueta,
                    las dos columnas se leen como dos cosas separadas que
                    casualmente scrollean juntas. */}
                <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                  {t.secciones[p.id].kicker}
                </p>
                <h2
                  className={`mt-4 font-bold uppercase leading-[0.9] tracking-display ${
                    i === 0
                      ? 'text-[clamp(2.6rem,7vw,4.6rem)]'
                      : 'text-[clamp(2rem,5vw,3.2rem)]'
                  }`}
                >
                  {t.secciones[p.id].titulo}
                </h2>
                <p className="mt-6 text-2xl leading-snug sm:text-3xl">{t.secciones[p.id].entrada}</p>
                {t.secciones[p.id].texto && (
                  <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">{t.secciones[p.id].texto}</p>
                )}
                {/* Esto es Malka termina en la acción que acaba de nombrar:
                    si el texto dice que alcanza con anotarse, el botón va ahí. */}
                {p.id === 'quienes' && (
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <LandingButton to="/register">{t.ui.anotarme}</LandingButton>
                    <LandingButton to="/login" variant="outline">
                      {t.ui.ingresar}
                    </LandingButton>
                  </div>
                )}

                {/* Los espacios de la casa, en una lista corta. Antes cada uno
                    tenía su sección y la página se hacía interminable: nombrarlos
                    acá cuenta lo mismo y deja que el dibujo haga el resto. */}
                {p.conEspacios && (
                  <div className="hidden md:block">
                    <p className="mt-10 text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
                      {t.ui.tocaEspacio}
                    </p>
                    {/* Píldoras y no tarjetas: seis fichas con título y bajada
                        ocupaban media pantalla y pesaban más que el texto que
                        acompañan. Una fila de píldoras se lee de un vistazo,
                        deja claro cuál está elegida y es el mismo control que
                        va pegado abajo del dibujo en el teléfono. */}
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {espaciosEn(t).map((e) => (
                        <li key={e.zona}>
                          <PildoraEspacio
                            espacio={e}
                            elegido={manual?.zona === e.zona}
                            onClick={() => mirar(p.id, e)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.id === 'propuestas' && (
                  <>
                    <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                      {PROPUESTAS.map((icono) => (
                        <li key={icono} className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-primary/25 text-primary-700">
                            <IconoPropuesta nombre={icono} className="h-6 w-6" />
                          </span>
                          <span className="font-semibold text-ink">{t.propuestas[icono]}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-14 text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                      {t.ui.faq}
                    </p>
                    {/* La pregunta abierta se marca con el fondo, no con una
                        rayita al costado: la fila entera es el botón y se ve
                        elegida. La respuesta va en un panel con contorno, al
                        lado en pantallas grandes y abajo de la pregunta en el
                        teléfono. */}
                    <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <ul className="flex flex-col gap-1">
                        {t.preguntas.map((q, i) => {
                          const abierta = pregunta === i;
                          return (
                            <li key={q.pregunta}>
                              <button
                                type="button"
                                onClick={() => setPregunta(i)}
                                aria-pressed={abierta}
                                className={`w-full rounded-card px-4 py-3 text-start text-[0.95rem] leading-snug transition-colors duration-base focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25 ${
                                  abierta
                                    ? 'bg-primary/10 font-semibold text-primary-700'
                                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                                }`}
                              >
                                {q.pregunta}
                              </button>
                              {/* En un teléfono la respuesta va acá, pegada a la
                                  pregunta: la columna de al lado no existe y
                                  mandarla al final de la lista obliga a
                                  scrollear para leer lo que acabás de tocar. */}
                              {abierta && (
                                <p className="mt-2 animate-fade-in-up rounded-card border border-ink/10 bg-surface/70 px-4 py-3 leading-relaxed text-ink sm:hidden">
                                  {q.respuesta}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <div
                        key={`${idioma}-${pregunta}`}
                        className="hidden animate-fade-in-up self-start rounded-card border border-ink/10 bg-surface/70 p-6 sm:block"
                      >
                        <p className="text-xl leading-snug text-ink">{t.preguntas[pregunta].respuesta}</p>
                      </div>
                    </div>
                  </>
                )}


              </section>
              )
            )}

            {/* ---- Quiénes te reciben ---- */}
            <section
              id="staff"
              data-piso="terraza"
              data-zona="equipo"
              className="flex min-h-[62vh] scroll-mt-16 flex-col justify-center py-14 md:min-h-screen md:scroll-mt-0 md:py-0 md:pt-24 md:pb-24 xl:pt-32 xl:pb-32"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                {t.ui.staffKicker}
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                {t.ui.staffTitulo}
              </h2>
              <p className="mt-6 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                {t.ui.staffTexto}
              </p>

              <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {STAFF.map((persona) => (
                  <li key={persona.nombre} className="group">
                    {/* La foto arranca en verde de la casa y se pone a color
                        cuando la mirás. Es toda la interacción que pide una
                        ficha de equipo: que responda, no que haga un show. */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-primary-100">
                      <img
                        src={persona.foto}
                        alt={persona.nombre}
                        loading="lazy"
                        /* El tirado al verde sólo donde hay mouse: en un teléfono no hay
                            hover que lo devuelva a color, y quedarían cuatro
                            fotos apagadas para siempre. */
                        className="h-full w-full object-cover transition-all duration-cinematic ease-standard [@media(hover:hover)]:grayscale-[0.55] group-hover:scale-[1.04] group-hover:grayscale-0 motion-reduce:transition-none"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-primary/25 opacity-0 mix-blend-multiply transition-opacity duration-cinematic [@media(hover:hover)]:opacity-100 group-hover:opacity-0"
                      />
                    </div>
                    <p className="mt-3 font-semibold leading-tight text-ink transition-colors duration-base group-hover:text-primary-700">
                      {persona.nombre}
                    </p>
                    <p className="text-sm text-ink-muted">{t.roles[persona.rol]}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ---- Sumarse ---- */}
            {/* El cierre mira la casa entera, no la portada: `todo` es el
                encuadre exclusivo de la portada, y si otra sección lo pide, la
                portada vuelve a aparecer encima del texto. */}
            <section
              id="sumate"
              data-piso="todo"
              data-zona="ciudad"
              className="flex min-h-[62vh] scroll-mt-16 flex-col justify-center py-14 md:min-h-screen md:scroll-mt-0 md:py-0 md:pt-24 md:pb-24 xl:pt-32 xl:pb-32"
            >
              <h2 className="text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                {t.ui.sumateTitulo}
              </h2>
              <p className="mt-6 text-2xl leading-snug sm:text-3xl">
                {t.ui.sumateEntrada}
              </p>
              <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                {t.ui.sumateTexto}
              </p>

              <div className="mt-9">
                <LandingButton to="/register" size="lg">
                  {t.ui.entra}
                </LandingButton>
              </div>

              {/* Los datos de la casa, que es lo último que alguien busca antes
                  de venir. Sin formulario: el canal real es WhatsApp. */}
              {/* Cada dato es un link que abre afuera: el mapa, el WhatsApp, el
                  Instagram y el mail. En una pestaña nueva a propósito — quien
                  está por escribirnos no tiene por qué perder la página. */}
              <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-ink/10 pt-10 sm:grid-cols-2">
                {CONTACTO.map((c) => (
                  <div key={c.que} className="flex items-start gap-3">
                    {/* El ícono no decora: es lo que hace que la lista se lea de
                        un vistazo. En una grilla de seis datos, el rótulo en
                        versalita chica es lo último que mira el ojo. */}
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-ink/12 bg-surface/60 text-ink-soft">
                      <IconoPropuesta nombre={c.icono} className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                    <dt className="text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
                      {t.contacto[c.que]}
                    </dt>
                    <dd className="mt-1">
                      {c.href ? (
                        <a
                          href={c.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          /* Inline y no flex: cuando la dirección se parte en
                             dos renglones, la flechita tiene que seguir a la
                             última palabra, no quedarse flotando al final del
                             primero. */
                          className="group text-ink transition-colors duration-base hover:text-primary-700"
                        >
                          <bdi>{c.dato ?? t.contacto[c.datoDe]}</bdi>
                          {/* El espacio duro pega la flechita a la última
                              palabra: si no, cuando la dirección se parte en
                              dos renglones, la flecha se va sola al segundo. */}
                          <span
                            aria-hidden
                            className="inline-block text-ink-faint transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-700"
                          >
                            {'\u00A0↗'}
                          </span>
                        </a>
                      ) : (
                        <bdi className="text-ink">{c.dato ?? t.contacto[c.datoDe]}</bdi>
                      )}
                    </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
