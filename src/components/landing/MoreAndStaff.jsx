import { HAY_MAS, STAFF } from './content';
import Photo from './Photo';
import Reveal from './Reveal';
import Section, { Eyebrow } from './Section';

/**
 * "Esperá, hay más" (la huerta y la terraza) y el staff.
 *
 * Van juntos porque cierran el recorrido: la terraza es el último piso y el
 * staff es quien te abre la puerta. La foto de la terraza va a lo ancho y sin
 * marco para que, después de cuatro bloques de dos columnas, el ojo respire.
 *
 * El staff va como lista sobre filetes y no como cuatro tarjetas con
 * iniciales: son cuatro nombres, y cuatro nombres bien compuestos alcanzan.
 */
const MoreAndStaff = () => (
  <>
    <section className="bg-surface-page pb-20 pt-24 sm:pb-24 sm:pt-28 lg:pt-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
        <Eyebrow>El último piso</Eyebrow>

        <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal delay={90}>
              <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
                {HAY_MAS.titulo}
              </h2>
            </Reveal>
          </div>
          <div className="space-y-5 lg:col-span-6 lg:col-start-7 lg:self-end">
            {HAY_MAS.parrafos.map((parrafo, i) => (
              <Reveal key={parrafo} delay={160 + i * 90}>
                <p className="font-grotesk text-lg leading-relaxed text-ink-soft">{parrafo}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-20">
        <Photo
          name="noche"
          wash="night"
          sizes="100vw"
          className="h-[55svh] w-full sm:h-[75svh]"
        />
      </div>
    </section>

    <Section className="bg-surface-page pt-0">
      <Eyebrow>El equipo</Eyebrow>

      <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal delay={90}>
            <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
              {STAFF.titulo}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
          <p className="font-grotesk text-lg leading-relaxed text-ink-soft">{STAFF.bajada}</p>
        </Reveal>
      </div>

      <ul className="mt-14">
        {STAFF.personas.map((persona, i) => (
          <Reveal
            as="li"
            key={persona.nombre}
            delay={i * 80}
            className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-t border-ink/15 py-6"
          >
            <span className="font-grotesk text-2xl font-bold uppercase leading-none tracking-headline text-ink sm:text-3xl">
              {persona.nombre}
            </span>
            <span className="font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft">
              {persona.rol}
            </span>
          </Reveal>
        ))}
      </ul>
    </Section>
  </>
);

export default MoreAndStaff;
