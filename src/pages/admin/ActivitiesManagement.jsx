import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { activityPublicTags, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import { formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { getActivityShareUrl } from '../../utils/activityShareUrl';
import { formatActivityPrice } from '../../utils/priceUtils';
import PageContainer from '../../components/layout/PageContainer';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  Select,
  SkeletonCards,
  useConfirm,
} from '../../components/ui';
import ExportModal from '../../components/activities/ExportModal';

const ESTADO_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'publicada', label: 'Publicadas' },
  { value: 'borrador', label: 'Borradores' },
  { value: 'eliminada', label: 'Eliminadas' },
];

const ActivitiesManagement = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('publicada');
  const [publicTagCatalog, setPublicTagCatalog] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [exportActivity, setExportActivity] = useState(null);
  const [exportDates, setExportDates] = useState([]);
  const [exportDatesLoading, setExportDatesLoading] = useState(false);
  const navigate = useNavigate();

  const toggleTag = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const filteredActivities = selectedTags.length === 0
    ? activities
    : activities.filter(activity => {
        const tags = activityPublicTags(activity);
        return selectedTags.some(sel => tags.includes(sel));
      });

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('/tags');
        if (!cancelled) setPublicTagCatalog(res.data.tags || []);
      } catch (e) {
        console.error('Error loading tag catalog:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = filter ? `?estado=${filter}` : '';
      const response = await axios.get(`/activities${params}`);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

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
          }
    );
    if (!ok) return;

    try {
      if (isEliminada) {
        // Obtener la actividad completa del backend
        const response = await axios.get(`/activities/${activityId}`);
        const activity = response.data.activity;
        
        // Preparar los datos para actualizar, excluyendo campos del sistema
        const { _id, __v, createdAt, updatedAt, organizadorId, ...updateData } = activity;
        
        // Actualizar solo el estado
        updateData.estado = 'publicada';
        
        await axios.put(`/activities/${activityId}`, updateData);
        showSuccess('Actividad reactivada exitosamente');
      } else {
        // Eliminar la actividad
        await axios.delete(`/activities/${activityId}`);
        showSuccess('Actividad eliminada exitosamente');
      }
      fetchActivities();
    } catch (error) {
      const errorMessage = isEliminada
        ? 'Error al reactivar actividad'
        : 'Error al eliminar actividad';
      showError(error.response?.data?.message || errorMessage);
    }
  };

  const handleCopyLink = async (activityId) => {
    const url = getActivityShareUrl(activityId);
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Link copiado al portapapeles');
    } catch {
      showError('No se pudo copiar el link');
    }
  };

  const downloadExport = async (activity, { fecha, estados, columnas } = {}) => {
    try {
      const params = {};
      if (fecha) params.fecha = fecha;
      if (estados?.length) params.estados = estados.join(',');
      if (columnas?.length) params.columnas = columnas.join(',');
      const response = await axios.get(`/activities/${activity._id}/export`, {
        params,
        responseType: 'blob'
      });

      const formatDateTimeForFilename = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      };

      const cleanTitle = activity.titulo.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
      const eventDate = fecha || formatUtcCalendarDateToString(activity.fecha) || 'sin-fecha';
      const exportDateTime = formatDateTimeForFilename(new Date());
      const filename = `${cleanTitle}_${eventDate}_exportado_${exportDateTime}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
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
    if (activity.tipo !== 'recurrente') {
      return;
    }
    setExportDatesLoading(true);

    try {
      const response = await axios.get(`/inscriptions/activity/${activity._id}`);
      const inscriptions = response.data.inscriptions || [];
      const byDate = {};

      inscriptions.forEach((inscription) => {
        const fechaStr = formatUtcCalendarDateToString(inscription.fecha);
        if (!fechaStr) return;
        if (!byDate[fechaStr]) {
          byDate[fechaStr] = { fechaStr, count: 0 };
        }
        byDate[fechaStr].count += 1;
      });

      const todayStr = formatUtcCalendarDateToString(new Date());
      const sorted = Object.values(byDate).sort((a, b) => a.fechaStr.localeCompare(b.fechaStr));
      const past = sorted.filter((d) => d.fechaStr < todayStr).slice(-3);
      const upcoming = sorted.filter((d) => d.fechaStr >= todayStr).slice(0, 3);
      setExportDates([...past, ...upcoming]);
    } catch (error) {
      console.error('Error al cargar fechas para exportar:', error);
      showError('Error al cargar fechas para exportar');
      closeExportModal();
    } finally {
      setExportDatesLoading(false);
    }
  };

  const handleExport = async (opciones) => {
    const activity = exportActivity;
    closeExportModal();
    if (activity) {
      await downloadExport(activity, opciones);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      publicada: { tone: 'success', text: 'Publicada' },
      borrador: { tone: 'warning', text: 'Borrador' },
      eliminada: { tone: 'danger', text: 'Eliminada' },
    };
    const badge = badges[estado] || badges.borrador;
    return (
      <Badge tone={badge.tone} dot>
        {badge.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <PageContainer title="Actividades">
        <SkeletonCards />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Actividades"
      actions={
        <Button to="/admin/activities/new" icon="add" className="w-full shrink-0 sm:w-auto">
          Nueva actividad
        </Button>
      }
    >

        {/* Filtro */}
        <Card className="mb-8">
          <Field label="Filtrar por estado" className="mb-0">
            <Select
              options={ESTADO_OPTIONS}
              value={filter}
              onChange={(value) => setFilter(value ?? '')}
              className="max-w-xs"
            />
          </Field>

          {publicTagCatalog.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="block text-sm font-medium text-ink-soft">Filtrar por tags</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="min-h-0 px-0 py-0"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {publicTagCatalog.map(tag => {
                  const isSelected = selectedTags.includes(tag.nombre);
                  const color = publicTagColor(publicTagCatalog, tag.nombre);
                  return (
                    <button
                      key={tag.nombre}
                      type="button"
                      onClick={() => toggleTag(tag.nombre)}
                      aria-pressed={isSelected}
                      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold transition-chrome duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none ${
                        isSelected ? 'text-white' : 'text-ink-soft'
                      }`}
                      style={{
                        backgroundColor: isSelected ? color : 'transparent',
                        border: `1px solid ${color}`
                      }}
                    >
                      {tag.nombre}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <p className="mt-2 text-sm text-ink-muted">
                  Mostrando actividades con al menos uno de los tags seleccionados.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Lista de actividades */}
        {filteredActivities.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="activity"
              title="Sin actividades"
              description="No hay actividades con el filtro seleccionado."
              action={
                <Button to="/admin/activities/new" icon="add" size="sm">
                  Nueva actividad
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map(activity => (
              <Card key={activity._id} className="flex flex-col">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-ink">
                    {activity.titulo}
                  </h2>
                  <div className="shrink-0">{getEstadoBadge(activity.estado)}</div>
                </div>

                {/* Los datos en una línea envolvente con iconos, como en la
                    cartelera: una fila por dato hacía la card el doble de alta. */}
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
                  {activity.fecha && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="activity" size="sm" className="shrink-0 text-ink-faint" />
                      {formatUtcCalendarDateEsAR(activity.fecha)}
                      {activity.tipo === 'viaje' && activity.fechaFin
                        ? ` → ${formatUtcCalendarDateEsAR(activity.fechaFin)}`
                        : ''}
                    </span>
                  )}
                  {activity.hora && activity.tipo !== 'viaje' && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="time" size="sm" className="shrink-0 text-ink-faint" />
                      {activity.hora}
                    </span>
                  )}
                  {activity.lugar && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Icon name="location" size="sm" className="shrink-0 text-ink-faint" />
                      <span className="truncate">{activity.lugar}</span>
                    </span>
                  )}
                  {activity.cupo && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="users" size="sm" className="shrink-0 text-ink-faint" />
                      Cupo {activity.cupo}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Icon name="payment" size="sm" className="shrink-0 text-ink-faint" />
                    {activity.esGratuita ? (
                      <Badge tone="success" size="sm">
                        Gratis
                      </Badge>
                    ) : (
                      <span className="font-semibold text-ink">{formatActivityPrice(activity)}</span>
                    )}
                  </span>
                  <Badge tone="neutral" size="sm">
                    {activity.tipo === 'recurrente'
                      ? 'Recurrente'
                      : activity.tipo === 'viaje'
                        ? 'Viaje'
                        : 'Única'}
                  </Badge>
                </div>

                <p className="mb-3 line-clamp-2 whitespace-pre-line text-sm text-ink-muted">
                  {activity.descripcion}
                </p>

                {activityPublicTags(activity).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {activityPublicTags(activity).map(cat => (
                      <Badge
                        key={cat}
                        solid
                        size="sm"
                        icon={publicTagIcon(publicTagCatalog, cat) || undefined}
                        style={{ backgroundColor: publicTagColor(publicTagCatalog, cat) }}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Una acción principal con texto; el resto, iconos con tooltip.
                    Cinco botones llenos convertían cada card en una botonera. */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface-border pt-3">
                  <Button
                    size="sm"
                    icon="users"
                    onClick={() => navigate(`/admin/activities/${activity._id}/inscriptions`)}
                  >
                    Inscripciones
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="edit"
                      iconOnly
                      label="Editar"
                      title="Editar"
                      onClick={() => navigate(`/admin/activities/edit/${activity._id}`)}
                    />
                    {activity.estado === 'publicada' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="copy"
                        iconOnly
                        label="Copiar link"
                        title="Copiar link"
                        onClick={() => handleCopyLink(activity._id)}
                      />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="download"
                      iconOnly
                      label="Exportar Excel"
                      title="Exportar Excel"
                      onClick={() => handleExportClick(activity)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={activity.estado === 'eliminada' ? 'check' : 'delete'}
                      iconOnly
                      label={activity.estado === 'eliminada' ? 'Volver a activar' : 'Eliminar'}
                      title={activity.estado === 'eliminada' ? 'Volver a activar' : 'Eliminar'}
                      onClick={() => handleDelete(activity._id, activity.estado)}
                      className={
                        activity.estado === 'eliminada'
                          ? 'hover:bg-success-50 hover:text-success-600'
                          : 'hover:bg-danger-50 hover:text-danger-600'
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {exportActivity && (
          <ExportModal
            activity={exportActivity}
            dates={exportDates}
            loading={exportDatesLoading}
            onClose={closeExportModal}
            onExport={handleExport}
          />
        )}
    </PageContainer>
  );
};

export default ActivitiesManagement;

