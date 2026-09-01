import { Link } from 'react-router-dom';

import { CIERRE } from './content';
import LandingButton from './LandingButton';
import Reveal from './Reveal';

/**
 * El cierre.
 *
 * Las dos líneas son las que Malka ya usaba para terminar el recorrido por
 * la casa. Puestas acá, después de todo lo demás, dejan de ser una despedida
 * y pasan a ser la invitación: es el último lugar donde alguien decide.
 *
 * Es el titular más grande de la página, más que el del hero. Si hay un solo
 * momento en el que conviene levantar la voz, es el último.
 */
const ClosingCta = () => (
  <section className="relative overflow-hidden bg-primary-900">
    <div className="pointer-events-none absolute inset-0 bg-paper-green" aria-hidden />

    <div className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 lg:px-10 lg:py-40">
      <Reveal>
        <h2 className="max-w-4xl font-grotesk text-[clamp(2.6rem,9vw,7rem)] font-bold uppercase leading-[0.88] tracking-display text-surface-page">
          {CIERRE.titulo}
        </h2>
      </Reveal>

      <Reveal delay={120}>
        <p className="mt-8 max-w-xl font-grotesk text-xl leading-snug text-surface-page/75 sm:text-2xl">
          {CIERRE.bajada}
        </p>
      </Reveal>

      <Reveal delay={200} className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <LandingButton variant="light" size="lg" to="/register">
          {CIERRE.cta}
        </LandingButton>
        <p className="font-grotesk text-sm text-surface-page/70">
          {CIERRE.yaTengoCuenta}{' '}
          <Link
            to="/login"
            className="text-surface-page underline decoration-surface-page/40 underline-offset-4 transition-control duration-fast hover:decoration-surface-page"
          >
            {CIERRE.iniciarSesion}
          </Link>
        </p>
      </Reveal>
    </div>
  </section>
);

export default ClosingCta;
