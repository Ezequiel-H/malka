import { IESHIVE } from './content';
import Photo from './Photo';
import Reveal from './Reveal';
import { Eyebrow } from './Section';

/**
 * Segunda banda oscura: La Ieshive, sobre la foto de la clase.
 *
 * Los shiurim no tienen sección propia y se desarrollan acá. Una sección
 * dedicada quedaría flaca —no hay listado real que poner— y, peor, filtra:
 * alguien de veinticuatro que no viene de una casa observante lee "shiurim"
 * y se cae del embudo. El texto de La Ieshive, que Malka ya tenía escrito, es
 * abierto y plural por sí solo. La generalidad acá no es tibieza: es la
 * puerta.
 */
const Ieshive = () => (
  <section className="relative isolate overflow-hidden">
    <Photo
      name="laIeshive"
      wash="strong"
      sizes="100vw"
      className="absolute inset-0 -z-10 h-full w-full"
    />
    {/* Segunda cortina, en degradé: la foto tiene caras muy iluminadas abajo
        a la derecha y el texto claro se perdía justo ahí. */}
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-gradient-to-br from-ink/75 via-primary-900/55 to-primary-900/75"
    />

    <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 lg:px-10 lg:py-40">
      <div className="max-w-2xl">
        <Eyebrow tone="light">Acá vive</Eyebrow>
        <Reveal delay={90}>
          <h2 className="mt-7 font-grotesk text-[clamp(2.4rem,8vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-display text-surface-page">
            {IESHIVE.titulo}
          </h2>
        </Reveal>

        {IESHIVE.parrafos.map((parrafo, i) => (
          <Reveal key={parrafo} delay={160 + i * 90}>
            <p className="mt-6 font-grotesk text-lg leading-relaxed text-surface-page/80 sm:text-xl">
              {parrafo}
            </p>
          </Reveal>
        ))}

        <Reveal delay={340}>
          <p className="mt-10 max-w-xl font-grotesk text-2xl font-semibold leading-snug text-surface-page sm:text-3xl">
            {IESHIVE.cierre}
          </p>
        </Reveal>

        <Reveal delay={420}>
          <p className="mt-10 border-t border-surface-page/25 pt-5 font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-surface-page/65">
            {IESHIVE.nota}
          </p>
        </Reveal>
      </div>
    </div>
  </section>
);

export default Ieshive;
