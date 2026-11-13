import { Link } from 'react-router-dom';
import { Icon, cn } from '../../../components/ui';
import { PROPUESTAS } from './datos';

/**
 * Piezas de las maquetas. Si el rediseño se aprueba, el botón pastilla pasa
 * a ser una variante del Button del DS (no un componente aparte).
 */
export const Boton = ({ variante = 'tinta', tamano = 'md', icono, to, onClick, className, children, ...props }) => {
  const clases = cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-grotesk font-semibold transition-[background-color,color,box-shadow] duration-base ease-standard focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink/20',
    tamano === 'sm' ? 'min-h-[34px] px-3.5 text-sm' : 'min-h-[42px] px-5 text-[0.95rem]',
    variante === 'tinta' && 'bg-ink text-surface hover:bg-primary-800',
    variante === 'suave' && 'bg-ink/[0.06] text-ink hover:bg-ink/10',
    variante === 'borde' && 'border border-ink/15 bg-surface text-ink hover:border-ink/30',
    variante === 'verde' && 'bg-primary-600 text-surface hover:bg-primary-700',
    className
  );
  const contenido = (
    <>
      {icono && <Icon name={icono} size="sm" />}
      {children}
    </>
  );
  return to ? (
    <Link to={to} className={clases} {...props}>
      {contenido}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={clases} {...props}>
      {contenido}
    </button>
  );
};

/* El ícono de una propuesta sobre su color: se reconoce la actividad sin leer. */
export const IconoPropuesta = ({ propuesta, tamano = 'md' }) => {
  const p = PROPUESTAS[propuesta] ?? { color: '#6b7a72', icono: 'activity' };
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-[14px]', tamano === 'lg' ? 'h-14 w-14' : tamano === 'sm' ? 'h-8 w-8 rounded-[10px]' : 'h-11 w-11')}
      style={{ background: `${p.color}1a`, color: p.color }}
    >
      <Icon name={p.icono} size={tamano === 'sm' ? 'sm' : 'md'} />
    </span>
  );
};

const TONOS_AVATAR = ['#689b78', '#b0567a', '#c98a1e', '#3d7d99', '#7c5cbf', '#c4453c'];
/* Iniciales en un círculo: las caras de quién viene, sin fotos. */
export const Avatar = ({ nombre, tamano = 28, borde = true }) => {
  const iniciales = nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  const tono = TONOS_AVATAR[nombre.length % TONOS_AVATAR.length];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-pill font-grotesk text-[0.66rem] font-semibold tracking-tight text-surface', borde && 'ring-2 ring-surface')}
      style={{ width: tamano, height: tamano, background: tono }}
      title={nombre}
    >
      {iniciales}
    </span>
  );
};

export const Avatares = ({ nombres, total, max = 5, tamano = 28 }) => (
  <span className="flex items-center">
    <span className="flex -space-x-1.5">
      {nombres.slice(0, max).map((n) => (
        <Avatar key={n} nombre={n} tamano={tamano} />
      ))}
    </span>
    {total > max && <span className="ml-2 text-xs font-medium text-ink-muted">+{total - max}</span>}
  </span>
);

/* Cuánto del cupo está lleno, con color que avisa cuando se llena. */
export const BarraCupo = ({ inscriptos, cupo, ancho = 'w-28' }) => {
  if (!cupo) return <span className="text-xs text-ink-muted">{inscriptos} anotados · sin cupo</span>;
  const pct = Math.min(100, Math.round((inscriptos / cupo) * 100));
  const color = pct >= 100 ? '#c4453c' : pct >= 80 ? '#c98a1e' : '#537f61';
  return (
    <span className="flex flex-col gap-1">
      <span className="text-xs tabular-nums text-ink-soft">
        <span className="font-semibold text-ink">{inscriptos}</span>/{cupo} {pct >= 100 ? '· lleno' : ''}
      </span>
      <span className={cn('h-1.5 overflow-hidden rounded-pill bg-ink/[0.07]', ancho)}>
        <span className="block h-full rounded-pill transition-[width] duration-slow" style={{ width: `${pct}%`, background: color }} />
      </span>
    </span>
  );
};

/* El aviso de que esto es una maqueta, arriba de todo. */
export const AvisoMaqueta = ({ children }) => (
  <p className="mb-6 flex items-start gap-2 rounded-control bg-primary-50 px-4 py-3 text-sm text-ink-soft">
    <Icon name="sparkles" size="sm" className="mt-0.5 shrink-0 text-primary-700" />
    <span>{children}</span>
  </p>
);
