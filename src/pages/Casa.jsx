import { useEffect, useState } from 'react';
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
    zona: 'casa',
    kicker: 'Casa Malka · Comunidad Amijai',
    titulo: 'Es una casa.',
    entrada: 'Con subsuelo, dos plantas, terraza y la puerta abierta.',
    texto:
      'Un lugar para jóvenes judíos de 18 a 35 en 3 de Febrero 1325. Abre de lunes a viernes de 14 a 21, no hace falta ser socio y no hay que anotarse para venir.',
  },
  {
    id: 'puerta',
    piso: 'planta',
    zona: 'puerta',
    kicker: 'La puerta',
    titulo: 'Se entra sin avisar',
    entrada: 'De lunes a viernes, de 14 a 21.',
    texto:
      'No hay que ser socio, no hay que anotarse y no hace falta saber nada. Alguien del staff te va a estar esperando con una sonrisa: son cuatro y están siempre.',
  },
  {
    id: 'salon',
    piso: 'planta',
    zona: 'mesa',
    kicker: 'El salón',
    titulo: 'La mesa larga',
    entrada: 'Acá se hace Shabat y pasan las ceremonias de la casa.',
    texto:
      'Se pone la mesa, se encienden las velas y se canta. Venís sin traer nada; cuándo cae la próxima lo vas a ver en la agenda, adentro.',
  },
  {
    id: 'cocina',
    piso: 'planta',
    zona: 'cocina',
    kicker: 'La cocina y la parrilla',
    titulo: 'Se come y se discute',
    entrada: 'Asaditos, experiencias culinarias y sobremesas largas.',
    texto:
      'Los temas van de judaísmo moderno a economía y emprendedurismo, y siguen hasta que alguien apaga la luz. Acá hay lugar para todo lo que sea aprender y compartir.',
  },
  {
    id: 'cowork',
    piso: 'primero',
    zona: 'cowork',
    kicker: 'El cowork',
    titulo: 'Un martes cualquiera',
    entrada: 'Traés la compu y te sentás.',
    texto:
      'Wifi, escritorio y café con cakes. Es el piso mínimo de Malka: no hace falta que haya una actividad para que vengas, y de hecho así es como la mayoría empieza a venir.',
  },
  {
    id: 'bano',
    piso: 'primero',
    zona: 'bano',
    kicker: 'Sauna Sessions',
    titulo: 'El sauna y el jacuzzi',
    entrada: 'Sí, la casa también tiene eso.',
    texto:
      'Un rato de calor y de charla lenta, que es otra forma de encontrarse. Las sessions se anuncian en la agenda.',
  },
  {
    id: 'terraza',
    piso: 'terraza',
    zona: 'banda',
    kicker: 'La terraza',
    titulo: 'La música arriba',
    entrada: 'Unplugged, algún fueguito y la ciudad abajo.',
    texto:
      'El lugar premium para frenar el tiempo, tocar hasta cualquier hora y mirar un rato las estrellas.',
  },
  {
    id: 'suca',
    piso: 'terraza',
    zona: 'suca',
    kicker: 'Las festividades',
    titulo: 'La sucá',
    entrada: 'En Sucot se arma arriba y no se baja por una semana.',
    texto:
      'Cada festividad tiene su forma en la casa: las velas del viernes, la sucá de octubre, la januquiá en la ventana. Se vive el calendario, no se lo explica.',
  },
  {
    id: 'subsuelo',
    piso: 'subsuelo',
    zona: 'clase',
    kicker: 'La sala de abajo',
    titulo: 'Yoga y movimiento',
    entrada: 'Las clases que piden piso y silencio.',
    texto:
      'Yoga, escritura, cine y talleres que cambian todos los meses. El nivel más callado de la casa, y el que más se usa a la tarde.',
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
  { veredicto: 'No', pregunta: '¿Hay que ser socio?', detalle: 'Ni socio ni nada. Se entra y ya.' },
  { veredicto: 'No', pregunta: '¿Hay que anotarse para venir?', detalle: 'Para las actividades sí, para caer al cowork no.' },
  { veredicto: 'No', pregunta: '¿Tengo que saber de judaísmo?', detalle: 'Se entra sepas lo que sepas y creas lo que creas.' },
  { veredicto: 'Sí', pregunta: '¿Puedo venir solo?', detalle: 'La mayoría empieza así. Alguien te va a estar esperando.' },
  { veredicto: 'Sí', pregunta: '¿Puedo proponer una actividad?', detalle: 'Nos encantaría. Traé la idea y la armamos.' },
  { veredicto: '18 a 35', pregunta: '¿Qué edad hay que tener?', detalle: 'Es la franja de la casa. Movida judía y pluralista.' },
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
    <div className="min-h-screen bg-surface-page font-grotesk text-ink">
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
                enPortada ? 'lg:translate-x-1/2 lg:-translate-y-[22%] lg:scale-[0.6]' : ''
              }`}
            >
            <CasaDibujada
              activo={activo}
              zona={zona}
              className="mx-auto h-[36vh] w-auto max-w-full py-2 lg:h-auto lg:max-h-[calc(100vh-12rem)] lg:w-full lg:py-0"
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
              <img
                src={logoMalka}
                alt="Malka"
                className="h-14 w-auto animate-fade-in-up [animation-delay:1250ms] [animation-duration:700ms] [animation-fill-mode:backwards]"
              />
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
                Antes de venir
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                Las dudas, cortas
              </h2>

              <ul className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                {PREGUNTAS.map((p) => (
                  <li key={p.pregunta}>
                    {/* El veredicto primero y grande: lo que frena a alguien de
                        venir es la duda, y una duda se despeja mostrando el
                        "no", no escondiéndolo detrás de un clic. */}
                    <p className="font-grotesk text-2xl font-bold leading-none tracking-tight text-primary-700">
                      {p.veredicto}
                    </p>
                    <p className="mt-2 font-semibold leading-snug text-ink">{p.pregunta}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.detalle}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ---- Quiénes te reciben ---- */}
            <section
              id="staff"
              data-piso="planta"
              data-zona="puerta"
              className="flex min-h-[86vh] flex-col justify-center py-20"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
                Quiénes te reciben
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                Son cuatro y están siempre
              </h2>
              <p className="mt-6 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                Alguien del staff te va a estar esperando con una sonrisa. Si es tu primera vez,
                buscá a cualquiera de ellos y decíselo: de eso se trata la casa.
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
              data-zona="casa"
              className="flex min-h-[86vh] flex-col justify-center py-20"
            >
              <h2 className="text-[clamp(2rem,4.4vw,3rem)] font-bold uppercase leading-[0.95] tracking-display">
                {user ? 'Ya sos de la casa' : 'Sumate'}
              </h2>
              <p className="mt-6 text-2xl leading-snug sm:text-3xl">
                {user ? 'La agenda te está esperando.' : 'Te registrás y ves la agenda.'}
              </p>
              <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                {user
                  ? 'Todo lo que pasa cada semana está adentro, y te inscribís en un toque.'
                  : 'Adentro está todo lo que pasa cada semana y te inscribís en un toque. Para caer al cowork un martes no hace falta ni eso: la puerta está abierta de 14 a 21.'}
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
