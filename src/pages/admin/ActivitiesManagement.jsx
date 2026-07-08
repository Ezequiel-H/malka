import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { activityPublicTags, publicTagColor } from '../../utils/tagFields';
import { formatDateToString, formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { getActivityShareUrl } from '../../utils/activityShareUrl';
import { formatActivityPrice } from '../../utils/priceUtils';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import EmptyState from '../../components/common/EmptyState';

const ActivitiesManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('publicada');
  const [publicTagCatalog, setPublicTagCatalog] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
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
    const confirmMessage = isEliminada 
      ? '¿Estás seguro de que deseas volver a activar esta actividad?'
      : '¿Estás seguro de que deseas eliminar esta actividad?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

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

  const handleExport = async (activity) => {
    try {
      const response = await axios.get(`/activities/${activity._id}/export`, {
        responseType: 'blob'
      });
      
      // Build filename the same way as backend
      const formatDateForFilename = (date) => {
        if (!date) return 'sin-fecha';
        return formatUtcCalendarDateToString(date);
      };

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

      // Clean activity title for filename
      const cleanTitle = activity.titulo.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_');
      const eventDate = formatDateForFilename(activity.fecha);
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

  const getEstadoBadge = (estado) => {
    const badges = {
      publicada: { class: 'badge-success', text: 'Publicada' },
      borrador: { class: 'badge-warning', text: 'Borrador' },
      eliminada: { class: 'badge-danger', text: 'Eliminada' }
    };
    const badge = badges[estado] || badges.borrador;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <LoadingScreen message="Cargando actividades..." />;
  }

  return (
    <PageContainer
      title="Gestión de Actividades"
      actions={
        <Link to="/admin/activities/new" className="btn btn-primary w-full justify-center sm:w-auto shrink-0">
          Nueva Actividad
        </Link>
      }
    >

        {/* Filtro */}
        <div className="card mb-8">
          <div className="form-group">
            <label>Filtrar por estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white max-w-xs"
            >
              <option value="">Todas</option>
              <option value="publicada">Publicadas</option>
              <option value="borrador">Borradores</option>
              <option value="eliminada">Eliminadas</option>
            </select>
          </div>

          {publicTagCatalog.length > 0 && (
            <div className="form-group mb-0">
              <div className="flex items-center justify-between">
                <label>Filtrar por tags</label>
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-primary underline"
                  >
                    Limpiar
                  </button>
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
                      className={`badge transition-opacity ${isSelected ? 'text-white' : 'text-gray-700'}`}
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
                <p className="mt-2 text-sm text-gray-500">
                  Mostrando actividades con al menos uno de los tags seleccionados.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lista de actividades */}
        {filteredActivities.length === 0 ? (
          <EmptyState message="No hay actividades con el filtro seleccionado." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map(activity => (
              <div key={activity._id} className="card hover:shadow-xl transition-shadow flex flex-col">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="min-w-0 flex-1 text-xl font-bold text-gray-800">{activity.titulo}</h2>
                  <div className="shrink-0 self-start">{getEstadoBadge(activity.estado)}</div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-line">{activity.descripcion}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {activityPublicTags(activity).map(cat => (
                    <span
                      key={cat}
                      className="badge text-white"
                      style={{ backgroundColor: publicTagColor(publicTagCatalog, cat) }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="mb-4 text-sm text-gray-600 space-y-1">
                  {activity.fecha && (
                    <p>
                      <strong>{activity.tipo === 'viaje' ? 'Inicio:' : 'Fecha:'}</strong>{' '}
                      {formatUtcCalendarDateEsAR(activity.fecha)}
                    </p>
                  )}
                  {activity.tipo === 'viaje' && activity.fechaFin && (
                    <p><strong>Finaliza:</strong> {formatUtcCalendarDateEsAR(activity.fechaFin)}</p>
                  )}
                  {activity.hora && activity.tipo !== 'viaje' && <p><strong>Hora:</strong> {activity.hora}</p>}
                  {activity.lugar && <p><strong>Lugar:</strong> {activity.lugar}</p>}
                  <p><strong>Precio:</strong> {formatActivityPrice(activity)}</p>
                  {activity.cupo && <p><strong>Cupo:</strong> {activity.cupo}</p>}
                  <p><strong>Tipo:</strong> {activity.tipo === 'recurrente' ? 'Recurrente' : activity.tipo === 'viaje' ? 'Viaje' : 'Única'}</p>
                </div>

                <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {activity.estado === 'publicada' && (
                    <button
                      onClick={() => handleCopyLink(activity._id)}
                      className="btn btn-secondary w-full justify-center sm:w-auto sm:min-w-[100px] sm:flex-1"
                    >
                      Copiar link
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/activities/${activity._id}/inscriptions`)}
                    className="btn btn-primary w-full justify-center sm:w-auto sm:min-w-[100px] sm:flex-1"
                  >
                    Ver Inscripciones
                  </button>
                  <button
                    onClick={() => navigate(`/admin/activities/edit/${activity._id}`)}
                    className="btn btn-secondary w-full justify-center sm:w-auto sm:min-w-[100px] sm:flex-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExport(activity)}
                    className="btn btn-success w-full justify-center sm:w-auto sm:min-w-[100px] sm:flex-1"
                  >
                    Exportar Excel
                  </button>
                  <button
                    onClick={() => handleDelete(activity._id, activity.estado)}
                    className={`btn w-full justify-center sm:w-auto sm:min-w-[100px] sm:flex-1 ${
                      activity.estado === 'eliminada' ? 'btn-success' : 'btn-danger'
                    }`}
                  >
                    {activity.estado === 'eliminada' ? 'Volver a activar' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </PageContainer>
  );
};

export default ActivitiesManagement;

