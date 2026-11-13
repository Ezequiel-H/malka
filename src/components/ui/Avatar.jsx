import cn from './cn';

/* Tonos para las iniciales: el mismo nombre siempre cae en el mismo. */
const TONOS = ['#689b78', '#b0567a', '#c98a1e', '#3d7d99', '#7c5cbf', '#c4453c'];
const tonoDe = (nombre) => TONOS[[...String(nombre)].reduce((t, c) => t + c.charCodeAt(0), 0) % TONOS.length];

/**
 * Las iniciales de una persona en un círculo de color: las caras de quién
 * viene sin necesidad de fotos.
 */
export const Avatar = ({ nombre = '', tamano = 28, borde = true, className }) => {
  const iniciales = String(nombre)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-grotesk text-[0.66rem] font-semibold tracking-tight text-surface',
        borde && 'ring-2 ring-surface',
        className
      )}
      style={{ width: tamano, height: tamano, background: tonoDe(nombre) }}
      title={nombre}
    >
      {iniciales}
    </span>
  );
};

/** Varias caras superpuestas y «+N» para el resto. */
export const Avatares = ({ nombres = [], total = nombres.length, max = 5, tamano = 28 }) => (
  <span className="flex items-center">
    <span className="flex -space-x-1.5">
      {nombres.slice(0, max).map((n, i) => (
        <Avatar key={`${n}-${i}`} nombre={n} tamano={tamano} />
      ))}
    </span>
    {total > Math.min(max, nombres.length) && <span className="ms-2 text-xs font-medium text-ink-muted">+{total - Math.min(max, nombres.length)}</span>}
  </span>
);

export default Avatar;
