import { useEffect, useRef, useState } from 'react';
import CasaDibujada from '../components/landing/casa/CasaDibujada';
import LandingButton from '../components/landing/LandingButton';
import logoMalka from '../assets/logo-malka-positivo.png';
import { quiereQuietud } from '../components/landing/scrollFx';

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
  {
    id: 'entrada',
    piso: 'todo',
    zona: 'todo',
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

const Casa = () => {
  const [activo, setActivo] = useState('todo');
  const columnaRef = useRef(null);
  const heroRef = useRef(null);
  const textoRef = useRef(null);

  /**
   * La portada: la casa arranca centrada, con el wordmark y la frase, y se
   * corre a su columna cuando empezás a bajar.
   *
   * El desplazamiento es una función del scroll —igual que la cámara— así que
   * la casa acompaña el dedo en vez de animarse sola. Y no hay dos casas: es la
   * misma, corriéndose. Dibujar una para la portada y otra para el recorrido
   * habría significado un salto en el medio.
   */
  useEffect(() => {
    const columna = columnaRef.current;
    const hero = heroRef.current;
    const texto = textoRef.current;
    if (!columna || !hero || !texto) return undefined;

    const suave = (t) => t * t * (3 - 2 * t);
    let pedido = null;

    const pintar = () => {
      pedido = null;
      const recorrido = window.innerHeight * 0.75;
      const p = Math.min(1, Math.max(0, window.scrollY / recorrido));
      const e = suave(p);
      const ancho = window.innerWidth >= 1024;

      /* Además de correrse, en la portada la casa sube un poco: es lo que deja
         el hueco para el wordmark y la frase sin achicar el dibujo del resto de
         la página. */
      /* En la portada la casa se corre al centro, sube y se achica un poco: el
         hueco que deja abajo es donde entran el wordmark y la frase. Al bajar,
         los tres valores vuelven a cero y la casa queda en su columna. */
      columna.style.transform = ancho
        ? `translate(${(1 - e) * 50}%, ${(1 - e) * -13}%) scale(${1 - (1 - e) * 0.08})`
        : '';
      hero.style.opacity = `${Math.max(0, 1 - p * 1.7)}`;
      hero.style.pointerEvents = p > 0.4 ? 'none' : 'auto';
      texto.style.opacity = ancho ? `${e}` : '1';
    };

    if (quiereQuietud()) {
      columna.style.transform = '';
      hero.style.opacity = '0';
      texto.style.opacity = '1';
      return undefined;
    }

    const alScrollear = () => {
      if (pedido == null) pedido = requestAnimationFrame(pintar);
    };
    pintar();
    window.addEventListener('scroll', alScrollear, { passive: true });
    window.addEventListener('resize', alScrollear);
    return () => {
      if (pedido != null) cancelAnimationFrame(pedido);
      window.removeEventListener('scroll', alScrollear);
      window.removeEventListener('resize', alScrollear);
    };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setActivo(e.target.dataset.piso);
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
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-surface-page/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <img src={logoMalka} alt="Malka" className="h-6 w-auto shrink-0" />
          <div className="ml-auto flex items-center gap-3">
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
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* El dibujo: fijo al costado en escritorio, fijo arriba en mobile. */}
          <div
            ref={columnaRef}
            className="sticky top-16 z-30 -mx-5 bg-surface-page/95 px-5 backdrop-blur will-change-transform sm:-mx-8 sm:px-8 lg:top-16 lg:z-auto lg:col-span-6 lg:mx-0 lg:flex lg:h-[calc(100vh-4rem)] lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
          >
            <CasaDibujada
              activo={activo}
              className="mx-auto h-[36vh] w-auto max-w-full py-2 lg:h-auto lg:max-h-[calc(100vh-12rem)] lg:w-full lg:py-0"
            />

            {/* La portada, encima de la casa centrada. Se va cuando la casa se
                corre: a partir de ahí manda el texto de cada piso. */}
            <div
              ref={heroRef}
              className="pointer-events-none absolute inset-x-0 bottom-0 hidden flex-col items-center gap-5 text-center lg:flex"
            >
              {/* El wordmark y la frase entran cuando la casa terminó de
                  armarse, no antes: si aparecen mientras el edificio todavía se
                  está montando, compiten con él y no se ve ninguno de los dos. */}
              <img
                src={logoMalka}
                alt="Malka"
                className="h-11 w-auto animate-fade-in-up [animation-delay:1250ms] [animation-duration:700ms] [animation-fill-mode:backwards]"
              />
              <p className="max-w-lg animate-fade-in-up font-grotesk text-[1.6rem] font-semibold leading-tight tracking-tight text-ink [animation-delay:1420ms] [animation-duration:700ms] [animation-fill-mode:backwards]">
                El punto de encuentro para tu identidad judía.
              </p>
              <span className="flex animate-fade-in-up items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-label text-ink-muted [animation-delay:1620ms] [animation-fill-mode:backwards]">
                Bajá y entrá a la casa
                <span className="h-px w-10 origin-left animate-rule-draw bg-ink-faint [animation-delay:1800ms]" />
              </span>
            </div>
          </div>

          <div ref={textoRef} className="lg:col-span-6">
            {SECCIONES.map((p, i) => (
              <section
                key={p.id}
                id={p.id}
                data-piso={p.piso}
                data-zona={p.zona}
                /* En mobile el dibujo está pegado arriba, así que el texto arranca
                   debajo de él: sin este colchón, el título de cada sección
                   nace tapado. En escritorio el dibujo está al costado y el
                   colchón sobra. */
                className="flex min-h-screen flex-col justify-center border-t border-ink/10 pb-16 pt-[44vh] first:border-t-0 lg:min-h-screen lg:py-24"
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

                {i === 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <LandingButton to="/register" size="lg">
                      Entrá a tu casa
                    </LandingButton>
                  </div>
                )}
              </section>
            ))}

            <section
              data-piso="todo"
              data-zona="casa"
              className="flex min-h-screen flex-col justify-center border-t border-ink/10 pb-16 pt-[44vh] lg:min-h-[70vh] lg:py-24"
            >
              <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-bold uppercase leading-[0.9] tracking-display">
                ¿Cómo entro?
              </h2>
              <p className="mt-6 text-2xl leading-snug sm:text-3xl">
                Te registrás y ves la agenda.
              </p>
              <p className="mt-5 max-w-xl leading-relaxed text-ink-soft sm:text-lg">
                Adentro está todo lo que pasa cada semana y te inscribís en un toque. Para caer al
                cowork un martes no hace falta ni eso: la puerta está abierta de 14 a 21.
              </p>
              <div className="mt-8">
                <LandingButton to="/register" size="lg">
                  Entrá a tu casa
                </LandingButton>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Casa;
