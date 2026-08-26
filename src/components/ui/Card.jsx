import { Link } from 'react-router-dom';
import cn from './cn';

const PADDING = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/**
 * Contenedor de contenido.
 *
 * `interactive` es para tarjetas que se clickean (una actividad en el listado):
 * levanta la sombra en hover y da feedback al apretar. Una tarjeta que no
 * navega no debería moverse — el movimiento promete algo que no pasa.
 */
const Card = ({
  padding = 'md',
  interactive = false,
  as,
  to,
  href,
  className,
  children,
  ...props
}) => {
  const classes = cn(
    'rounded-card border border-surface-border bg-surface shadow-card',
    'transition-elevate duration-fast ease-standard motion-reduce:transition-none',
    interactive &&
      'cursor-pointer hover:-translate-y-0.5 hover:shadow-raised active:translate-y-0 active:shadow-card motion-reduce:hover:translate-y-0',
    PADDING[padding],
    className
  );

  if (to) {
    return (
      <Link to={to} className={cn('block', classes)} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={cn('block', classes)} {...props}>
        {children}
      </a>
    );
  }

  const Tag = as ?? 'div';
  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

export const CardHeader = ({ title, subtitle, actions, className }) => (
  <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
    <div className="min-w-0">
      {title && <h3 className="truncate text-lg font-semibold text-ink">{title}</h3>}
      {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export default Card;
