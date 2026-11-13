import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_PUBLIC_TAG_COLOR, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import { formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { getActivityShareUrl } from '../../utils/activityShareUrl';
import { formatActivityPrice } from '../../utils/priceUtils';
import useCargaSuave from '../../hooks/useCargaSuave';
import PageContainer from '../../components/layout/PageContainer';
import { Alert, BarraCupo, Button, EmptyState, Icon, IconoColor, Modal, SkeletonRows, cn, useConfirm } from '../../components/ui';
import { Segmentado } from '../../components/admin/metricas/piezas';
import DetalleActividad from '../../components/admin/actividades/DetalleActividad';
import SemanaActividades from '../../components/admin/actividades/SemanaActividades';
import ExportModal from '../../components/activities/ExportModal';

/* «Activas» son las publicadas y los borradores: lo que el equipo mira a
   diario. Las eliminadas quedan a un toque para volver a activarlas. */
const ESTADOS = [
  { valor: '', etiqueta: 'Activas' },
  { valor: 'publicada', etiqueta: 'Publicadas' },
  { valor: 'borrador', etiqueta: 'Borradores' },
  { valor: 'eliminada', etiqueta: 'Eliminadas' },
];
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const VISTAS = [
  { valor: 'lista', etiqueta: 'Lista' },
  { valor: 'semana', etiqueta: 'Semana' },
];

/* En pantallas anchas el detalle va al costado; en las angostas, en una hoja
   que sube desde abajo (nunca debajo de la lista, donde nadie lo ve). */
const ANCHO = '(min-width: 1024px)';
const useEsAncho = () => {
  const [ancho, setAncho] = useState(() => window.matchMedia(ANCHO).matches);
  useEffect(() => {
    const mq = window.matchMedia(ANCHO);
    const cambio = () => setAncho(mq.matches);
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);
  return ancho;
};

/**
 * Actividades del equipo. Cada una es una fila que se lee de un vistazo: el
 * ícono y color de su tag, cuándo es, cómo viene el cupo del próximo
 * encuentro y cuántos esperan aprobación. Tocarla abre su detalle con las
 * acciones. La vista «Semana» muestra los encuentros de esta semana como
 * calendario. Vista, búsqueda, estado, tags y la actividad abierta viven en
 * la URL; los filtros se suman y los resuelve el back.
 */
const ActivitiesManagement = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const esAncho = useEsAncho();
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') === 'semana' ? 'semana' : 'lista';
  const estado = params.get('estado') ?? '';
  const q = params.get('q') ?? '';
  const tags = (params.get('tags') ?? '').split(',').filter(Boolean);
  const sel = params.get('act');

  const [texto, setTexto] = useState(q);
  const [catalogo, setCatalogo] = useState([]);
  const [ocupado, setOcupado] = useState(null);
  const [exportActivity, setExportActivity] = useState(null);
  const [exportDates, setExportDates] = useState([]);
  const [exportDatesLoading, setExportDatesLoading] = useState(false);

  /* Cambia un parámetro de la URL sin sumar una entrada al historial. */
  const cambiar = useCallback(
    (cambios) =>
      setParams(
        (prev) => {
          const sig = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(cambios)) {
            if (v === null || v === '' || (Array.isArray(v) && !v.length)) sig.delete(k);
            else sig.set(k, Array.isArray(v) ? v.join(',') : v);
          }
          return sig;
        },
        { replace: true },
      ),
    [setParams],
  );

  /* La búsqueda va a la URL (y al back) 250 ms después de la última tecla. */
  useEffect(() => {
    if (texto.trim() === q) return undefined;
    const t = window.setTimeout(() => cambiar({ q: texto.trim() }), 250);
    return () => window.clearTimeout(t);
  }, [texto, q, cambiar]);

  useEffect(() => {
    let cancelado = false;
    axios
      .get('/tags')
      .then((res) => !cancelado && setCatalogo(res.data.tags || []))
      .catch((e) => console.error('Error loading tag catalog:', e));
    return () => {
      cancelado = true;
    };
  }, []);

  const tagsClave = tags.join(',');
  const { datos, cargando, actualizando, error, recargar } = useCargaSuave(
    (signal) =>
      axios
        .get('/admin/actividades-resumen', {
          params: {
            estado: estado || undefined,
            q: q || undefined,
            tags: tagsClave || undefined,
          },
          signal,
        })
        .then((r) => r.data),
    `${estado}|${q}|${tagsClave}`,
  );
  const actividades = datos?.actividades ?? [];

  const tagDe = (a) => a.categorias?.[0];
  const colorDe = (a) => (tagDe(a) ? publicTagColor(catalogo, tagDe(a)) : DEFAULT_PUBLIC_TAG_COLOR);
  const iconoDe = (a) => (tagDe(a) && publicTagIcon(catalogo, tagDe(a))) || 'activity';

  /* En pantalla ancha siempre hay una abierta (la primera si no se eligió);
     en el teléfono, sólo la que se tocó. */
  const elegida = actividades.find((a) => a.id === sel) ?? (esAncho ? actividades[0] : null) ?? null;
  const elegir = (id) => cambiar({ act: id });
  const cerrar = () => cambiar({ act: null });

  const toggleTag = (nombre) =>
    cambiar({
      tags: tags.includes(nombre) ? tags.filter((t) => t !== nombre) : [...tags, nombre],
    });
  const hayFiltros = Boolean(q || tags.length || estado);
  const limpiar = () => {
    setTexto('');
    cambiar({ q: null, tags: null, estado: null });
  };

  /* ---------- Acciones ---------- */

  const handleDelete = async (activityId, currentEstado) => {
    const isEliminada = currentEstado === 'eliminada';
    const ok = await confirm(
      isEliminada
        ? {
            title: '¿Volver a activar esta actividad?',
            description: 'Vuelve a publicarse y los participantes van a poder verla.',
            confirmLabel: 'Activar',
            tone: 'primary',
          }
        : {
            title: '¿Eliminar esta actividad?',
            description: 'Deja de verse en la cartelera. Podés volver a activarla después.',
            confirmLabel: 'Eliminar',
          },
    );
    if (!ok) return;

    try {
      if (isEliminada) {
        // Se vuelve a guardar la actividad completa, sin los campos del sistema, como publicada.
        const response = await axios.get(`/activities/${activityId}`);
        // eslint-disable-next-line no-unused-vars -- se descartan los campos del sistema
        const { _id, __v, createdAt, updatedAt, organizadorId, ...updateData } = response.data.activity;
        updateData.estado = 'publicada';
        await axios.put(`/activities/${activityId}`, updateData);
        showSuccess('Actividad reactivada exitosamente');
      } else {
        await axios.delete(`/activities/${activityId}`);
        showSuccess('Actividad eliminada exitosamente');
      }
      recargar();
    } catch (err) {
      showError(err.response?.data?.message || (isEliminada ? 'Error al reactivar actividad' : 'Error al eliminar actividad'));
    }
  };

  /* Duplicar arma una copia como borrador, para retocarla antes de publicarla. */
  const handleDuplicate = async (activityId) => {
    setOcupado('duplicar');
    try {
      const response = await axios.get(`/activities/${activityId}`);
      // eslint-disable-next-line no-unused-vars -- se descartan los campos del sistema
      const { _id, __v, createdAt, updatedAt, organizadorId, ...copia } = response.data.activity;
      const creada = await axios.post('/activities', {
        ...copia,
        titulo: `${copia.titulo} (copia)`,
        estado: 'borrador',
      });
      showSuccess('Actividad duplicada como borrador');
      recargar();
      const nueva = creada.data.activity?._id;
      if (nueva) cambiar({ act: nueva });
    } catch (err) {
      showError(err.response?.data?.message || 'No se pudo duplicar la actividad');
    } finally {
      setOcupado(null);
    }
  };

  const handleCopyLink = async (activityId) => {
    try {
      await navigator.clipboard.writeText(getActivityShareUrl(activityId));
      showSuccess('Link copiado al portapapeles');
    } catch {
      showError('No se pudo copiar el link');
    }
  };

  const downloadExport = async (activity, { fecha, estados, columnas } = {}) => {
    try {
      const exportParams = {};
      if (fecha) exportParams.fecha = fecha;
      if (estados?.length) exportParams.estados = estados.join(',');
      if (columnas?.length) exportParams.columnas = columnas.join(',');
      const response = await axios.get(`/activities/${activity._id}/export`, {
        params: exportParams,
        responseType: 'blob',
      });

      const formatDateTimeForFilename = (date) => {
        const d = new Date(date);
        const p2 = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
      };

      const cleanTitle = activity.titulo.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
      /* Sin fecha elegida (recurrente, «Todas») el nombre dice «todas», como el CSV;
         una única o un viaje llevan su propia fecha. */
      const eventDate = fecha || (activity.tipo !== 'recurrente' && activity.fecha ? formatUtcCalendarDateToString(activity.fecha) : null) || 'todas';
      const filename = `${cleanTitle}_${eventDate}_exportado_${formatDateTimeForFilename(new Date())}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar:', err);
      showError('Error al exportar inscripciones');
    }
  };

  const closeExportModal = () => {
    setExportActivity(null);
    setExportDates([]);
    setExportDatesLoading(false);
  };

  const handleExportClick = async (activity) => {
    setExportActivity(activity);
    setExportDates([]);
    if (activity.tipo !== 'recurrente') return;
    setExportDatesLoading(true);

    try {
      const response = await axios.get(`/inscriptions/activity/${activity._id}`);
      const byDate = {};
      for (const inscription of response.data.inscriptions || []) {
        const fechaStr = formatUtcCalendarDateToString(inscription.fecha);
        if (!fechaStr) continue;
        byDate[fechaStr] ??= { fechaStr, count: 0 };
        byDate[fechaStr].count += 1;
      }
      const todayStr = formatUtcCalendarDateToString(new Date());
      const sorted = Object.values(byDate).sort((a, b) => a.fechaStr.localeCompare(b.fechaStr));
      const past = sorted.filter((d) => d.fechaStr < todayStr).slice(-3);
      const upcoming = sorted.filter((d) => d.fechaStr >= todayStr).slice(0, 3);
      setExportDates([...past, ...upcoming]);
    } catch (err) {
      console.error('Error al cargar fechas para exportar:', err);
      showError('Error al cargar fechas para exportar');
      closeExportModal();
    } finally {
      setExportDatesLoading(false);
    }
  };

  const handleExport = async (opciones) => {
    const activity = exportActivity;
    closeExportModal();
    if (activity) await downloadExport(activity, opciones);
  };

  /* En el teléfono la hoja se cierra antes de abrir otra cosa: nunca dos
     ventanas apiladas. */
  const soltarHoja = () => {
    if (!esAncho) cerrar();
  };
  const accionesDe = (a) => ({
    verInscriptos: () => navigate(`/admin/activities/${a.id}/inscriptions`),
    asistencia: () => navigate(`/admin/activities/${a.id}/inscriptions${a.proximo ? `?fecha=${a.proximo.fecha}` : ''}`),
    exportar: () => {
      soltarHoja();
      handleExportClick({
        _id: a.id,
        titulo: a.titulo,
        tipo: a.tipo,
        fecha: a.fecha,
      });
    },
    duplicar: () => handleDuplicate(a.id),
    editar: () => navigate(`/admin/activities/edit/${a.id}`),
    copiarLink: () => handleCopyLink(a.id),
    eliminar: () => {
      soltarHoja();
      handleDelete(a.id, a.estado);
    },
  });

  /* ---------- Pantalla ---------- */

  const lista = (
    <ul className="divide-y divide-surface-border overflow-hidden rounded-[22px] border border-surface-border bg-surface">
      {actividades.map((a) => {
        const p = a.proximo;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => elegir(a.id)}
              aria-current={elegida?.id === a.id ? 'true' : undefined}
              className={cn(
                'group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-start transition-colors duration-base sm:grid-cols-[auto_minmax(0,1fr)_8rem_auto] sm:gap-4 sm:px-5 sm:py-4 md:grid-cols-[auto_minmax(0,1fr)_8rem_6.5rem_auto] xl:grid-cols-[auto_minmax(0,1fr)_8rem_6.5rem_9.5rem] 2xl:grid-cols-[auto_minmax(0,1fr)_8rem_6.5rem_13.5rem]',
                elegida?.id === a.id ? 'bg-primary-50/70' : 'hover:bg-ink/[0.02]',
              )}
            >
              <IconoColor icono={iconoDe(a)} color={colorDe(a)} />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-grotesk font-semibold text-ink">{a.titulo}</span>
                  {a.estado !== 'publicada' && (
                    <span
                      className={cn(
                        'shrink-0 rounded-pill px-2 py-0.5 text-[0.7rem] font-medium',
                        a.estado === 'eliminada' ? 'bg-danger-50 text-danger-700' : 'bg-ink/[0.06] text-ink-muted',
                      )}
                    >
                      {a.estado === 'eliminada' ? 'Eliminada' : 'Borrador'}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-sm text-ink-muted">{a.cuando}</span>
              </span>
              <span className="hidden sm:block">
                {p ? (
                  <BarraCupo inscriptos={p.aceptadas} cupo={a.cupo} textoSinCupo={`${p.aceptadas} anotados`} />
                ) : (
                  <span className="text-xs text-ink-faint">Sin encuentros</span>
                )}
              </span>
              <span className="hidden flex-col items-end gap-1 md:flex">
                <span className="text-xs text-ink-muted">Próximo</span>
                <span className="whitespace-nowrap text-sm font-medium text-ink">{p ? capitalizar(p.texto) : '—'}</span>
              </span>
              <span className="flex items-center justify-end gap-3">
                {p?.pendientes > 0 && (
                  <span className="whitespace-nowrap rounded-pill bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700" title="Por aprobar">
                    {p.pendientes}
                    <span className="hidden sm:inline"> por aprobar</span>
                  </span>
                )}
                <span className="hidden whitespace-nowrap text-sm font-semibold tabular-nums text-ink 2xl:inline">{formatActivityPrice(a)}</span>
                <Icon
                  name="chevronRight"
                  size="sm"
                  className="text-ink-faint transition-transform duration-base group-hover:translate-x-0.5 rtl:-scale-x-100"
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <PageContainer title="Actividades">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Segmentado opciones={VISTAS} valor={vista} onChange={(v) => cambiar({ vista: v === 'lista' ? null : v })} etiqueta="Cómo ver" />
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-pill border border-surface-border bg-surface px-4 text-ink-muted focus-within:border-ink/30 lg:w-72 lg:flex-none">
            <Icon name="search" size="sm" />
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar actividad"
              aria-label="Buscar actividad"
              className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
        </div>
        <Button to="/admin/activities/new" icon="add" className="w-full shrink-0 sm:w-auto">
          Nueva actividad
        </Button>
      </div>

      <div className="mb-6 space-y-3">
        {/* En 375 px las cuatro opciones entran con menos aire, sin cortarse. */}
        <Segmentado
          opciones={ESTADOS}
          valor={estado}
          onChange={(v) => cambiar({ estado: v, act: null })}
          etiqueta="Estado"
          className="[&>button]:px-2 [&>button]:text-[0.8rem] sm:[&>button]:px-3.5 sm:[&>button]:text-sm"
        />
        {catalogo.length > 0 && (
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            role="group"
            aria-label="Filtrar por tag"
          >
            {catalogo.map((tag) => {
              const activo = tags.includes(tag.nombre);
              const color = publicTagColor(catalogo, tag.nombre);
              const icono = publicTagIcon(catalogo, tag.nombre);
              return (
                <button
                  key={tag.nombre}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => toggleTag(tag.nombre)}
                  className={cn(
                    'inline-flex min-h-[36px] shrink-0 items-center gap-2 rounded-pill border px-3 text-sm transition-colors duration-base motion-reduce:transition-none',
                    activo ? 'border-transparent text-surface' : 'border-surface-border bg-surface text-ink-soft hover:border-ink/25',
                  )}
                  style={activo ? { background: color } : undefined}
                >
                  {icono ? <Icon name={icono} size="xs" /> : <span aria-hidden className="h-2 w-2 rounded-pill" style={{ background: color }} />}
                  {tag.nombre}
                  {activo && <Icon name="close" size="xs" />}
                </button>
              );
            })}
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiar} className="shrink-0">
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {error && !datos ? (
        <Alert
          tone="danger"
          title="No se pudieron cargar las actividades"
          action={
            <Button variant="secondary" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          }
        />
      ) : !datos ? (
        /* El lugar queda reservado mientras carga; si es corta, no se ve nada. */
        <div className={cn('min-h-[24rem] transition-opacity duration-base', cargando ? 'opacity-100' : 'opacity-0')}>
          <div className="rounded-[22px] border border-surface-border bg-surface p-4">
            <SkeletonRows count={6} />
          </div>
        </div>
      ) : (
        <div className="grid animate-fade-in gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
          <div className={cn('transition-opacity duration-base', actualizando && 'opacity-60')} aria-busy={actualizando}>
            {actividades.length === 0 ? (
              <div className="rounded-[22px] border border-surface-border bg-surface">
                <EmptyState
                  icon="activity"
                  title="Sin actividades"
                  description={hayFiltros ? 'No hay actividades con estos filtros.' : 'Todavía no hay actividades cargadas.'}
                  action={
                    hayFiltros ? (
                      <Button variant="secondary" size="sm" onClick={limpiar}>
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button to="/admin/activities/new" icon="add" size="sm">
                        Nueva actividad
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div key={vista} className="animate-fade-in">
                {vista === 'lista' ? (
                  lista
                ) : (
                  <SemanaActividades semana={datos.semana} actividades={actividades} colorDe={colorDe} elegida={elegida?.id} onElegir={elegir} />
                )}
              </div>
            )}
          </div>
          {esAncho && elegida && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div key={elegida.id} className="animate-fade-in-up">
                <DetalleActividad actividad={elegida} color={colorDe(elegida)} icono={iconoDe(elegida)} acciones={accionesDe(elegida)} ocupado={ocupado} />
              </div>
            </aside>
          )}
        </div>
      )}

      {!esAncho && (
        <Modal open={Boolean(elegida)} onClose={cerrar} title={elegida?.titulo} description={elegida?.cuando}>
          {elegida && (
            <DetalleActividad actividad={elegida} color={colorDe(elegida)} icono={iconoDe(elegida)} enHoja acciones={accionesDe(elegida)} ocupado={ocupado} />
          )}
        </Modal>
      )}

      {exportActivity && (
        <ExportModal activity={exportActivity} dates={exportDates} loading={exportDatesLoading} onClose={closeExportModal} onExport={handleExport} />
      )}
    </PageContainer>
  );
};

export default ActivitiesManagement;
