import { useState } from 'react';
import { Icon, cn } from '../../../components/ui';
import { Segmentado } from '../../../components/admin/metricas/piezas';
import { Avatares, BarraCupo, Boton, IconoPropuesta } from './piezas';
import { ACTIVIDADES, PERSONAS, PROPUESTAS } from './datos';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const nombres = PERSONAS.map((p) => `${p.nombre} ${p.apellido}`);
const precio = (n) => (n ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n) : 'Gratis');

/* El panel del costado: todo de una actividad sin dejar la lista. */
const Detalle = ({ actividad, onCerrar }) => {
  const p = PROPUESTAS[actividad.propuesta];
  return (
    <aside className="animate-fade-in-up overflow-hidden rounded-[22px] border border-surface-border bg-surface shadow-raised lg:sticky lg:top-24">
      <div className="relative h-28" style={{ background: `linear-gradient(135deg, ${p.color}26, ${p.color}0d)` }}>
        <span className="absolute bottom-0 start-6 translate-y-1/2">
          <IconoPropuesta propuesta={actividad.propuesta} tamano="lg" />
        </span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-pill bg-surface/80 text-ink-soft hover:bg-surface">
          <Icon name="close" size="sm" />
        </button>
      </div>
      <div className="px-6 pb-6 pt-10">
        <h3 className="font-grotesk text-xl font-semibold tracking-tight text-ink">{actividad.titulo}</h3>
        <p className="mt-1 text-sm text-ink-muted">{actividad.cuando}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ['Anotados', actividad.inscriptos],
            ['En espera', actividad.espera],
            ['Por aprobar', actividad.pendientes],
          ].map(([t, v]) => (
            <div key={t} className="rounded-[14px] bg-surface-sunken px-2 py-3">
              <p className="font-grotesk text-2xl font-semibold tabular-nums text-ink">{v}</p>
              <p className="text-xs text-ink-muted">{t}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink-faint">Próximo encuentro · {actividad.proxima}</p>
          <BarraCupo inscriptos={actividad.inscriptos} cupo={actividad.cupo} ancho="w-full" />
          <div className="mt-3">
            <Avatares nombres={nombres} total={actividad.inscriptos} max={7} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Boton icono="users" className="col-span-2">
            Ver inscriptos
          </Boton>
          <Boton variante="suave" icono="check" tamano="sm">
            Asistencia
          </Boton>
          <Boton variante="suave" icono="download" tamano="sm">
            Exportar
          </Boton>
          <Boton variante="suave" icono="copy" tamano="sm">
            Duplicar
          </Boton>
          <Boton variante="suave" icono="edit" tamano="sm">
            Editar
          </Boton>
        </div>
      </div>
    </aside>
  );
};

/**
 * Maqueta del nuevo listado de actividades. Cada actividad es una fila que se
 * lee de un vistazo: el ícono y color de su propuesta, cuándo es, cómo viene
 * el cupo y quiénes vienen. Tocarla abre su detalle al costado. La vista
 * «Semana» muestra lo mismo como un calendario.
 */
const MaquetaActividades = () => {
  const [vista, setVista] = useState('lista');
  const [elegida, setElegida] = useState(ACTIVIDADES[0].id);
  const [propuestas, setPropuestas] = useState([]);
  const actividad = ACTIVIDADES.find((a) => a.id === elegida);
  const visibles = ACTIVIDADES.filter((a) => !propuestas.length || propuestas.includes(a.propuesta));

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmentado
            opciones={[
              { valor: 'lista', etiqueta: 'Lista' },
              { valor: 'semana', etiqueta: 'Semana' },
            ]}
            valor={vista}
            onChange={setVista}
            etiqueta="Cómo ver"
          />
          <label className="flex min-h-[44px] flex-1 items-center gap-2 rounded-pill border border-surface-border bg-surface px-4 text-ink-muted lg:w-72 lg:flex-none">
            <Icon name="search" size="sm" />
            <input placeholder="Buscar actividad" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint" />
            <kbd className="hidden rounded-[6px] border border-surface-border px-1.5 text-[0.7rem] text-ink-faint sm:inline">⌘K</kbd>
          </label>
        </div>
        <Boton icono="add">Nueva actividad</Boton>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {Object.entries(PROPUESTAS).map(([nombre, p]) => {
          const activo = propuestas.includes(nombre);
          return (
            <button
              key={nombre}
              type="button"
              aria-pressed={activo}
              onClick={() => setPropuestas((ps) => (activo ? ps.filter((x) => x !== nombre) : [...ps, nombre]))}
              className={cn(
                'inline-flex min-h-[36px] shrink-0 items-center gap-2 rounded-pill border px-3 text-sm capitalize transition-colors duration-base',
                activo ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25'
              )}
              style={activo ? { background: p.color } : undefined}
            >
              <Icon name={p.icono} size="xs" />
              {nombre}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <div key={vista} className="animate-fade-in">
          {vista === 'lista' ? (
            <ul className="divide-y divide-surface-border overflow-hidden rounded-[22px] border border-surface-border bg-surface">
              {visibles.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setElegida(a.id)}
                    className={cn(
                      'group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-start transition-colors duration-base sm:grid-cols-[auto_minmax(0,1fr)_8rem_auto] md:grid-cols-[auto_minmax(0,1fr)_8rem_6.5rem_auto] xl:grid-cols-[auto_minmax(0,1fr)_8rem_6.5rem_13.5rem]',
                      elegida === a.id ? 'bg-primary-50/70' : 'hover:bg-ink/[0.02]'
                    )}
                  >
                    <IconoPropuesta propuesta={a.propuesta} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-grotesk font-semibold text-ink">{a.titulo}</span>
                        {a.estado === 'borrador' && <span className="rounded-pill bg-ink/[0.06] px-2 py-0.5 text-[0.7rem] font-medium text-ink-muted">Borrador</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-muted">{a.cuando}</span>
                    </span>
                    <span className="hidden sm:block">
                      <BarraCupo inscriptos={a.inscriptos} cupo={a.cupo} />
                    </span>
                    <span className="hidden flex-col items-end gap-1 md:flex">
                      <span className="text-xs text-ink-muted">Próximo</span>
                      <span className="text-sm font-medium capitalize text-ink">{a.proxima}</span>
                    </span>
                    <span className="flex items-center justify-end gap-3">
                      {a.pendientes > 0 && (
                        <span className="whitespace-nowrap rounded-pill bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700" title="Por aprobar">
                          {a.pendientes}
                          <span className="hidden sm:inline"> por aprobar</span>
                        </span>
                      )}
                      <span className="hidden text-sm font-semibold tabular-nums text-ink lg:inline">{precio(a.precio)}</span>
                      <Icon name="chevronRight" size="sm" className="text-ink-faint transition-transform duration-base group-hover:translate-x-0.5 rtl:-scale-x-100" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-[22px] border border-surface-border bg-surface p-4">
              <div className="grid min-w-[44rem] grid-cols-7 gap-2">
                {DIAS.map((d, i) => (
                  <div key={d} className="min-h-[18rem]">
                    <p className={cn('mb-2 rounded-pill px-2 py-1 text-center text-xs font-semibold', i === 4 ? 'bg-ink text-surface' : 'text-ink-muted')}>
                      {d} {11 + i}
                    </p>
                    <div className="space-y-2">
                      {ACTIVIDADES.filter((a) => a.dia === i && visibles.includes(a)).map((a) => {
                        const p = PROPUESTAS[a.propuesta];
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setElegida(a.id)}
                            className="block w-full rounded-[12px] p-2.5 text-start transition-transform duration-base hover:-translate-y-0.5"
                            style={{ background: `${p.color}1f` }}
                          >
                            <span className="text-[0.7rem] font-semibold tabular-nums" style={{ color: p.color }}>
                              {a.hora}
                            </span>
                            <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink">{a.titulo}</span>
                            <span className="mt-2 block">
                              <BarraCupo inscriptos={a.inscriptos} cupo={a.cupo} ancho="w-full" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {actividad && <Detalle key={actividad.id} actividad={actividad} onCerrar={() => setElegida(null)} />}
      </div>
    </div>
  );
};

export default MaquetaActividades;
