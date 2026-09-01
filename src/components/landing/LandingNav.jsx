import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, cn } from '../../components/ui';
import logoMalka from '../../assets/logo-malka-positivo.png';
import { NAV } from './content';
import LandingButton from './LandingButton';
import { quiereQuietud } from './scrollFx';

/**
 * Posición del halo sobre las tres llamas de la K del wordmark.
 *
 * El logo es un PNG de proporción fija, así que ubicarlo en porcentajes lo
 * deja pegado a las llamas en cualquier tamaño.
 */
const HALO = { left: '63.4%', top: '9%', width: '13%' };

/* Scroll suave, salvo que el sistema pida lo contrario. */
export const irA = (href) => {
  const destino = document.querySelector(href);
  if (!destino) return;
  destino.scrollIntoView({ behavior: quiereQuietud() ? 'auto' : 'smooth', block: 'start' });
};

/**
 * Barra de navegación de la landing.
 *
 * Arranca transparente sobre el hero y recién se materializa —crema, filete,
 * logo— cuando el usuario bajó. Así el wordmark del hero no compite con una
 * copia chica suya a cuarenta píxeles, y el arranque de la página queda todo
 * para el titular.
 *
 * Los links van en mayúscula chica y espaciada, no en oración: al lado de un
 * titular de cartel, un menú en tamaño de párrafo se lee como un accesorio
 * que quedó de otra plantilla.
 */
const LandingNav = () => {
  const [bajado, setBajado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const alScrollear = () => setBajado(window.scrollY > 40);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e) => e.key === 'Escape' && setMenuAbierto(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [menuAbierto]);

  const navegar = (e, href) => {
    e.preventDefault();
    setMenuAbierto(false);
    irA(href);
  };

  const materializada = bajado || menuAbierto;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-chrome duration-slow ease-standard',
        materializada
          ? 'border-b border-ink/10 bg-surface-page/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8 lg:px-10"
        aria-label="Principal"
      >
        <a
          href="#inicio"
          onClick={(e) => navegar(e, '#inicio')}
          className="relative shrink-0"
          aria-label="Malka, ir al inicio"
        >
          {/* La casa siempre tiene una luz prendida. Es el único movimiento
              permanente de la página, y respeta a quien pidió menos. El halo
              va DETRÁS del PNG: como tiene alfa, asoma alrededor de las tres
              llamas de la K y las letras quedan intactas encima. */}
          <span
            aria-hidden
            className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 animate-flame rounded-pill bg-flame-glow blur-[5px] motion-reduce:animate-none motion-reduce:opacity-50"
            style={HALO}
          />
          <img src={logoMalka} alt="" className="relative h-6 w-auto" />
        </a>

        <ul className="ml-auto hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => navegar(e, item.href)}
                /* El subrayado crece desde la izquierda en vez de aparecer:
                   una animación de 160ms convierte un link plano en algo que
                   responde. */
                className="group relative block py-2 font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft transition-control duration-fast hover:text-ink"
              >
                {item.label}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-base ease-entrance group-hover:scale-x-100 motion-reduce:transition-none"
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1 md:ml-10">
          <Link
            to="/login"
            className="hidden rounded-pill px-4 py-2 font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft transition-control duration-fast hover:text-ink sm:inline-flex"
          >
            Ingresar
          </Link>
          <LandingButton to="/register" size="sm">
            Registrate
          </LandingButton>
          <button
            type="button"
            aria-expanded={menuAbierto}
            aria-controls="menu-landing"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="-mr-2 ml-1 inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink transition-control duration-fast hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/25 md:hidden"
          >
            <Icon name={menuAbierto ? 'close' : 'menu'} size="md" />
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div
          id="menu-landing"
          className="animate-fade-in-up border-t border-ink/10 bg-surface-page px-5 pb-8 pt-4 md:hidden"
        >
          <ul className="flex flex-col divide-y divide-ink/10">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => navegar(e, item.href)}
                  className="block py-4 font-grotesk text-3xl font-bold uppercase tracking-display text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                to="/login"
                onClick={() => setMenuAbierto(false)}
                className="block py-4 font-grotesk text-3xl font-bold uppercase tracking-display text-ink"
              >
                Ingresar
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
