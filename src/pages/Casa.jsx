import { useEffect, useRef, useState } from 'react';
import IconoPropuesta from '../components/landing/IconosPropuestas';
import Grano from '../components/landing/Grano';
import { useAuth } from '../contexts/AuthContext';
import CasaDibujada from '../components/landing/casa/CasaDibujada';
import LandingButton from '../components/landing/LandingButton';
import logoMalka from '../assets/logo-malka-positivo.png';

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
const SECCIONES = [
  /* La portada no lleva texto en la columna: el texto de la portada es el
     wordmark y la frase. Dos titulares en la misma pantalla era el problema. */
  { id: 'entrada', piso: 'todo', zona: 'todo', portada: true },
  {
    id: 'quienes',
    piso: 'todo',
    zona: 'casa',
    kicker: 'Casa Malka · Comunidad Amijai',
    titulo: 'Esto es Malka',
    entrada: 'Una casa abierta donde siempre hay un mate esperándote.',
    texto:
      'Un espacio de reunión, intercambio y actividades para jóvenes judíos de 18 a 35 que buscan un lugar de pertenencia que los identifique. Podés caer de lunes a viernes, entre las 14 y las 21: no hace falta asociarse ni anotarse.',
    /* Cada espacio lleva su encuadre: tocarlo lleva la cámara ahí. Es la forma
       más directa de mostrar una casa —dejar que el otro elija por dónde
       empieza— y de paso convierte la lista en el índice del dibujo. */
    espacios: [
      { nombre: 'El salón', que: 'La mesa larga y las mejores ceremonias de Shabat.', zona: 'mesa', piso: 'planta' },
      { nombre: 'La cocina', que: 'Experiencias culinarias de la mano de referentes.', zona: 'cocina', piso: 'planta' },
      { nombre: 'El cowork', que: 'Wifi, escritorio y café con cakes toda la semana.', zona: 'cowork', piso: 'primero' },
      { nombre: 'La sala de abajo', que: 'Yoga, escritura, cine y lo que se te ocurra.', zona: 'clase', piso: 'subsuelo' },
      { nombre: 'La terraza', que: 'Unplugged, algún fueguito y la ciudad abajo.', zona: 'banda', piso: 'terraza' },
      { nombre: 'El fondo', que: 'Los árboles, la pileta y el sueño del quincho.', zona: 'parrilla', piso: 'todo' },
    ],
  },
  {
    id: 'propuestas',
    piso: 'planta',
    zona: 'mesa',
    kicker: 'Muchas puertas',
    titulo: 'Lo que se puede hacer acá',
    entrada: 'Cada uno vive su propio judaísmo.',
    texto:
      'Por eso Malka tiene muchas puertas, y cada una te lleva a experiencias sociales, culturales y espirituales distintas. La agenda cambia todas las semanas y vive adentro.',
  },
  {
    id: 'sauna',
    piso: 'primero',
    zona: 'bano',
    kicker: 'Sauna Sessions',
    titulo: 'Sí, también hay sauna',
    entrada: 'Y jacuzzi. La casa tiene esas cosas.',
    texto: 'Cuándo cae la próxima session, en la agenda.',
  },
];

/* Las seis puertas de Malka, que ya son las suyas: están en su sitio desde
   siempre y son la mejor manera de decir qué se puede hacer acá sin escribir
   una lista de actividades que vence en una semana. */
const PROPUESTAS = [
  { icono: 'judaismo', label: 'Judaísmo' },
  { icono: 'actividades', label: 'Actividades' },
  { icono: 'coworking', label: 'Coworking' },
  { icono: 'asaditos', label: 'Asaditos' },
  { icono: 'huerta', label: 'Huerta' },
  { icono: 'musica', label: 'Música' },
];

/**
 * Las preguntas, contestadas de frente.
 *
 * El sitio actual tiene un acordeón de ocho preguntas que hay que abrir de a
 * una. Acá la respuesta está a la vista y es lo primero que se lee: lo que
 * frena a alguien de venir es la duda —¿tengo que ser socio?, ¿tengo que
 * saber?— y una duda se despeja mostrando el "no", no escondiéndolo detrás de
 * un clic.
 */
