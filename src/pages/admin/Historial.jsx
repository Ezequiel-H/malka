import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageContainer from '../../components/layout/PageContainer';
import { Badge, Button, DatePicker, EmptyState, Field, Input, Skeleton, Table, cn, useConfirm } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import useCargaSuave from '../../hooks/useCargaSuave';
import useDebounce from '../../hooks/useDebounce';
import { numero } from '../../components/admin/metricas/piezas';
import FormVisita from '../../components/admin/historial/FormVisita';
import ImportarPlanilla from '../../components/admin/historial/ImportarPlanilla';

/* Cómo llegó cada fila al historial. El color es de estado del DS y siempre
   va con su texto. */
export const ORIGENES = {
  inscripcion: { etiqueta: 'Se anotó', tono: 'success' },
  sin_anotarse: { etiqueta: 'Vino sin anotarse', tono: 'warning' },
  manual: { etiqueta: 'Cargado a mano', tono: 'info' },
  importado: { etiqueta: 'Planilla', tono: 'neutral' },
};

const titulo = (t) => (t ?? '').replace(/^\[[A-Z]\]\s*/, '');
const fecha = (f) => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const POR_PAGINA = 50;

/* A dónde lleva el nombre de cada persona: su ficha (cuenta o contacto). */
export const linkPersona = (p) => (p.tipo === 'usuario' ? `/admin/users/${p.id}` : `/admin/contactos/${p.id}`);
/* Y el encuentro: la actividad de la app o el evento en métricas. */
const linkEncuentro = (e) =>
  e.actividadId
    ? `/admin/metricas?vista=actividades&actividad=${e.actividadId}`
    : `/admin/metricas?vista=actividades&actividad=${encodeURIComponent(`ev:${normalizarEvento(e.evento)}`)}`;
const normalizarEvento = (t) =>
  String(t ?? '')
    .replace(/\s*-?\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/, '')
    .replace(/\s*-\s*$/, '')
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * El historial de quién vino a Malka, todo junto: las inscripciones de las
 * actividades (se suman solas), la gente que vino sin anotarse, lo que el
 * equipo carga a mano y la planilla histórica. Desde acá se suma una visita,
 * se importa la planilla y se llega a la ficha de cada persona.
 */
