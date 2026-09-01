import { cn } from '../../components/ui';
import Reveal from './Reveal';

/**
 * Envoltorio de sección: ritmo vertical y ancho de lectura, en un solo lugar.
 *
 * Una landing se ve prolija cuando el aire entre secciones es siempre el
 * mismo. Si cada sección elige su propio `py-`, el scroll se siente
 * arrítmico aunque cada bloque suelto esté bien.
 *
 * `scroll-mt-16` compensa la barra fija: sin eso, un ancla del menú deja el
 * título tapado por la propia navegación.
 */
const Section = ({ id, className, children, ...props }) => (
  <section id={id} className={cn('scroll-mt-16 py-24 sm:py-28 lg:py-36', className)} {...props}>
    <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">{children}</div>
  </section>
);

/**
 * Etiqueta de sección: mayúscula chica, muy espaciada, sobre un filete.
 *
 * Es el recurso que hace la mitad del trabajo de que una página se lea
 * ordenada. La regla se dibuja sola cuando el bloque entra en pantalla, así
 * que además marca dónde empieza cada capítulo.
 */
export const Eyebrow = ({ children, tone = 'dark', className }) => {
  const claro = tone === 'light';

  return (
    <Reveal
      className={cn(
        'flex items-center gap-4 border-t pt-4',
        claro ? 'border-surface-page/25' : 'border-ink/15',
        className
      )}
    >
      <span
        className={cn(
          'font-grotesk text-[0.7rem] font-semibold uppercase tracking-label',
          claro ? 'text-surface-page/70' : 'text-ink-soft'
        )}
      >
        {children}
      </span>
    </Reveal>
  );
};

export default Section;