const PREGUNTAS = [
  {
    icono: 'user',
    veredicto: 'No hace falta',
    pregunta: '¿Necesito ser socio?',
    detalle: 'No hace falta asociarte para nuestras actividades.',
  },
  {
    icono: 'addToCalendar',
    veredicto: 'Sólo a veces',
    pregunta: '¿Tengo que anotarme?',
    detalle: 'Para venir a malkear, no. Para algunas actividades sí: leé bien el form.',
  },
  {
    icono: 'book',
    veredicto: 'Nada',
    pregunta: '¿Cuánto tengo que saber?',
    detalle: 'Nuestra movida es judía y pluralista, abierta a distintas miradas y experiencias.',
  },
  {
    icono: 'users',
    veredicto: 'Obvio',
    pregunta: '¿Puedo venir solo?',
    detalle: 'Charlá con la pipol que viene por acá. Acá casi todo se puede.',
  },
  {
    icono: 'idea',
    veredicto: '¡Obvio!',
    pregunta: '¿Puedo proponer algo?',
    detalle: 'Nos encantaría escuchar ideas que sumen a la comunidad. Contanos.',
  },
  {
    icono: 'coffee',
    veredicto: 'Casi siempre no',
    pregunta: '¿Hay que poner plata?',
    detalle: 'Algunas actividades tienen un costo para cubrir materiales. Siempre te avisamos antes.',
  },
];

/* Los cuatro que te reciben. Las fotos van acá cuando Malka las mande; hasta
   entonces la ficha muestra las iniciales, que es más honesto que una foto de
   banco de imágenes. */
const STAFF = [
  { nombre: 'Wally Liebhaber', rol: 'Dirección' },
  { nombre: 'Rab Mati Bomse', rol: 'Dirección' },
  { nombre: 'Sem. Brian Bruh', rol: 'Dirección' },
  { nombre: 'Caro Weber', rol: 'Asistente de Dirección' },
];

