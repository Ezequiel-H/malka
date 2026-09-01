import { SEMANA } from './content';
import Reveal from './Reveal';
import Section, { Eyebrow } from './Section';

/**
 * La semana en Malka: el pulso fijo, no el calendario.
 *
 * Es la respuesta al problema de fondo de la landing — la página es estática
 * y la agenda cambia todas las semanas. Acá va lo que no vence (que la casa
 * abre de tarde, que hay Shabat, que hay estudio) y las fechas viven adentro
 * del sistema. Eso mismo es el argumento para registrarse.
 *
 * Va como lista numerada sobre filetes, no como tres tarjetas. Tres tarjetas
 * con ícono en un círculo es el bloque más visto de internet; una lista con
 * números grandes y una regla se lee como un índice, que es exactamente lo
 * que esto es.
 */
const Week = () => (
  <Section id="la-semana" className="bg-surface-page">
    <Eyebrow>Lo que no cambia</Eyebrow>

    <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Reveal delay={90}>
          <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
            {SEMANA.titulo}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
        <p className="font-grotesk text-lg leading-relaxed text-ink-soft sm:text-xl">
          {SEMANA.bajada}
        </p>
      </Reveal>
    </div>

    <ol className="mt-16 sm:mt-20">
      {SEMANA.beats.map((beat, i) => (
        <Reveal
          as="li"
          key={beat.titulo}
          delay={i * 110}
          className="group grid gap-x-10 gap-y-3 border-t border-ink/15 py-8 sm:py-10 lg:grid-cols-12"
        >
          <span className="font-grotesk text-sm font-semibold tabular-nums text-ink-soft lg:col-span-1">
            {String(i + 1).padStart(2, '0')}
          </span>

          <div className="lg:col-span-4">
            <h3 className="font-grotesk text-2xl font-bold uppercase leading-none tracking-headline text-ink sm:text-3xl">
              {beat.titulo}
            </h3>
            <p className="mt-3 font-grotesk text-sm font-semibold uppercase tracking-label text-primary-700">
              {beat.dato}
            </p>
          </div>

          <p className="font-grotesk text-base leading-relaxed text-ink-soft lg:col-span-6 lg:col-start-7 lg:text-lg">
            {beat.texto}
          </p>
        </Reveal>
      ))}
    </ol>

    <Reveal delay={140} className="border-t border-ink/15 pt-6">
      <p className="max-w-2xl font-grotesk text-sm leading-relaxed text-ink-soft">{SEMANA.hedge}</p>
    </Reveal>
  </Section>
);

export default Week;
