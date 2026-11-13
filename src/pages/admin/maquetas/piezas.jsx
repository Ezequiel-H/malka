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

/* Las piezas que pasaron al DS: las maquetas usan las mismas. */
export { Avatar, Avatares, BarraCupo } from '../../../components/ui';

/* El aviso de que esto es una maqueta, arriba de todo. */
export const AvisoMaqueta = ({ children }) => (
  <p className="mb-6 flex items-start gap-2 rounded-control bg-primary-50 px-4 py-3 text-sm text-ink-soft">
    <Icon name="sparkles" size="sm" className="mt-0.5 shrink-0 text-primary-700" />
    <span>{children}</span>
  </p>
);
