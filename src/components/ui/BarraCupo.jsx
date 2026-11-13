import cn from './cn';

/**
 * Cuánto del cupo está lleno. La barra se pone ámbar al 80 % y roja cuando
 * se llena, y el número está escrito al lado: el color nunca va solo.
 */
const BarraCupo = ({ inscriptos, cupo, ancho = 'w-28', textoSinCupo }) => {
  if (!cupo) return <span className="text-xs text-ink-muted">{textoSinCupo ?? `${inscriptos} anotados · sin cupo`}</span>;
  const pct = Math.min(100, Math.round((inscriptos / cupo) * 100));
  const color = pct >= 100 ? '#c4453c' : pct >= 80 ? '#c98a1e' : '#537f61';
  return (
    <span className="flex flex-col gap-1">
      <span className="text-xs tabular-nums text-ink-soft">
        <span className="font-semibold text-ink">{inscriptos}</span>/{cupo}
        {pct >= 100 ? ' · lleno' : ''}
      </span>
      <span className={cn('h-1.5 overflow-hidden rounded-pill bg-ink/[0.07]', ancho)}>
        <span className="block h-full rounded-pill transition-[width] duration-slow" style={{ width: `${pct}%`, background: color }} />
      </span>
    </span>
  );
};

export default BarraCupo;
