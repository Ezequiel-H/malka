import { useEffect, useState } from 'react';
import { Icon } from '../components/ui';
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
    espacios: [
      ['El salón', 'La mesa larga y las mejores ceremonias de Shabat.'],
      ['La cocina', 'Experiencias culinarias de la mano de referentes.'],
      ['El cowork', 'Wifi, escritorio y café con cakes toda la semana.'],
      ['La sala de abajo', 'Yoga, escritura, cine y lo que se te ocurra.'],
      ['La terraza', 'Unplugged, algún fueguito y la ciudad abajo.'],
      ['El fondo', 'Los árboles, la pileta y el sueño del quincho con parrilla.'],
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
    texto:
      'Un rato de calor y de charla lenta, que resultó ser otra forma de encontrarse. Cuándo cae la próxima session lo vas a ver en la agenda.',
  },
];

/* Las seis puertas de Malka, que ya son las suyas: están en su sitio desde
   siempre y son la mejor manera de decir qué se puede hacer acá sin escribir
   una lista de actividades que vence en una semana. */
const PROPUESTAS = [
  { icono: 'book', label: 'Judaísmo' },
  { icono: 'sparkles', label: 'Actividades' },
  { icono: 'coffee', label: 'Coworking' },
  { icono: 'chef', label: 'Asaditos' },
  { icono: 'leaf', label: 'Huerta' },
  { icono: 'music', label: 'Música' },
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
  { nombre: 'Sem. Mati Bomse', rol: 'Dirección' },
  { nombre: 'Sem. Brian Bruh', rol: 'Dirección' },
  { nombre: 'Tami Saban', rol: 'Asistente de Dirección' },
];

const iniciales = (nombre) =>
  nombre
    .replace(/^Sem\.\s*/, '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

const Casa = () => {
  const { user } = useAuth();
  const [activo, setActivo] = useState('todo');
  const [zona, setZona] = useState('todo');

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
      setActivo(mejor.dataset.piso);
      setZona(mejor.dataset.zona);
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

      <main className="relative">
        {/* La casa va de fondo y a sangre: sale de cuadro por arriba, por abajo
            y por los costados. Antes vivía adentro de una columna y se veía el
            recuadro del dibujo, que la convertía en una lámina pegada al
            costado del texto en vez de en el lugar donde pasa todo. */}
        <div className="pointer-events-none sticky top-0 h-screen overflow-hidden">
          <CasaDibujada
            activo={activo}
            zona={zona}
            anclaX={0.62}
            ajuste="xMidYMid slice"
            className="h-full w-full"
          />
          {/* El velo que hace legible el texto sin tapar la casa: opaco del lado
              de la lectura y transparente del otro. */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-page via-surface-page/90 to-surface-page/96 lg:bg-gradient-to-r lg:from-surface-page lg:from-30% lg:via-surface-page/92 lg:via-58% lg:to-transparent" />
        </div>

        {/* El texto va encima del fondo pegado, no al lado. */}
        <div className="relative -mt-[100vh]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="lg:w-[46%]">
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
                  className="flex min-h-[92vh] flex-col justify-center pb-14 pt-[42vh] lg:min-h-[88vh] lg:py-20"
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
                className="flex min-h-[92vh] flex-col justify-center pb-14 pt-[42vh] lg:min-h-[88vh] lg:py-20"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
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
                  <ul className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {p.espacios.map(([donde, que]) => (
                      <li key={donde} className="border-t border-ink/10 pt-3">
                        <p className="font-semibold leading-tight text-ink">{donde}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{que}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {p.id === 'propuestas' && (
                  <>
                    <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                      {PROPUESTAS.map((c) => (
                        <li key={c.label} className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-primary/25 text-primary-700">
                            <Icon name={c.icono} size="sm" />
                          </span>
                          <span className="font-semibold text-ink">{c.label}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-12 text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                      ¿Tenés más preguntas? Es por acá
                    </p>
                    <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                      {PREGUNTAS.map((q) => (
                        <li key={q.pregunta}>
                          <p className="font-grotesk font-bold leading-tight tracking-tight text-primary-700">
                            {q.veredicto}
                          </p>
                          <p className="mt-1 font-semibold leading-snug text-ink">{q.pregunta}</p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{q.detalle}</p>
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
              className="flex min-h-[86vh] flex-col justify-center py-20"
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
              data-piso="todo"
              data-zona="ciudad"
              className="flex min-h-[86vh] flex-col justify-center py-20"
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
              <dl className="mt-14 grid gap-x-8 gap-y-6 border-t border-ink/10 pt-10 sm:grid-cols-2">
                {[
                  ['Dónde', '3 de Febrero 1325, CABA'],
                  ['Cuándo', 'Lunes a viernes, de 14 a 21'],
                  ['WhatsApp', '+54 9 11 3440-5730'],
                  ['Instagram', '@somosmalka'],
                ].map(([que, dato]) => (
                  <div key={que}>
                    <dt className="text-[0.66rem] font-semibold uppercase tracking-label text-ink-faint">
                      {que}
                    </dt>
                    <dd className="mt-1 text-ink">{dato}</dd>
                  </div>
                ))}
              </dl>
            </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Casa;
