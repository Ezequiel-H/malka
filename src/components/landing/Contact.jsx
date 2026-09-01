import { Icon } from '../../components/ui';
import { CONTACTO, CONTACTO_SECCION } from './content';
import InstagramGlyph from './InstagramGlyph';
import Reveal from './Reveal';
import Section, { Eyebrow } from './Section';

/**
 * Contacto: los tres canales que Malka realmente atiende, y la dirección.
 *
 * Sin formulario. El sitio viejo tampoco tenía uno y no lo extraña: el canal
 * real es WhatsApp e Instagram, y quien quiere entrar de verdad se registra
 * — que es el único formulario que esta página necesita.
 *
 * Sin iframe de Google Maps, además: son unos cuantos cientos de kilobytes y
 * un puñado de cookies de terceros para mostrar un rectángulo que el celular
 * de cualquiera abre mejor en su propia app de mapas.
 */

const CANALES = [
  {
    id: 'instagram',
    titulo: 'Instagram',
    detalle: CONTACTO.instagramHandle,
    href: CONTACTO.instagram,
    glifo: <InstagramGlyph className="h-5 w-5" />,
  },
  {
    id: 'whatsapp',
    titulo: 'WhatsApp',
    detalle: CONTACTO.whatsappVisible,
    href: CONTACTO.whatsapp,
    glifo: <Icon name="whatsapp" size="md" />,
  },
  {
    id: 'mail',
    titulo: 'Mail',
    detalle: CONTACTO.mail,
    href: `mailto:${CONTACTO.mail}`,
    glifo: <Icon name="mail" size="md" />,
  },
];

const Contact = () => (
  <Section id="contacto" className="bg-surface-page">
    <Eyebrow>Cómo llegar</Eyebrow>

    <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <Reveal delay={90}>
          <h2 className="font-grotesk text-[clamp(2.1rem,6.5vw,4.25rem)] font-bold uppercase leading-[0.94] tracking-display text-ink">
            {CONTACTO_SECCION.titulo}
          </h2>
        </Reveal>
      </div>
      <Reveal delay={160} className="lg:col-span-5 lg:col-start-8 lg:self-end">
        <p className="font-grotesk text-lg leading-relaxed text-ink-soft">
          {CONTACTO_SECCION.bajada}
        </p>
      </Reveal>
    </div>

    <Reveal className="mt-16 border-t border-ink/15 pt-10 sm:mt-20">
      <a
        href={CONTACTO.mapa}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex flex-wrap items-baseline gap-x-6 gap-y-3 focus-visible:outline-none"
      >
        <span className="font-grotesk text-[clamp(2rem,6.5vw,4rem)] font-bold uppercase leading-none tracking-display text-ink transition-control duration-base group-hover:text-primary-700 group-focus-visible:text-primary-700">
          3 de Febrero 1325
        </span>
        <span className="inline-flex items-center gap-2 font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft transition-chrome duration-base ease-entrance group-hover:translate-x-1 motion-reduce:transition-none">
          Abrir en el mapa
          <Icon name="external" size="xs" />
        </span>
      </a>
      <p className="mt-6 font-grotesk text-lg text-ink-soft">
        {CONTACTO.horario}.{' '}
        <span className="text-ink-soft">
          En feriados y festividades, consultanos antes de venir.
        </span>
      </p>
    </Reveal>

    <ul className="mt-14">
      {CANALES.map((canal, i) => (
        <Reveal as="li" key={canal.id} delay={i * 80}>
          <a
            href={canal.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 border-t border-ink/15 py-6 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/25"
          >
            <span className="text-ink-soft transition-control duration-base group-hover:text-primary-700">
              {canal.glifo}
            </span>
            <span className="font-grotesk text-2xl font-bold uppercase leading-none tracking-headline text-ink transition-control duration-base group-hover:text-primary-700 sm:text-3xl">
              {canal.titulo}
            </span>
            <span className="ml-auto truncate font-grotesk text-sm text-ink-soft sm:text-base">
              {canal.detalle}
            </span>
            <Icon
              name="forward"
              size="sm"
              className="shrink-0 text-ink-soft transition-chrome duration-base ease-entrance group-hover:translate-x-1 group-hover:text-primary-700 motion-reduce:transition-none"
            />
          </a>
        </Reveal>
      ))}
      <li className="border-t border-ink/15" />
    </ul>
  </Section>
);

export default Contact;
