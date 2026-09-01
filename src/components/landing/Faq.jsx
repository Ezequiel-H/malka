import { Icon } from '../../components/ui';
import { FAQ } from './content';
import Reveal from './Reveal';
import Section, { Eyebrow } from './Section';

/**
 * Las ocho preguntas, una sola vez en todo el sitio.
 *
 * En el WordPress están repetidas en las tres páginas, que es la manera más
 * rápida de que una respuesta quede desactualizada en dos lados y nadie se
 * entere.
 *
 * Es un `<details>` nativo y no un acordeón propio a propósito: abre y cierra
 * sin JavaScript, ya lo anuncia bien un lector de pantalla, y el buscador ve
 * las respuestas aunque estén plegadas.
 *
 * Sin caja ni fondo: sólo filetes y tipografía grande. Un acordeón metido
 * dentro de una tarjeta redondeada es el patrón exacto que hace que una
 * página se vea de plantilla.
 */
const Faq = () => (
  <Section id="preguntas" className="bg-surface-page">
    <Eyebrow>Antes de venir</Eyebrow>

    <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Reveal delay={90}>
          <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
            {FAQ.titulo}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
        <p className="font-grotesk text-lg leading-relaxed text-ink-soft">{FAQ.bajada}</p>
      </Reveal>
    </div>

    <div className="mt-14 sm:mt-16">
      {FAQ.items.map((item, i) => (
        <Reveal as="details" key={item.q} delay={i * 50} className="group border-t border-ink/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/25 [&::-webkit-details-marker]:hidden">
            <h3 className="font-grotesk text-xl font-bold uppercase leading-tight tracking-headline text-ink transition-control duration-fast group-hover:text-primary-700 sm:text-2xl lg:text-3xl">
              {item.q}
            </h3>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-ink/20 text-ink transition-chrome duration-base ease-entrance group-open:rotate-45 group-open:border-ink group-open:bg-ink group-open:text-surface-page motion-reduce:transition-none">
              <Icon name="add" size="sm" />
            </span>
          </summary>
          <p className="max-w-2xl pb-8 font-grotesk text-base leading-relaxed text-ink-soft lg:text-lg">
            {item.a}
          </p>
        </Reveal>
      ))}
      <div className="border-t border-ink/15" />
    </div>
  </Section>
);

export default Faq;