const Historial = () => {
  const [params, setParams] = useSearchParams();
  const confirmar = useConfirm();
  const { showSuccess, showError } = useToast();
  const [busqueda, setBusqueda] = useState(params.get('q') ?? '');
  const q = useDebounce(busqueda.trim(), 300);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ abierto: false, visita: null });
  const [importando, setImportando] = useState(false);
  const origenes = (params.get('origen') ?? '').split(',').filter(Boolean);
  const desde = params.get('desde') ?? '';
  const hasta = params.get('hasta') ?? '';

  const poner = (cambios) => {
    setPagina(1);
    setParams(
      (actual) => {
        const n = new URLSearchParams(actual);
        for (const [k, v] of Object.entries(cambios)) {
          if (!v || (Array.isArray(v) && !v.length)) n.delete(k);
          else n.set(k, Array.isArray(v) ? v.join(',') : v);
        }
        return n;
      },
      { replace: true }
    );
  };

  const clave = `${q}|${origenes.join(',')}|${desde}|${hasta}|${pagina}`;
  const { datos, cargando, actualizando, recargar } = useCargaSuave(
    (signal) =>
      axios
        .get('/historial', {
          params: {
            q: q || undefined,
            origen: origenes.join(',') || undefined,
            from: desde && hasta ? desde : undefined,
            to: desde && hasta ? hasta : undefined,
            page: 1,
            limit: POR_PAGINA * pagina,
          },
          signal,
        })
        .then((r) => r.data),
    clave
  );

  const borrar = async (fila) => {
    const ok = await confirmar({
      title: `¿Sacar a ${fila.persona.nombre} de ${titulo(fila.encuentro.titulo)}?`,
      description: 'La visita deja de contar en el historial y en las métricas.',
      confirmLabel: 'Sacar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await axios.delete(`/historial/${fila.id}`);
      showSuccess('Visita borrada');
      recargar();
    } catch (error) {
      showError(error.response?.data?.message || 'No se pudo borrar');
    }
  };

  const alternarOrigen = (o) => poner({ origen: origenes.includes(o) ? origenes.filter((x) => x !== o) : [...origenes, o] });

  return (
    <PageContainer
      title="Historial"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="upload" onClick={() => setImportando(true)}>
            Importar planilla
          </Button>
          <Button icon="add" onClick={() => setForm({ abierto: true, visita: null })}>
            Sumar visita
          </Button>
        </div>
      }
    >
      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ink-muted">
        Todas las veces que alguien vino a Malka: las inscripciones de las actividades se suman solas, y acá se agrega lo demás
        (quien vino sin anotarse, eventos que no están en la app, la planilla). Todo cuenta en las métricas.
      </p>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <Field label="Buscar" htmlFor="historial-q" className="mb-0 lg:w-80">
          <Input id="historial-q" icon="search" value={busqueda} onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }} placeholder="Persona, mail o evento" />
        </Field>
        <div className="flex gap-3 [&>*]:min-w-0 [&>*]:flex-1 lg:[&>*]:w-44 lg:[&>*]:flex-none">
          <Field label="Desde" htmlFor="historial-desde" className="mb-0">
            <DatePicker id="historial-desde" value={desde} onChange={(v) => poner({ desde: v })} clearable max={hasta || undefined} />
          </Field>
          <Field label="Hasta" htmlFor="historial-hasta" className="mb-0">
            <DatePicker id="historial-hasta" value={hasta} onChange={(v) => poner({ hasta: v })} clearable min={desde || undefined} />
          </Field>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por cómo llegó">
        {Object.entries(ORIGENES).map(([o, def]) => {
          const activo = origenes.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={activo}
              onClick={() => alternarOrigen(o)}
              className={cn(
                'inline-flex min-h-[36px] items-center gap-2 rounded-pill border px-3.5 text-sm font-medium transition-colors duration-base',
                activo ? 'border-ink bg-ink text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/30 hover:text-ink'
              )}
            >
              {def.etiqueta}
              {datos && <span className={cn('tabular-nums', activo ? 'text-surface/70' : 'text-ink-faint')}>{numero(datos.porOrigen[o] ?? 0)}</span>}
            </button>
          );
        })}
        {(origenes.length > 0 || desde || hasta || q) && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setBusqueda('');
              poner({ origen: [], desde: '', hasta: '' });
            }}
          >
            Sacar filtros
          </Button>
        )}
      </div>

      {cargando || !datos ? (
        <Skeleton className="h-96 rounded-card" />
      ) : (
        <div className={cn('transition-opacity duration-base', actualizando && 'opacity-50')}>
          <p className="mb-3 text-sm text-ink-muted">
            <span className="font-semibold text-ink">{numero(datos.total)}</span> visitas de{' '}
            <span className="font-semibold text-ink">{numero(datos.personas)}</span> personas
          </p>
          <Table
            stacked
            rows={datos.filas}
            rowKey={(f) => f.id}
            empty={
              <EmptyState
                icon="time"
                title="No hay visitas con estos filtros"
                description="Sacá algún filtro, o sumá una visita o importá la planilla."
              />
            }
            columns={[
              { key: 'fecha', header: 'Fecha', render: (f) => <span className="whitespace-nowrap tabular-nums">{fecha(f.fecha)}</span> },
              {
                key: 'persona',
                header: 'Persona',
                render: (f) => (
                  <span className="min-w-0">
                    <Link to={linkPersona(f.persona)} className="block font-medium text-ink hover:text-primary-700 hover:underline">
                      {f.persona.nombre}
                    </Link>
                    {f.persona.tipo === 'contacto' && <span className="text-xs text-ink-muted">Sin cuenta</span>}
                  </span>
                ),
              },
              {
                key: 'encuentro',
                header: 'A qué vino',
                render: (f) => (
                  <span className="min-w-0">
                    <Link to={linkEncuentro(f.encuentro)} className="block text-ink-soft hover:text-primary-700 hover:underline">
                      {titulo(f.encuentro.titulo)}
                    </Link>
                    {f.encuentro.categorias?.length > 0 && <span className="text-xs text-ink-muted">{f.encuentro.categorias.join(' · ')}</span>}
                  </span>
                ),
              },
              {
                key: 'origen',
                header: 'Cómo',
                render: (f) => <Badge tone={ORIGENES[f.origen]?.tono}>{ORIGENES[f.origen]?.etiqueta ?? f.origen}</Badge>,
              },
              {
                key: 'acciones',
                header: <span className="sr-only">Acciones</span>,
                align: 'right',
                render: (f) =>
                  f.editable ? (
                    <span className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon="edit" iconOnly label="Editar visita" onClick={() => setForm({ abierto: true, visita: f })} />
                      <Button variant="ghost" size="sm" icon="delete" iconOnly label="Borrar visita" onClick={() => borrar(f)} />
                    </span>
                  ) : (
                    <span className="text-xs text-ink-faint">Desde la inscripción</span>
                  ),
              },
            ]}
          />
          {datos.total > datos.filas.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" size="sm" loading={actualizando} onClick={() => setPagina((p) => p + 1)}>
                Ver más ({numero(datos.total - datos.filas.length)} restantes)
              </Button>
            </div>
          )}
        </div>
      )}

      <FormVisita
        abierto={form.abierto}
        visita={form.visita}
        onCerrar={() => setForm({ abierto: false, visita: null })}
        onGuardada={() => {
          setForm({ abierto: false, visita: null });
          recargar();
        }}
      />
      <ImportarPlanilla
        abierto={importando}
        onCerrar={() => setImportando(false)}
        onImportada={() => {
          setImportando(false);
          recargar();
        }}
      />
    </PageContainer>
  );
};

export default Historial;
