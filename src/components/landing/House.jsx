import { cn } from '../../components/ui';
import { CASA } from './content';
import Photo from './Photo';
import Reveal from './Reveal';
import Section, { Eyebrow } from './Section';

/**
 * Conocé la casa: el recorrido por el edificio, planta por planta.
 *
 * Es lo único genuinamente espacial del sitio, así que va editorial —texto e
 * imagen alternando— y no como grilla. Una grilla de cuatro fotos dice
 * "galería"; esta alternancia dice "subí conmigo".
 *
 * Cada ambiente lleva su número y su piso arriba de un filete: el recorrido
 * se lee como un plano y no como cuatro bloques sueltos que casualmente
 * quedaron uno abajo del otro.
 *
 * Las fotos hacen parallax dentro de su marco (ver `Photo`): el desfasaje
 * entre la imagen y el texto que la acompaña es lo que da profundidad al
 * scroll sin agregar un solo kilobyte.
 */
const House = () => (
  <Section id="la-casa" className="bg-surface-page">
    <Eyebrow>3 de Febrero 1325</Eyebrow>

    <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <Reveal delay={90}>
          <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
            {CASA.titulo}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
        <p className="font-grotesk text-lg leading-relaxed text-ink-soft sm:text-xl">
          {CASA.bajada}
        </p>
      </Reveal>
    </div>

    <div className="mt-16 sm:mt-20">
      {CASA.ambientes.map((ambiente, i) => {
        const invertido = i % 2 === 1;

        return (
          <div
            key={ambiente.id}
            className="grid items-center gap-x-12 gap-y-8 border-t border-ink/15 py-12 md:grid-cols-2 lg:py-16"
          >
            <Reveal className={cn(invertido && 'md:order-2')}>
              <Photo
                name={ambiente.foto}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-[4/3] w-full lg:aspect-[5/4]"
              />
            </Reveal>

            <Reveal delay={110} className={cn(invertido && 'md:order-1')}>
              <div className="flex items-baseline gap-4">
                <span className="font-grotesk text-sm font-semibold tabular-nums text-ink-soft">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-primary-700">
                  {ambiente.kicker}
                </span>
              </div>

              <h3 className="mt-5 font-grotesk text-[clamp(1.9rem,5vw,3.25rem)] font-bold uppercase leading-none tracking-display text-ink">
                {ambiente.titulo}
              </h3>
              <p className="mt-6 max-w-xl font-grotesk text-base leading-relaxed text-ink-soft lg:text-lg">
                {ambiente.texto}
              </p>
            </Reveal>
          </div>
        );
      })}
    </div>
  </Section>
);

export default House;
