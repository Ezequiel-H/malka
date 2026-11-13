import { Link } from 'react-router-dom';
import { Icon, cn } from '../../components/ui';

/**
 * El botón de la landing.
 *
 * No usa el `Button` del design system y no es un descuido: el de adentro es
 * un control de formulario —esquina de 10px, texto en tamaño de párrafo,
 * estados de carga y de deshabilitado— y acá afuera hace falta otra cosa,
 * una píldora en mayúscula chica que combine con titulares de cartel. Un
 * botón de landing y un botón de formulario son dos objetos distintos que se
 * llaman igual.
 *
 * Lo que sí se copia del DS, porque es lo que importa: renderiza `Link`, `a`
 * o `button` según lo que reciba, mantiene el área táctil de 44px y el anillo
 * de foco visible sólo para teclado.
 *
 * El relleno del hover crece desde abajo con `scaleY`, que el navegador
 * resuelve en el compositor. Animar la altura o el color de fondo obligaría
 * a repintar en cada frame.
 */

const VARIANTES = {
  solid: {
    base: 'bg-ink text-surface-page',
    relleno: 'bg-primary-700',
    anillo: 'focus-visible:ring-ink/25',
  },
  outline: {
    base: 'border border-ink/25 text-ink hover:text-surface-page',
    relleno: 'bg-ink',
    anillo: 'focus-visible:ring-ink/25',
  },
  light: {
    base: 'bg-surface-page text-ink',
    relleno: 'bg-primary-100',
    anillo: 'focus-visible:ring-surface-page/40',
  },
  ghostLight: {
    base: 'border border-surface-page/30 text-surface-page hover:text-ink',
    relleno: 'bg-surface-page',
    anillo: 'focus-visible:ring-surface-page/40',
  },
};

const TAMANOS = {
  sm: 'min-h-[38px] px-4 py-2 text-[0.7rem]',
  md: 'min-h-[44px] px-6 py-3 text-[0.75rem]',
  lg: 'min-h-[54px] px-8 py-4 text-[0.8rem]',
};

const LandingButton = ({
  variant = 'solid',
  size = 'md',
  icon = 'forward',
  to,
  href,
  className,
  children,
  ...props
}) => {
  const v = VARIANTES[variant];

  const clases = cn(
    'group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-pill',
    'font-grotesk font-semibold uppercase tracking-label',
    'transition-control duration-base ease-standard',
    'focus-visible:outline-none focus-visible:ring-[3px]',
    v.base,
    v.anillo,
    TAMANOS[size],
    className
  );

  const contenido = (
    <>
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 origin-bottom scale-y-0 transition-transform duration-base ease-entrance',
          'group-hover:scale-y-100 motion-reduce:transition-none',
          v.relleno
        )}
      />
      <span className="relative">{children}</span>
      {icon && (
        <Icon
          name={icon}
          size="xs"
          /* En hebreo la flecha apunta para el otro lado y se corre hacia allá. */
          className="relative transition-chrome duration-base ease-entrance group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={clases} {...props}>
        {contenido}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={clases} {...props}>
        {contenido}
      </a>
    );
  }

  return (
    <button type="button" className={clases} {...props}>
      {contenido}
    </button>
  );
};

export default LandingButton;
