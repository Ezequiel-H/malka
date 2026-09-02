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
     wordmark y la frase, centrados sobre la casa. Dos titulares compitiendo en
     la misma pantalla era exactamente el problema. */
  { id: 'entrada', piso: 'todo', zona: 'todo', portada: true },
  {
    id: 'intro',
    piso: 'todo',
    zona: 'fachada',
    kicker: 'Casa Malka · Comunidad Amijai',
    titulo: 'Esto es Malka',
    entrada: 'Una casa abierta donde siempre hay un mate esperándote.',
    texto:
      'Un espacio de reunión, intercambio y actividades para jóvenes judíos de 18 a 35 que buscan un lugar de pertenencia que los identifique.',
  },
  {
    id: 'puerta',
    piso: 'planta',
    zona: 'vereda',
    kicker: 'La puerta',
    titulo: 'Venite darling',
    entrada: 'Podés caer de lunes a viernes, entre las 14 y las 21.',
    texto:
      'No hace falta asociarse ni anotarse: se entra y ya. Eso sí, si es feriado o festividad puede que estemos cerrados o con horarios especiales, ¡así que chill!',
  },
  {
    id: 'salon',
    piso: 'planta',
    zona: 'mesa',
    kicker: 'Planta baja',
    titulo: 'El salón',
    entrada: 'Acá pasan las mejores ceremonias de Shabat.',
    texto:
      'Un salón que te recibe con diferentes propuestas: hablamos de Torá y también vivimos experiencias culinarias únicas de la mano de referentes de la gastronomía.',
  },
  {
    id: 'cocina',
    piso: 'planta',
    zona: 'cocina',
    kicker: 'Planta baja',
    titulo: 'La cocina',
    entrada: 'Experiencias culinarias únicas.',
    texto:
      'De la mano de referentes de la gastronomía, y también del que se anima a cocinar para todos. Lo que sale de acá termina siempre en la mesa larga o en el patio.',
  },
  {
    id: 'patio',
    piso: 'todo',
    zona: 'patio',
    kicker: 'Cruzando la casa',
    titulo: 'El fondo',
    entrada: 'Atrás se abre el patio, y el patio es otra casa.',
    texto:
      'Árboles, plantas, la pileta y el quincho. Cuando el clima acompaña, la casa entera se muda para acá.',
  },
  {
    id: 'quincho',
    piso: 'todo',
    zona: 'quincho',
    kicker: 'En el patio',
    titulo: 'El sueño del quincho',
    entrada: 'Cumplimos el sueño del quincho con parrilla.',
    texto:
      'Para comer rico mientras charlamos y debatimos. ¿Los temas? Un hermoso variadito que va desde judaísmo moderno hasta economía y emprendedurismo. Acá hay lugar para todo lo que sea aprendizaje y compartir ideas.',
  },
  {
    id: 'pileta',
    piso: 'todo',
    zona: 'pileta',
    kicker: 'En el patio',
    titulo: 'La pileta',
    entrada: 'Una pileta para disfrutar el verano.',
    texto:
      'Siempre hay un mate que te está esperando, un café para compartir y, cuando aprieta el calor, esto.',
  },
  {
    id: 'cowork',
    piso: 'primero',
    zona: 'cowork',
    kicker: 'Primer piso',
    titulo: 'El cowork',
    entrada: 'Trabajá durante la semana como en casa.',
    texto:
      'Queremos que te apropies del espacio: nosotros ponemos el wifi, el lugar y el café con cakes, vos traé tu compu y buena energía.',
  },
  {
    id: 'bano',
    piso: 'primero',
    zona: 'bano',
    kicker: 'Sauna Sessions',
    titulo: 'El sauna y el jacuzzi',
    entrada: 'Sí, la casa también tiene eso.',
    texto:
      'Un rato de calor y de charla lenta, que es otra forma de encontrarse. Cuándo cae la próxima session lo vas a ver en la agenda.',
  },
  {
    id: 'terraza',
    piso: 'terraza',
    zona: 'banda',
    kicker: 'Arriba de todo',
    titulo: 'La terraza',
    entrada: 'Nuestro lugar premium para frenar el tiempo.',
    texto:
      'Acá disfrutamos de encuentros, unplugged musicales, algún fueguito y nuevos vínculos. Y de mirar un ratito las estrellas.',
  },
  {
    id: 'suca',
    piso: 'terraza',
    zona: 'suca',
    kicker: 'Las festividades',
    titulo: 'La sucá',
    entrada: 'En Sucot se arma arriba y no se baja en toda la semana.',
    texto:
      'Cada festividad tiene su forma en la casa: las velas del viernes, la sucá de octubre, la januquiá en la ventana.',
  },
  {
    id: 'subsuelo',
    piso: 'subsuelo',
    zona: 'clase',
    kicker: 'Abajo de todo',
    titulo: 'La sala',
    entrada: 'Yoga, escritura, cine y lo que se te ocurra.',
    texto:
      'Practicamos talleres y también hay lugar para charlas, bootcamps y diferentes clases. Es el nivel más callado de la casa. Del otro lado entran los autos.',
  },
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
    document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          setActivo(e.target.dataset.piso);
          setZona(e.target.dataset.zona);
        }
      },
      /* La banda angosta del medio de la pantalla: así el piso cambia cuando la
         sección está siendo leída, y no cuando asoma por el borde. */
      { rootMargin: '-45% 0px -45% 0px' }
    );
    document.querySelectorAll('[data-piso]').forEach((n) => obs.observe(n));
    return () => obs.disconnect();
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

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* El dibujo: fijo al costado en escritorio, fijo arriba en mobile. */}
          <div className="sticky top-16 z-30 -mx-5 bg-surface-page/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-16 lg:z-auto lg:col-span-6 lg:mx-0 lg:flex lg:h-[calc(100vh-4rem)] lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <div
              className={`relative w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                enPortada ? 'lg:translate-x-1/2 lg:-translate-y-[3%] lg:scale-[0.94]' : ''
              }`}
            >
            <CasaDibujada
              activo={activo}
              zona={zona}
              className="mx-auto h-[36vh] w-auto max-w-full py-2 lg:h-auto lg:max-h-[calc(100vh-12rem)] lg:w-full lg:py-0"
            />

            </div>

            {/* La portada se reparte arriba y abajo de la casa: el wordmark
                corona y la frase apoya. Todo junto debajo dejaba media pantalla
                de crema vacío arriba, que es lo que se sentía. */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-3 hidden justify-center transition-opacity duration-700 lg:flex lg:translate-x-1/2 ${
                enPortada ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={logoMalka}
                alt="Malka"
                className="h-14 w-auto animate-fade-in-up [animation-delay:1250ms] [animation-duration:700ms] [animation-fill-mode:backwards]"
              />
            </div>

            {/* La portada, encima de la casa centrada. Se va cuando la casa se
                corre: a partir de ahí manda el texto de cada piso. */}
            <div
              /* La portada vive fuera del envoltorio que se transforma —si no,
                 el texto se achica y se mueve con la casa— y se corre al centro
                 por su cuenta, porque la columna ocupa media pantalla. */
              className={`pointer-events-none absolute inset-x-0 bottom-4 hidden flex-col items-center gap-5 text-center transition-opacity duration-700 lg:flex lg:translate-x-1/2 lg:gap-4 ${
                enPortada ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* El wordmark y la frase entran cuando la casa terminó de
                  armarse, no antes: si aparecen mientras el edificio todavía se
                  está montando, compiten con él y no se ve ninguno de los dos. */}
              <p className="max-w-xl animate-fade-in-up font-grotesk text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink [animation-delay:1400ms] [animation-duration:700ms] [animation-fill-mode:backwards]">
                El punto de encuentro para tu identidad judía.
              </p>

              {/* Los tres datos que decide cualquiera que llega: para quién,
                  cuándo y dónde. En la portada valen más que cualquier frase de
                  bienvenida. */}
              <ul className="flex animate-fade-in-up flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.68rem] font-semibold uppercase tracking-label text-ink-soft [animation-delay:1520ms] [animation-fill-mode:backwards]">
                {['18 a 35 años', 'Lunes a viernes, 14 a 21', '3 de Febrero 1325'].map((d, i) => (
                  <li key={d} className="flex items-center gap-3">
                    {i > 0 && <span className="h-1 w-1 rounded-pill bg-ink-faint" />}
                    {d}
                  </li>
                ))}
              </ul>

              <div className="pointer-events-auto mt-2 flex animate-fade-in-up flex-col items-center gap-5 [animation-delay:1640ms] [animation-fill-mode:backwards]">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <LandingButton size="lg" icon="chevronDown" onClick={bajar}>
                    Conocé la casa
                  </LandingButton>
                  <LandingButton to={user ? '/activities' : '/register'} variant="outline" size="lg">
                    {user ? 'Ver la agenda' : 'Entrá a tu casa'}
                  </LandingButton>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {SECCIONES.map((p, i) =>
              p.portada ? (
                <section
                  key={p.id}
                  id={p.id}
                  data-piso={p.piso}
                  data-zona={p.zona}
                  className="min-h-screen"
                  aria-hidden
                />
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


              </section>
              )
            )}

            {/* ---- Las preguntas, de frente ---- */}
            <section
              id="preguntas"
              data-piso="todo"
              data-zona="casa"
              className="flex min-h-[86vh] flex-col justify-center py-20"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                ¿Tenés más preguntas?
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                Es por acá
              </h2>

              <ul className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                {PREGUNTAS.map((p) => (
                  <li key={p.pregunta} className="flex gap-4">
                    {/* El iconito de línea es el mismo lenguaje que usa Malka
                        hoy en su sitio para las tres columnas de "cuándo, qué,
                        dónde". Acá cumple además una función: da entrada a la
                        respuesta, que es lo que se lee primero. */}
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-primary/25 text-primary-700">
                      <Icon name={p.icono} size="md" />
                    </span>
                    <div>
                      <p className="font-grotesk text-lg font-bold leading-tight tracking-tight text-primary-700">
                        {p.veredicto}
                      </p>
                      <p className="mt-1 font-semibold leading-snug text-ink">{p.pregunta}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.detalle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

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
      </main>
    </div>
  );
};

export default Casa;
