import { useEffect, useState } from 'react';
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

const PISOS = [
  {
    id: 'entrada',
    piso: 'todo',
    kicker: 'Casa Malka · Comunidad Amijai',
    titulo: 'Es una casa.',
    entrada: 'Con subsuelo, dos plantas, terraza y la puerta abierta.',
    texto:
      'Un lugar para jóvenes judíos de 18 a 35 en 3 de Febrero 1325. Abre de lunes a viernes de 14 a 21, no hace falta ser socio y no hay que anotarse para venir.',
  },
  {
    id: 'planta',
    piso: 'planta',
    kicker: 'Planta baja',
    titulo: 'El salón',
    entrada: 'Acá se pone la mesa larga y se hace Shabat.',
    texto:
      'Es el primer lugar en el que entrás y donde pasan las ceremonias de la casa. Al fondo están la cocina y la parrilla: se come, se discute de todo un poco y se sigue hasta que alguien apaga la luz.',
  },
  {
    id: 'primero',
    piso: 'primero',
    kicker: 'Primer piso',
    titulo: 'El cowork',
    entrada: 'Un martes cualquiera, traés la compu y te sentás.',
    texto:
      'Una mesa larga para trabajar, wifi y el rincón del café con cakes. Es el piso mínimo de Malka: no hace falta que haya una actividad para que vengas, y de hecho así es como la mayoría empieza a venir. En el mismo piso se dan las charlas y los cursos.',
  },
  {
    id: 'terraza',
    piso: 'terraza',
    kicker: 'Arriba de todo',
    titulo: 'La terraza y la huerta',
    entrada: 'Unplugged, algún fueguito y la ciudad abajo.',
    texto:
      'Una huerta que conecta con la tierra y, pegadita, la terraza: el lugar premium para frenar el tiempo, tocar hasta cualquier hora y mirar un rato las estrellas.',
  },
  {
    id: 'subsuelo',
    piso: 'subsuelo',
    kicker: 'Y abajo de todo',
    titulo: 'El subsuelo',
    entrada: 'Yoga, movimiento y la cochera.',
    texto:
      'El nivel de abajo es la sala de movimiento: espejo, colchonetas y las clases que piden piso y silencio. Del otro lado, la cochera, que es por donde entran los autos.',
  },
];


const Casa = () => {
  const [activo, setActivo] = useState('todo');

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
          <div className="sticky top-16 z-30 -mx-5 bg-surface-page/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-16 lg:z-auto lg:col-span-6 lg:mx-0 lg:flex lg:h-[calc(100vh-4rem)] lg:items-center lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <CasaDibujada
              activo={activo}
              className="mx-auto h-[36vh] w-auto max-w-full py-2 lg:h-auto lg:max-h-[calc(100vh-8rem)] lg:w-full lg:py-0"
            />
          </div>

          <div className="lg:col-span-6">
            {PISOS.map((p, i) => (
              <section
                key={p.id}
                id={p.id}
                data-piso={p.piso}
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
