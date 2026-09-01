import { Icon } from '../../components/ui';
import logoMalka from '../../assets/logo-malka-positivo.png';
import { CONTACTO, NAV } from './content';
import InstagramGlyph from './InstagramGlyph';
import { irA } from './LandingNav';

/**
 * Pie de página.
 *
 * El wordmark va enorme y a lo ancho, como firma. No tiene versión negativa
 * en el repo, así que sobre el verde profundo se invierte por CSS: al ser un
 * PNG de un solo color con alfa, `brightness(0) invert(1)` lo deja blanco
 * limpio y evita arrastrar un segundo archivo.
 *
 * El año sale de `Date`, no escrito a mano. El footer del sitio viejo dice
 * "© 2024" desde hace dos años.
 */
const REDES = [
  {
    id: 'instagram',
    href: CONTACTO.instagram,
    label: 'Instagram de Malka',
    glifo: <InstagramGlyph className="h-5 w-5" />,
  },
  {
    id: 'whatsapp',
    href: CONTACTO.whatsapp,
    label: 'WhatsApp de Malka',
    glifo: <Icon name="whatsapp" size="md" />,
  },
  {
    id: 'mail',
    href: `mailto:${CONTACTO.mail}`,
    label: 'Mail de Malka',
    glifo: <Icon name="mail" size="md" />,
  },
];

const LandingFooter = () => (
  <footer className="bg-ink">
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-20 sm:px-8 lg:px-10">
      <div className="grid gap-10 border-b border-surface-page/15 pb-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-surface-page/70">
            Casa abierta para la comunidad
          </p>
          <p className="mt-5 font-grotesk text-lg leading-relaxed text-surface-page/80">
            {CONTACTO.direccion}
            <br />
            {CONTACTO.horario}
          </p>
        </div>

        <nav aria-label="Pie de página" className="md:col-span-4">
          <ul className="space-y-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    irA(item.href);
                  }}
                  className="font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-surface-page/70 transition-control duration-fast hover:text-surface-page"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex items-start gap-2 md:col-span-3 md:justify-end">
          {REDES.map((red) => (
            <li key={red.id}>
              <a
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.label}
                className="inline-flex h-12 w-12 items-center justify-center rounded-pill border border-surface-page/20 text-surface-page/80 transition-control duration-fast hover:border-surface-page hover:bg-surface-page hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-surface-page/30"
              >
                {red.glifo}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* La firma. A este tamaño el wordmark deja de ser un logo y pasa a ser
          el cierre gráfico de la página. */}
      <img
        src={logoMalka}
        alt="Malka"
        className="mt-14 w-full [filter:brightness(0)_invert(1)] opacity-90"
      />

      <div className="mt-12 flex flex-col gap-2 font-grotesk text-[0.7rem] uppercase tracking-label text-surface-page/70 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Casa Malka</p>
        <p>
          Creada por la{' '}
          <a
            href={CONTACTO.amijai}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-surface-page/30 underline-offset-4 transition-control duration-fast hover:text-surface-page hover:decoration-surface-page"
          >
            Comunidad Amijai
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
