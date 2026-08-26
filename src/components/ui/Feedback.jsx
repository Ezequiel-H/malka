import Icon from './Icon';
import cn from './cn';

const SPINNER_SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

/**
 * Indicador de carga. `label` es obligatorio en espíritu: un spinner mudo no
 * le dice nada a quien usa lector de pantalla.
 */
export const Spinner = ({ size = 'md', label = 'Cargando', className }) => (
  <span role="status" aria-live="polite" className={cn('inline-flex items-center', className)}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('animate-spin text-primary', SPINNER_SIZES[size])}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
    <span className="sr-only">{label}</span>
  </span>
);

/**
 * Placeholder de carga con forma de contenido.
 *
 * Es mejor que un spinner cuando ya se sabe qué forma va a tener lo que
 * carga: la página no salta cuando llegan los datos.
 */
export const Skeleton = ({ className, rounded = 'control' }) => (
  <div
    aria-hidden="true"
    className={cn(
      'animate-shimmer bg-[length:200%_100%]',
      'bg-gradient-to-r from-ink/[0.05] via-ink/[0.09] to-ink/[0.05]',
      rounded === 'pill' ? 'rounded-pill' : 'rounded-control',
      className
    )}
  />
);

/** Varias líneas de texto simuladas. La última sale más corta, como un párrafo real. */
export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn('h-3.5', i === lines - 1 && 'w-2/3')} />
    ))}
  </div>
);

/**
 * Grilla de tarjetas fantasma para la carga inicial de un listado.
 *
 * Mejor que el spinner a pantalla completa: la página aparece ya con la forma
 * del contenido y no salta cuando llegan los datos.
 */
export const SkeletonCards = ({ count = 6, columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' }) => (
  <div aria-hidden="true" className={cn('grid gap-6', columns)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-card border border-surface-border bg-surface p-4 shadow-card sm:p-6">
        <Skeleton className="mb-4 h-5 w-2/3" />
        <SkeletonText lines={2} className="mb-5" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="mt-5 h-10 w-full" />
      </div>
    ))}
  </div>
);

/**
 * Filas fantasma para tablas y listados dentro de una tarjeta.
 */
export const SkeletonRows = ({ count = 6 }) => (
  <div
    aria-hidden="true"
    className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-surface shadow-card"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="ml-auto h-6 w-24" rounded="pill" />
      </div>
    ))}
  </div>
);

/**
 * Estado vacío.
 *
 * Un listado sin resultados no es un error: se explica por qué está vacío y se
 * ofrece la acción que lo llena.
 */
export const EmptyState = ({ icon = 'empty', title, description, action, className }) => (
  <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-pill bg-primary-50 text-primary">
      <Icon name={icon} size="xl" />
    </span>

    {title && <h3 className="text-xl font-semibold text-ink">{title}</h3>}
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default { Spinner, Skeleton, SkeletonText, EmptyState };
