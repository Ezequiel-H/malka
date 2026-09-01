import { HERO } from './content';
import LandingButton from './LandingButton';
import { irA } from './LandingNav';
import Photo from './Photo';

/**
 * Hero.
 *
 * El titular ocupa la primera pantalla entera y entra línea por línea, cada
 * una asomando desde detrás de su propio recorte. Es un gesto de un segundo
 * que decide si la página se lee como impresa o como armada.
 *
 * Alineado a la izquierda, no centrado: un bloque centrado obliga al ojo a
 * volver al medio en cada línea y, a este tamaño, se lee como una placa. El
 * eje izquierdo es lo que hace que un titular grande se sostenga.
 *
 * Sin el wordmark acá: el logo es una serif fina y al lado de una grotesca de
 * cien píxeles se veía como un invitado de otra fiesta. Vive en la barra, que
 * en esta versión lo muestra siempre.
 *
 * Debajo, los tres datos duros en una fila de filetes. Es lo que alguien que
 * llega desde Instagram busca primero —qué edad, cuándo, dónde— y en el sitio
 * viejo estaba enterrado en la mitad de la página.
 */
const Hero = () => (
  <section id="inicio" className="relative scroll-mt-16 bg-surface-page">
    <div className="pointer-events-none absolute inset-0 bg-paper-cream" aria-hidden />

    <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-5 pb-16 pt-28 sm:px-8 lg:px-10">
      <p className="animate-fade-in font-grotesk text-[0.7rem] font-semibold uppercase tracking-label text-ink-soft [animation-fill-mode:both]">
        Casa Malka · Comunidad Amijai
      </p>

      <h1 className="mt-8 font-grotesk text-[clamp(2.3rem,8.5vw,7rem)] font-bold uppercase leading-[0.9] tracking-display text-ink">
        {HERO.lineas.map((linea, i) => (
          /* Dos capas por línea: la de afuera recorta, la de adentro sube.
             Sin el recorte la línea "aparece"; con él, se asoma. */
          <span key={linea} className="block overflow-hidden pb-[0.06em]">
            <span
              className="block animate-line-rise motion-reduce:animate-none"
              style={{ animationDelay: `${100 + i * 110}ms` }}
            >
              {linea}
            </span>
          </span>
        ))}
      </h1>

      <div className="mt-14 grid gap-x-10 gap-y-10 lg:grid-cols-12">
        <ul className="grid animate-fade-in-up grid-cols-1 gap-x-8 sm:grid-cols-3 lg:col-span-7 [animation-delay:520ms] [animation-fill-mode:both]">
          {HERO.meta.map((dato) => (
            <li
              key={dato}
              className="border-t border-ink/20 pb-1 pt-3 font-grotesk text-sm text-ink-soft"
            >
              {dato}
            </li>
          ))}
        </ul>

        <p className="animate-fade-in-up font-grotesk text-lg leading-relaxed text-ink-soft lg:col-span-4 lg:col-start-9 lg:text-xl [animation-delay:600ms] [animation-fill-mode:both]">
          {HERO.bajada}
        </p>
      </div>

      <div className="mt-12 flex animate-fade-in-up flex-col gap-3 sm:flex-row [animation-delay:680ms] [animation-fill-mode:both]">
        <LandingButton to="/register" size="lg">
          {HERO.ctaPrimario}
        </LandingButton>
        <LandingButton
          variant="outline"
          size="lg"
          icon="chevronDown"
          onClick={() => irA('#la-semana')}
        >
          {HERO.ctaSecundario}
        </LandingButton>
      </div>
    </div>

    <Photo
      name="mesaShabat"
      priority
      sizes="100vw"
      className="h-[58svh] w-full sm:h-[80svh]"
      /* La foto es cuadrada y la mesa se aleja hacia arriba: recortada al
         centro, la banda ancha de escritorio se queda con los platos y
         pierde la gente. */
      imgClassName="object-[50%_46%] sm:object-[50%_40%]"
    />
  </section>
);

export default Hero;
