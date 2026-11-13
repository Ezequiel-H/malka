import { BarraCupo, cn } from '../../ui';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* "2026-11-09" más n días, sin pasar por la zona horaria del navegador. */
const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/* Un encuentro: la hora y el título sobre el tinte de su color. */
const Bloque = ({ e, color, elegida, onElegir }) => (
  <button
    type="button"
    onClick={() => onElegir(e.actividad.id)}
    aria-pressed={elegida === e.actividad.id}
    className={cn(
      'block w-full rounded-[12px] p-2.5 text-start transition-[transform,box-shadow] duration-base hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
      elegida === e.actividad.id && 'ring-2 ring-ink/25',
    )}
    style={{ background: `${color}1f` }}
  >
    <span className="text-[0.7rem] font-semibold tabular-nums" style={{ color }}>
      {e.hora || 'Sin hora'}
    </span>
    <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink">{e.actividad.titulo}</span>
    <span className="mt-2 block">
      <BarraCupo inscriptos={e.aceptadas} cupo={e.actividad.cupo} ancho="w-full" textoSinCupo={`${e.aceptadas} anotados`} />
    </span>
  </button>
);

/**
 * La semana como calendario: un bloque por encuentro, del color de su tag.
 * En pantallas chicas los días van uno abajo del otro (siete columnas no
 * entran en 375 px); desde `sm`, la grilla de siete.
 */
const SemanaActividades = ({ semana, actividades, colorDe, elegida, onElegir }) => {
  const dias = DIAS.map((corto, i) => {
    const fecha = sumarDias(semana.desde, i);
    const encuentros = actividades
      .flatMap((a) => a.semana.filter((e) => e.dia === i).map((e) => ({ ...e, actividad: a })))
      .sort((x, y) => String(x.hora ?? '').localeCompare(String(y.hora ?? '')));
    return {
      i,
      corto,
      largo: DIAS_LARGOS[i],
      numero: Number(fecha.slice(8, 10)),
      esHoy: fecha === semana.hoy,
      encuentros,
    };
  });

  return (
    <div className="rounded-[22px] border border-surface-border bg-surface p-3 sm:p-4">
      {/* Teléfono: un día abajo del otro. */}
      <ol className="space-y-3 sm:hidden">
        {dias.map((d) => (
          <li key={d.i} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
            <p className={cn('rounded-[12px] py-1.5 text-center', d.esHoy ? 'bg-ink text-surface' : 'text-ink-muted')}>
              <span className="block text-xs font-semibold">{d.corto}</span>
              <span className="block font-grotesk text-lg font-semibold leading-tight">{d.numero}</span>
            </p>
            <div className="min-w-0 space-y-2 border-b border-surface-border pb-3">
              {d.encuentros.length ? (
                d.encuentros.map((e) => (
                  <Bloque key={`${e.actividad.id}-${e.fecha}`} e={e} color={colorDe(e.actividad)} elegida={elegida} onElegir={onElegir} />
                ))
              ) : (
                <p className="py-2 text-sm text-ink-faint">Sin actividades</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Desde sm: la grilla de siete días. */}
      <div className="hidden overflow-x-auto sm:block">
        <div className="grid min-w-[44rem] grid-cols-7 gap-2">
          {dias.map((d) => (
            <div key={d.i} className="min-h-[18rem]">
              <p
                className={cn('mb-2 rounded-pill px-2 py-1 text-center text-xs font-semibold', d.esHoy ? 'bg-ink text-surface' : 'text-ink-muted')}
                title={d.largo}
              >
                {d.corto} {d.numero}
              </p>
              <div className="space-y-2">
                {d.encuentros.map((e) => (
                  <Bloque key={`${e.actividad.id}-${e.fecha}`} e={e} color={colorDe(e.actividad)} elegida={elegida} onElegir={onElegir} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SemanaActividades;
