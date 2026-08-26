import Icon from './Icon';
import cn from './cn';

/**
 * Paleta por tono.
 *
 * `rgb` va en crudo porque el halo y la sombra teñida necesitan alpha
 * arbitrario, y Tailwind no puede componer eso desde un token de color.
 */
const TONES = {
  info: { icon: 'info', rgb: '61, 125, 153', chip: 'bg-info-500' },
  success: { icon: 'success', rgb: '63, 145, 89', chip: 'bg-success-500' },
  warning: { icon: 'warning', rgb: '201, 138, 30', chip: 'bg-warning-500' },
  danger: { icon: 'error', rgb: '196, 69, 60', chip: 'bg-danger-500' },
};

/**
 * Mensaje en línea, anclado al contenido (a diferencia del Toast, que es
 * flotante y efímero).
 *
 * Superficie translúcida con desenfoque y un halo de color difuminado en la
 * esquina, que tiñe sin pintar la caja entera. El color vive en el icono y en
 * el halo; el título va en tinta. Colorear también el título hace que una
 * pantalla con varias alertas se lea como un semáforo.
 *
 * `backdrop-blur` rinde de verdad cuando hay algo detrás — dentro de un modal,
 * sobre una imagen, encima de una tabla. Sobre un fondo plano el que sostiene
 * la pieza es el halo, por eso no depende del desenfoque para verse bien.
 *
 * Los errores y advertencias se anuncian solos a un lector de pantalla
 * (`role="alert"`); la info y el éxito no interrumpen.
 *
 *   <Alert tone="warning" title="Cupo casi completo">Quedan 2 lugares.</Alert>
 *   <Alert tone="success" compact>Guardado.</Alert>
 *   <Alert tone="danger" title="No se pudo guardar" action={<Button size="sm">Reintentar</Button>} />
 */
const Alert = ({
  tone = 'info',
  title,
  /* Por defecto el título es un <p>: la mayoría de las alertas son mensajes
     dentro de un flujo, no secciones. Cuando el alerta ES la sección de la
     pantalla, pasar titleAs="h2" para no romper la jerarquía de encabezados. */
  titleAs: TitleTag = 'p',
  action,
  onClose,
  compact = false,
  className,
  style,
  children,
  ...props
}) => {
  const config = TONES[tone];
  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      style={{
        boxShadow: `0 1px 2px rgba(44,61,52,.04), 0 12px 32px -12px rgba(${config.rgb},.25)`,
        ...style,
      }}
      className={cn(
        'relative flex items-start gap-3 overflow-hidden',
        'rounded-[16px] bg-surface/70 ring-1 ring-inset ring-ink/[0.07] backdrop-blur-xl',
        compact ? 'p-3' : 'p-4',
        'animate-fade-in motion-reduce:animate-none',
        className
      )}
      {...props}
    >
      {/* Halo: disco difuminado que tiñe la esquina y da la profundidad. */}
      <span
        aria-hidden="true"
        style={{ background: `rgb(${config.rgb})` }}
        className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full opacity-[0.18] blur-2xl"
      />

      <span
        aria-hidden="true"
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-[9px] text-white',
          config.chip,
          compact ? 'h-6 w-6' : 'h-7 w-7'
        )}
      >
        <Icon name={config.icon} size="xs" strokeWidth={2.5} />
      </span>

      <div className="relative min-w-0 flex-1">
        {title && (
          <TitleTag className="text-[13px] font-semibold leading-snug tracking-tight text-ink">
            {title}
          </TitleTag>
        )}

        {children && (
          <div
            className={cn(
              'text-[13px] leading-relaxed tracking-tight text-ink-muted',
              title && 'mt-0.5'
            )}
          >
            {children}
          </div>
        )}

        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="relative -mr-1 -mt-1 shrink-0 rounded-[8px] p-1.5 text-ink-faint transition-control duration-fast hover:bg-ink/[0.06] hover:text-ink"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
};

export const alertTones = Object.keys(TONES);

export default Alert;
