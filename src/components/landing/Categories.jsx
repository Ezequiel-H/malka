import { cn } from '../../components/ui';
import { CATEGORIAS } from './content';
import LandingButton from './LandingButton';
import Reveal from './Reveal';
import { Eyebrow } from './Section';

/**
 * Primera banda oscura: lo que cambia.
 *
 * No lista una sola actividad, y eso es deliberado. Un listado escrito a mano
 * en una landing estática nace desactualizado, y peor: si se puede ver todo
 * desde afuera, no hay motivo para registrarse. Las seis categorías dan el
 * sabor; la agenda está adentro.
 *
 * Van en una cinta que corre sola, no en seis cajitas. Seis cajitas con
 * ícono es un bloque de plantilla; una cinta en movimiento dice "esto no
 * para nunca", que es literalmente el argumento de la sección.
 *
 * La lista va dos veces y la animación recorre exactamente la mitad: al
 * llegar al 50% el segundo juego quedó donde arrancó el primero, así que el
 * ciclo cierra sin salto. La segunda copia es decorativa —un lector de
 * pantalla no tiene por qué escuchar "Judaísmo, Actividades…" dos veces.
 */
const Categories = () => (
  <section className="relative overflow-hidden bg-primary-900 py-24 sm:py-28 lg:py-36">
    <div className="pointer-events-none absolute inset-0 bg-paper-green" aria-hidden />

    <div className="relative">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <Eyebrow tone="light">Cada semana</Eyebrow>

        <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal delay={90}>
              <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-surface-page">
                {CATEGORIAS.titulo}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
            <p className="font-grotesk text-lg leading-relaxed text-surface-page/75">
              {CATEGORIAS.texto}
            </p>
          </Reveal>
        </div>
      </div>

      <div className="my-16 border-y border-surface-page/20 py-8 sm:my-20">
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-5">
          {[0, 1].map((copia) => (
            <ul
              key={copia}
              aria-hidden={copia === 1 || undefined}
              className={cn(
                'flex shrink-0 items-center gap-10',
                /* Sin animación, la fila tiene que poder plegarse: si sigue
                   siendo `shrink-0` se queda con su ancho de contenido, se
                   centra, y el recorte de la banda se la come por los dos
                   costados. */
                'motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center',
                /* Con menos movimiento la cinta se queda quieta y la segunda
                   copia pasaría de ser un truco invisible a una repetición
                   literal de las seis palabras. */
                copia === 1 && 'motion-reduce:hidden'
              )}
            >
              {CATEGORIAS.items.map((item) => (
                <li
                  key={item.label}
                  className="flex shrink-0 items-center gap-10 font-grotesk text-[clamp(2rem,7vw,4.5rem)] font-bold uppercase leading-none tracking-display text-surface-page"
                >
                  {item.label}
                  <span aria-hidden className="text-surface-page/35">
                    &#8226;
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl font-grotesk text-xl leading-snug text-surface-page sm:text-2xl">
            {CATEGORIAS.cierre}
          </p>
          <LandingButton variant="light" size="lg" to="/register" className="shrink-0">
            {CATEGORIAS.cta}
          </LandingButton>
        </Reveal>
      </div>
    </div>
  </section>
);

export default Categories;