const iniciales = (nombre) =>
  nombre
    .replace(/^Sem\.\s*/, '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

/* Los datos de la casa. Los que se pueden abrir, se abren. */
const CONTACTO = [
  {
    que: 'Dónde',
    dato: '3 de Febrero 1325, CABA',
    href: 'https://maps.google.com/?q=3+de+Febrero+1325,+CABA',
  },
  { que: 'Cuándo', dato: 'Lunes a viernes, de 14 a 21' },
  { que: 'WhatsApp', dato: '+54 9 11 3440-5730', href: 'https://wa.me/5491134405730' },
  { que: 'Instagram', dato: '@somosmalka', href: 'https://www.instagram.com/somosmalka/' },
  { que: 'Mail', dato: 'malka@casamalka.org', href: 'mailto:malka@casamalka.org' },
  { que: 'Creada por', dato: 'Comunidad Amijai', href: 'https://amijai.org/' },
];

const INDICE = [
  { id: 'quienes', label: 'Quiénes somos' },
  { id: 'propuestas', label: 'Propuestas' },
  { id: 'sauna', label: 'Sauna Sessions' },
  { id: 'staff', label: 'El equipo' },
  { id: 'sumate', label: 'Sumate' },
];

const Casa = () => {
  const { user } = useAuth();
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
  const enPortada = zona === 'todo';

  /* El botón de la portada no navega: baja. Con `smooth` lo maneja el
     navegador, así que la cámara —que sólo mira en qué sección estás— la
     acompaña sola. */
  const bajar = () => {
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
  }, []);

  return (
    <div className="relative min-h-screen bg-surface-page font-grotesk text-ink">
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
          enPortada
            ? 'pointer-events-none -translate-y-3 border-transparent opacity-0'
            : 'translate-y-0 border-ink/10 opacity-100'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <img src={logoMalka} alt="Malka" className="h-6 w-auto shrink-0" />
          {/* Con sesión iniciada, la barra deja de ofrecer lo que ya tenés: en
              vez de "registrate" te lleva adentro, que es a lo que venías. */}
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <LandingButton to="/dashboard" size="sm" className="whitespace-nowrap">
                Ir a mi cuenta
              </LandingButton>
            ) : (
              <>
                <LandingButton
                  to="/login"
                  variant="outline"
                  size="sm"
                  icon={null}
                  className="hidden whitespace-nowrap sm:inline-flex"
                >
                  Iniciar sesión
                </LandingButton>
                <LandingButton to="/register" size="sm" className="whitespace-nowrap">
                  Registrate
                </LandingButton>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* El índice del recorrido, contra el borde. Con seis secciones y una
          casa que cambia de encuadre, lo que faltaba para entender el flujo era
          saber dónde estás parado y cuánto falta: eso lo resuelve una lista de
          seis renglones, no más animación. */}
      <nav
        aria-label="Secciones"
        className={`fixed right-7 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 transition-opacity duration-500 xl:flex ${
          enPortada ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {INDICE.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="group flex flex-row-reverse items-center gap-3"
          >
            {/* Va contra el borde derecho: es el único costado que el dibujo
                nunca invade, y ahí el índice se lee sin pelearse con la casa. */}
            <span
              className={`h-px transition-all duration-500 ${
                seccion === i.id ? 'w-8 bg-ink' : 'w-4 bg-ink/25 group-hover:w-6 group-hover:bg-ink/50'
              }`}
            />
            <span
              className={`text-[0.62rem] font-semibold uppercase tracking-label transition-all duration-300 ${
                seccion === i.id
                  ? 'text-ink opacity-100'
                  : 'text-ink-faint opacity-0 group-hover:opacity-100'
              }`}
            >
              {i.label}
            </span>
          </a>
        ))}
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* El dibujo: fijo al costado en escritorio, fijo arriba en mobile. */}
          <div className="sticky top-16 z-30 -mx-5 bg-surface-page/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-16 lg:z-auto lg:col-span-6 lg:mx-0 lg:flex lg:h-[calc(100vh-4rem)] lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
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
              className="mx-auto h-[38vh] w-auto max-w-none py-2 lg:h-auto lg:max-h-[calc(100vh-5rem)] lg:w-[118%] lg:-ml-[18%] lg:py-0 [mask-image:radial-gradient(125%_105%_at_54%_46%,#000_62%,transparent_100%)]"
            />

            </div>

                      </div>

          <div className="lg:col-span-6">
            {SECCIONES.map((p, i) =>
              p.portada ? (
                /* La portada es la primera sección de la columna, no una capa
                   flotando encima: así entra y sale con el scroll como todo lo
                   demás y no hay ninguna coreografía que sincronizar. */
                <section
                  key={p.id}
                  id={p.id}
                  data-piso={p.piso}
                  data-zona={p.zona}
                  className="flex min-h-[92vh] flex-col justify-center pb-16 pt-[42vh] lg:min-h-screen lg:py-32"
                >
                  <img
                    src={logoMalka}
                    alt="Malka"
                    className="h-12 w-auto self-start animate-fade-in-up [animation-delay:1250ms] [animation-duration:700ms] [animation-fill-mode:backwards]"
                  />
                  <p className="mt-7 max-w-xl animate-fade-in-up font-grotesk text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold leading-[1.1] tracking-tight text-ink [animation-delay:1400ms] [animation-duration:700ms] [animation-fill-mode:backwards]">
                    El punto de encuentro para tu identidad judía.
                  </p>
                  <ul className="mt-7 flex animate-fade-in-up flex-wrap items-center gap-x-3 gap-y-2 text-[0.68rem] font-semibold uppercase tracking-label text-ink-soft [animation-delay:1520ms] [animation-fill-mode:backwards]">
                    {['18 a 35 años', 'Lunes a viernes, 14 a 21', '3 de Febrero 1325'].map((d, i) => (
                      <li key={d} className="flex items-center gap-3">
                        {i > 0 && <span className="h-1 w-1 rounded-pill bg-ink-faint" />}
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-9 flex animate-fade-in-up flex-wrap items-center gap-3 [animation-delay:1640ms] [animation-fill-mode:backwards]">
                    <LandingButton size="lg" icon="chevronDown" onClick={bajar}>
                      Conocé la casa
                    </LandingButton>
                    <LandingButton to={user ? '/activities' : '/register'} variant="outline" size="lg">
                      {user ? 'Ver la agenda' : 'Entrá a tu casa'}
                    </LandingButton>
                  </div>
                </section>
              ) : (
              <section
                key={p.id}
                id={p.id}
                data-piso={p.piso}
                data-zona={p.zona}
                /* En mobile el dibujo está pegado arriba, así que el texto arranca
                   debajo de él: sin este colchón, el título de cada sección
                   nace tapado. En escritorio el dibujo está al costado y el
                   colchón sobra. */
                className="flex min-h-[92vh] flex-col justify-center pb-16 pt-[42vh] lg:min-h-screen lg:py-32"
              >
                {/* El nombre del espacio, con su filete: es lo que ata el
                    texto con lo que la cámara está mirando. Sin esa etiqueta,
                    las dos columnas se leen como dos cosas separadas que
                    casualmente scrollean juntas. */}
                <p className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                  <span className="h-px w-8 bg-primary/50" />
                  {p.kicker}
                </p>
                <h2
                  className={`mt-4 font-bold uppercase leading-[0.9] tracking-display ${
                    i === 0
                      ? 'text-[clamp(2.6rem,7vw,4.6rem)]'
                      : 'text-[clamp(2rem,5vw,3.2rem)]'
                  }`}
                >
                  {p.titulo}
                </h2>
                <p className="mt-6 text-2xl leading-snug sm:text-3xl">{p.entrada}</p>
                <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">{p.texto}</p>

                {/* Los espacios de la casa, en una lista corta. Antes cada uno
                    tenía su sección y la página se hacía interminable: nombrarlos
                    acá cuenta lo mismo y deja que el dibujo haga el resto. */}
                {p.espacios && (
                  <>
                    <p className="mt-10 text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
                      Tocá un espacio y la casa te lo muestra
                    </p>
                    <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
                      {p.espacios.map((e) => {
                        const elegido = manual?.zona === e.zona;
                        return (
                          <li key={e.nombre}>
                            <button
                              type="button"
                              onClick={() => mirar(p.id, e)}
                              className={`group w-full border-t py-4 text-left transition-colors duration-base ${
                                elegido ? 'border-primary/60' : 'border-ink/10 hover:border-primary/40'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`font-semibold leading-tight transition-colors duration-base ${
                                    elegido ? 'text-primary-700' : 'text-ink'
                                  }`}
                                >
                                  {e.nombre}
                                </span>
                                <span
                                  className={`h-1.5 w-1.5 rounded-pill transition-all duration-base ${
                                    elegido ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/40'
                                  }`}
                                />
                              </span>
                              <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                                {e.que}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {p.id === 'propuestas' && (
                  <>
                    <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                      {PROPUESTAS.map((c) => (
                        <li key={c.label} className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-primary/25 text-primary-700">
                            <IconoPropuesta nombre={c.icono} className="h-6 w-6" />
                          </span>
                          <span className="font-semibold text-ink">{c.label}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Las preguntas, como una lista de filas y no como una
                        grilla de bloques sueltos: la pregunta a la izquierda y
                        la respuesta a la derecha, separadas por un filete. Es la
                        forma en la que uno lee una lista de dudas —de arriba
                        hacia abajo, saltando a la que le importa— y no seis
                        párrafos en dos columnas. */}
                    <p className="mt-14 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                      <span className="h-px w-8 bg-primary/50" />
                      Preguntas frecuentes
                    </p>
                    <ul className="mt-4">
                      {PREGUNTAS.map((q) => (
                        <li
                          key={q.pregunta}
                          className="grid gap-x-8 gap-y-1 border-b border-ink/10 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
                        >
                          <p className="font-semibold leading-snug text-ink">{q.pregunta}</p>
                          <div>
                            <p className="font-grotesk font-bold leading-tight tracking-tight text-primary-700">
                              {q.veredicto}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{q.detalle}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
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
              className="flex min-h-[86vh] flex-col justify-center py-24 lg:min-h-screen lg:py-32"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                Quiénes te reciben
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                Te esperamos con una sonrisa
              </h2>
              <p className="mt-6 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                Alguien de nuestro staff te va a estar esperando. Si es tu primera vez, decíselo:
                de eso se trata. A la mayoría los vas a encontrar arriba, en la terraza, cuando hay
                música.
              </p>

              <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {STAFF.map((persona) => (
                  <li key={persona.nombre}>
                    <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-card bg-primary-100">
                      <span className="font-grotesk text-2xl font-bold tracking-tight text-primary-700">
                        {iniciales(persona.nombre)}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold leading-tight text-ink">{persona.nombre}</p>
                    <p className="text-sm text-ink-muted">{persona.rol}</p>
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
              className="flex min-h-[86vh] flex-col justify-center py-24 lg:min-h-screen lg:py-32"
            >
              <h2 className="text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                {user ? 'Ya sos de la casa' : 'Vení a conocer Malka'}
              </h2>
              <p className="mt-6 text-2xl leading-snug sm:text-3xl">
                {user
                  ? 'La agenda te está esperando.'
                  : 'Te esperamos para que abras la puerta que elijas.'}
              </p>
              <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                {user
                  ? 'Todo lo que pasa cada semana está adentro, y te inscribís en un toque.'
                  : 'La agenda con todas las actividades vive adentro, y desde ahí mismo te inscribís. Para venir a malkear un martes no hace falta ni eso: la puerta está abierta de 14 a 21.'}
              </p>

              <div className="mt-9">
                <LandingButton to={user ? '/activities' : '/register'} size="lg">
                  {user ? 'Ver la agenda' : 'Entrá a tu casa'}
                </LandingButton>
              </div>

              {/* Los datos de la casa, que es lo último que alguien busca antes
                  de venir. Sin formulario: el canal real es WhatsApp. */}
              {/* Cada dato es un link que abre afuera: el mapa, el WhatsApp, el
                  Instagram y el mail. En una pestaña nueva a propósito — quien
                  está por escribirnos no tiene por qué perder la página. */}
              <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-ink/10 pt-10 sm:grid-cols-2">
                {CONTACTO.map((c) => (
                  <div key={c.que}>
                    <dt className="text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
                      {c.que}
                    </dt>
                    <dd className="mt-1">
                      {c.href ? (
                        <a
                          href={c.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group inline-flex items-center gap-2 text-ink transition-colors duration-base hover:text-primary-700"
                        >
                          {c.dato}
                          <span
                            aria-hidden
                            className="text-ink-faint transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-700"
                          >
                            ↗
                          </span>
                        </a>
                      ) : (
                        <span className="text-ink">{c.dato}</span>
                      )}
                    </dd>
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

export default Casa;
