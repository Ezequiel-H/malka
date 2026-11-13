import { useState } from 'react';
import { Icon, IconoColor, cn } from '../../../components/ui';
import { Segmentado } from '../../../components/admin/metricas/piezas';
import { Celular } from './MaquetasParticipante';
import { ACTIVIDADES, PROPUESTAS } from './datos';

const precio = (n) => (n ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n) : 'Gratis');

/* Los encuentros de los próximos días, armados con las actividades de ejemplo. */
const DIAS = [
  { clave: 'hoy', titulo: 'Hoy', fecha: 'viernes 13', finde: false, semana: true, items: [['a1', { vas: true }]] },
  { clave: 'sab', titulo: 'Mañana', fecha: 'sábado 14', finde: true, semana: true, items: [['a5', { quedan: 4 }]] },
  { clave: 'mar', titulo: 'Martes', fecha: '17 de noviembre', finde: false, semana: true, items: [['a2', {}]] },
  { clave: 'mie', titulo: 'Miércoles', fecha: '18 de noviembre', finde: false, semana: true, items: [['a3', {}]] },
  {
    clave: 'jue',
    titulo: 'Jueves',
    fecha: '19 de noviembre',
    finde: false,
    semana: true,
    items: [
      ['a4', { lleno: true }],
      ['a6', {}],
    ],
  },
];
const porId = Object.fromEntries(ACTIVIDADES.map((a) => [a.id, a]));

/* Una fila: la hora a la izquierda, el color de la propuesta y lo que importa para decidir. */
const Fila = ({ a, estado }) => {
  const p = PROPUESTAS[a.propuesta];
  return (
    <li>
      <button type="button" className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-3 text-start transition-transform duration-base active:scale-[0.99]">
        <span className="w-11 shrink-0 text-center font-grotesk text-sm font-semibold tabular-nums text-ink">{a.hora}</span>
        <IconoColor icono={p.icono} color={p.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-grotesk font-semibold text-ink">{a.titulo}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="text-ink-muted">{precio(a.precio)}</span>
            {estado.vas && <span className="rounded-pill bg-success-50 px-2 py-0.5 font-semibold text-success-700">Vas</span>}
            {estado.quedan && <span className="rounded-pill bg-warning-50 px-2 py-0.5 font-semibold text-warning-700">Quedan {estado.quedan}</span>}
            {estado.lleno && <span className="rounded-pill bg-ink/[0.06] px-2 py-0.5 font-semibold text-ink-soft">Lleno · lista de espera</span>}
          </span>
        </span>
        <Icon name="chevronRight" size="sm" className="shrink-0 text-ink-faint rtl:-scale-x-100" />
      </button>
    </li>
  );
};

/**
 * Maqueta de la cartelera nueva. En vez de tarjetas grandes con la foto
 * genérica y la descripción entera, la agenda de los próximos días: cada día
 * con sus encuentros, la hora adelante y lo que hace falta para decidir
 * (precio, si quedan pocos lugares, si ya vas). Lo especial (un viaje) va
 * arriba, destacado. Se filtra por cuándo y por propuesta.
 */
const MaquetaCartelera = () => {
  const [cuando, setCuando] = useState('semana');
  const [propuestas, setPropuestas] = useState([]);
  const viaje = porId.a7;
  const dias = DIAS.filter((d) => cuando === 'todo' || (cuando === 'hoy' ? d.clave === 'hoy' : cuando === 'finde' ? d.finde : d.semana))
    .map((d) => ({ ...d, items: d.items.filter(([id]) => !propuestas.length || propuestas.includes(porId[id].propuesta)) }))
    .filter((d) => d.items.length);

  return (
    <Celular activa="cartelera">
      <h1 className="font-grotesk text-[1.7rem] font-semibold tracking-tight text-ink">Cartelera</h1>

      <label className="mt-3 flex min-h-[44px] items-center gap-2 rounded-pill bg-surface px-4 text-ink-muted">
        <Icon name="search" size="sm" />
        <input placeholder="Buscar: yoga, Shabat, cocina…" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint" />
      </label>

      <div className="mt-3">
        <Segmentado
          opciones={[
            { valor: 'hoy', etiqueta: 'Hoy' },
            { valor: 'semana', etiqueta: 'Semana' },
            { valor: 'finde', etiqueta: 'Finde' },
            { valor: 'todo', etiqueta: 'Todo' },
          ]}
          valor={cuando}
          onChange={setCuando}
          etiqueta="Cuándo"
          className="w-full [&>*]:flex-1"
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {Object.entries(PROPUESTAS).map(([n, p]) => {
          const activo = propuestas.includes(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={activo}
              onClick={() => setPropuestas((xs) => (activo ? xs.filter((x) => x !== n) : [...xs, n]))}
              className={cn(
                'inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-pill px-3 text-sm capitalize transition-colors duration-base',
                activo ? 'text-surface' : 'bg-surface text-ink-soft',
              )}
              style={activo ? { background: p.color } : undefined}
            >
              <Icon name={p.icono} size="xs" />
              {n}
            </button>
          );
        })}
      </div>

      {/* Lo especial va arriba: un viaje o un evento grande no se pierde entre los semanales. */}
      {(!propuestas.length || propuestas.includes(viaje.propuesta)) && (
        <article className="mt-5 overflow-hidden rounded-[22px] bg-ink text-surface">
          <div className="p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-label text-surface/60">Especial · del 6 al 8 de diciembre</p>
            <h2 className="mt-1 font-grotesk text-lg font-semibold">{viaje.titulo}</h2>
            <p className="text-sm text-surface/75">Tres días con Shabat en la montaña. Quedan 7 lugares.</p>
            <div className="mt-3 h-1.5 rounded-pill bg-surface/15">
              <div className="h-1.5 rounded-pill bg-surface" style={{ width: `${(viaje.inscriptos / viaje.cupo) * 100}%` }} />
            </div>
          </div>
          <span className="flex items-center justify-between border-t border-surface/15 px-4 py-3 text-sm font-semibold">
            Ver el viaje
            <Icon name="chevronRight" size="sm" className="rtl:-scale-x-100" />
          </span>
        </article>
      )}

      <div key={`${cuando}-${propuestas.join()}`} className="mt-5 animate-fade-in space-y-5">
        {dias.length ? (
          dias.map((d) => (
            <section key={d.clave}>
              <h2 className="mb-2 flex items-baseline gap-2 px-1">
                <span className="font-grotesk text-base font-semibold text-ink">{d.titulo}</span>
                <span className="text-sm text-ink-muted">{d.fecha}</span>
              </h2>
              <ul className="space-y-2">
                {d.items.map(([id, estado]) => (
                  <Fila key={id} a={porId[id]} estado={estado} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="rounded-[18px] border border-dashed border-surface-border px-4 py-6 text-center text-sm text-ink-muted">No hay nada de eso en estos días. Probá con «Todo».</p>
        )}
      </div>
    </Celular>
  );
};

export default MaquetaCartelera;
