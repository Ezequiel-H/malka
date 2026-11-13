import Icon from './Icon';
import cn from './cn';

/* Tono suave por defecto: sobre fondo crema, los badges sólidos y saturados
   compiten con el contenido. `solid` queda para lo que sí debe gritar. */
const TONES = {
  neutral: 'bg-ink/[0.05] text-ink-soft border-transparent',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-500/20',
  warning: 'bg-warning-50 text-warning-700 border-warning-500/20',
  danger: 'bg-danger-50 text-danger-700 border-danger-500/20',
  info: 'bg-info-50 text-info-700 border-info-500/20',
};

const SOLID_TONES = {
  neutral: 'bg-ink-muted text-white border-transparent',
  primary: 'bg-primary text-white border-transparent',
  success: 'bg-success-500 text-white border-transparent',
  warning: 'bg-warning-500 text-white border-transparent',
  danger: 'bg-danger-500 text-white border-transparent',
  info: 'bg-info-500 text-white border-transparent',
};

const SIZES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

/**
 * Etiqueta de estado.
 *
 *   <Badge tone="success" icon="check">Confirmada</Badge>
 *   <Badge tone="warning" dot>Pendiente</Badge>
 *
 * `dot` muestra un punto en vez de un icono: sirve para estados donde el
 * color ya comunica y un icono sería ruido.
 */
const Badge = ({
  tone = 'neutral',
  size = 'md',
  solid = false,
  icon,
  dot = false,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-pill border font-semibold',
      solid ? SOLID_TONES[tone] : TONES[tone],
      SIZES[size],
      className
    )}
    {...props}
  >
    {dot && (
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-pill', solid ? 'bg-white/80' : 'bg-current')}
      />
    )}
    {icon && <Icon name={icon} size="xs" />}
    {children}
  </span>
);

export const badgeTones = Object.keys(TONES);

export default Badge;
