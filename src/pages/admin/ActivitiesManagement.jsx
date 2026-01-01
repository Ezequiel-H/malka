import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const ActivitiesManagement = () => {
  const { showSuccess, showError } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('publicada');
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, [filter]);

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

  const handleExport = async (activity) => {
    try {
      const response = await axios.get(`/activities/${activity._id}/export`, {
        responseType: 'blob'
      });
      
      // Build filename the same way as backend
      const formatDateForFilename = (date) => {
        if (!date) return 'sin-fecha';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando actividades...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-primary">Gestión de Actividades</h1>
          <Link to="/admin/activities/new" className="btn btn-primary">
            Nueva Actividad
          </Link>
        </div>

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
        </div>

        {/* Lista de actividades */}
        {activities.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No hay actividades con el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map(activity => (
              <div key={activity._id} className="card hover:shadow-xl transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex-1">{activity.titulo}</h2>
                  {getEstadoBadge(activity.estado)}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">{activity.descripcion}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {activity.categorias.map(cat => (
                    <span key={cat} className="badge badge-secondary">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="mb-4 text-sm text-gray-600 space-y-1">
                  {activity.fecha && (
                    <p><strong>Fecha:</strong> {new Date(activity.fecha).toLocaleDateString('es-AR')}</p>
                  )}
                  {activity.hora && <p><strong>Hora:</strong> {activity.hora}</p>}
                  {activity.lugar && <p><strong>Lugar:</strong> {activity.lugar}</p>}
                  <p><strong>Precio:</strong> {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}</p>
                  {activity.cupo && <p><strong>Cupo:</strong> {activity.cupo}</p>}
                  <p><strong>Tipo:</strong> {activity.tipo === 'recurrente' ? 'Recurrente' : 'Única'}</p>
                </div>

                <div className="flex gap-2 flex-wrap mt-auto">
                  <button
                    onClick={() => navigate(`/admin/activities/${activity._id}/inscriptions`)}
                    className="btn btn-primary flex-1 min-w-[100px]"
                  >
                    Ver Inscripciones
                  </button>
                  <button
                    onClick={() => navigate(`/admin/activities/edit/${activity._id}`)}
                    className="btn btn-secondary flex-1 min-w-[100px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExport(activity)}
                    className="btn btn-success flex-1 min-w-[100px]"
                  >
                    Exportar Excel
                  </button>
                  <button
                    onClick={() => handleDelete(activity._id, activity.estado)}
                    className={`btn flex-1 min-w-[100px] ${
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
      </div>
    </div>
  );
};

export default ActivitiesManagement;

