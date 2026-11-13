import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import cn from './cn';

/* Pastillas, con la tinta como color principal (el mismo idioma que la
   landing). El verde queda para el éxito y los acentos. */
const VARIANTS = {
  primary: 'bg-ink text-surface hover:bg-primary-800 active:bg-primary-900',
  secondary: 'bg-surface text-ink border border-ink/15 hover:border-ink/30 hover:bg-ink/[0.03] active:bg-ink/[0.06]',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/[0.05] hover:text-ink',
  soft: 'bg-ink/[0.06] text-ink hover:bg-ink/10 active:bg-ink/[0.14]',
  danger: 'bg-danger-500 text-white shadow-subtle hover:bg-danger-600 active:bg-danger-700',
  success: 'bg-success-500 text-white shadow-subtle hover:bg-success-600 active:bg-success-700',
  warning: 'bg-warning-500 text-white shadow-subtle hover:bg-warning-600 active:bg-warning-700',
  link: 'bg-transparent text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/70 shadow-none',
};

/* min-h de 44px en mobile: es el tamaño mínimo de target táctil accesible. */
const SIZES = {
  sm: 'text-sm px-3 py-1.5 gap-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px] sm:min-h-[40px]',
  lg: 'text-base px-6 py-3 gap-2 min-h-[48px]',
};

const ICON_SIZES = { sm: 'sm', md: 'sm', lg: 'md' };

/* Botón cuadrado, sólo icono. */
const ICON_ONLY_SIZES = {
  sm: 'p-1.5 min-h-[36px] min-w-[36px]',
  md: 'p-2.5 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]',
  lg: 'p-3 min-h-[48px] min-w-[48px]',
};

/**
 * Botón del sistema.
 *
 * Renderiza <button>, <a> o <Link> de react-router según lo que reciba, sin
 * que quien lo usa tenga que cambiar de componente: un botón que navega sigue
 * siendo un link para el navegador y para un lector de pantalla.
 *
 *   <Button variant="danger" icon="delete" onClick={borrar}>Eliminar</Button>
 *   <Button to="/activities" variant="secondary">Ver actividades</Button>
 *   <Button icon="close" iconOnly label="Cerrar" variant="ghost" />
 */
/* Los íconos que señalan una dirección se dan vuelta en hebreo: «adelante»
   apunta a la izquierda cuando se lee de derecha a izquierda. */
const DIRECCIONALES = new Set(['forward', 'back', 'chevronLeft', 'chevronRight', 'logout']);
const espejo = (nombre) => (DIRECCIONALES.has(nombre) ? 'rtl:-scale-x-100' : undefined);

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      iconOnly = false,
      loading = false,
      disabled = false,
      fullWidth = false,
      label,
      className,
      children,
      to,
      href,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = cn(
      'inline-flex items-center justify-center font-semibold rounded-pill',
      'transition-chrome duration-fast ease-standard',
      // El foco se ve siempre, pero sólo cuando se navega por teclado.
      // Ring semitransparente pegado al botón: un offset con color de fondo
      // fijo se veía como un halo crema sobre las superficies blancas.
      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35',
      'disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none',
      'active:scale-[0.98] disabled:active:scale-100',
      // Respeta a quien pidió menos movimiento en el sistema operativo.
      'motion-reduce:transition-none motion-reduce:active:scale-100',
      VARIANTS[variant],
      iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {loading ? (
          <Icon name="loading" size={ICON_SIZES[size]} className="animate-spin" />
        ) : (
          icon && <Icon name={icon} size={ICON_SIZES[size]} className={espejo(icon)} />
        )}
        {!iconOnly && children}
        {iconRight && !loading && <Icon name={iconRight} size={ICON_SIZES[size]} className={espejo(iconRight)} />}
      </>
    );

    // Accesibilidad: sin texto visible, el nombre accesible tiene que venir de
    // algún lado o el botón es mudo para un lector de pantalla.
    const a11yLabel = iconOnly ? label : undefined;

    if (to && !isDisabled) {
      return (
        <Link ref={ref} to={to} className={classes} aria-label={a11yLabel} {...props}>
          {content}
        </Link>
      );
    }

    if (href && !isDisabled) {
      return (
        <a ref={ref} href={href} className={classes} aria-label={a11yLabel} {...props}>
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-label={a11yLabel}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export const buttonVariants = Object.keys(VARIANTS);
export const buttonSizes = Object.keys(SIZES);

export default Button;
