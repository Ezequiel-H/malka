import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const InscriptionsManagement = () => {
  const { showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();
  const [inscriptions, setInscriptions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: searchParams.get('estado') || 'pendiente',
    activityId: searchParams.get('activityId') || '',
    fecha: searchParams.get('fecha') || ''
  });

  useEffect(() => {
    fetchActivities();
    fetchInscriptions();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/activities?estado=publicada');
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.estado) {
        params.append('estado', filters.estado);
      }
      if (filters.activityId) {
        params.append('activityId', filters.activityId);
      }
      if (filters.fecha) {
        params.append('fecha', filters.fecha);
      }

      const response = await axios.get(`/inscriptions?${params.toString()}`);
      setInscriptions(response.data.inscriptions || []);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      showError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (inscriptionId) => {
    try {
      await axios.put(`/inscriptions/${inscriptionId}/approve`);
      showSuccess('Inscripción aprobada exitosamente');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar inscripción');
    }
  };

  const handleReject = async (inscriptionId) => {
    if (!window.confirm('¿Estás seguro de que deseas rechazar esta inscripción?')) {
      return;
    }
    try {
      await axios.put(`/inscriptions/${inscriptionId}/reject`);
      showSuccess('Inscripción rechazada');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar inscripción');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      aceptada: { class: 'badge-success', text: 'Aceptada' },
      pendiente: { class: 'badge-warning', text: 'Pendiente' },
      cancelada: { class: 'badge-danger', text: 'Cancelada' },
      en_espera: { class: 'badge-info', text: 'En lista de espera' }
    };
    const badge = badges[estado] || badges.pendiente;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando inscripciones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">Gestión de Inscripciones</h1>

        {/* Filtros */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptada">Aceptada</option>
                <option value="cancelada">Cancelada</option>
                <option value="en_espera">En lista de espera</option>
              </select>
            </div>

            <div className="form-group">
              <label>Actividad</label>
              <select
                value={filters.activityId}
                onChange={(e) => setFilters({ ...filters, activityId: e.target.value })}
                className="bg-white"
              >
                <option value="">Todas las actividades</option>
                {activities.map(activity => (
                  <option key={activity._id} value={activity._id}>
                    {activity.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={filters.fecha}
                onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Lista de inscripciones */}
        {inscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">
              No se encontraron inscripciones con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inscriptions.map(inscription => (
              <div key={inscription._id} className="card hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {inscription.activityId?.titulo || 'Actividad no encontrada'}
                        </h3>
                        {getEstadoBadge(inscription.estado)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1"><strong>Usuario:</strong></p>
                        <p className="text-gray-800">
                          {inscription.userId?.nombre} {inscription.userId?.apellido}
                        </p>
                        <p className="text-sm text-gray-600">{inscription.userId?.email}</p>
                        {inscription.userId?.telefono && (
                          <p className="text-sm text-gray-600">Tel: {inscription.userId.telefono}</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1"><strong>Fecha del evento:</strong></p>
                        <p className="text-gray-800">
                          {new Date(inscription.fecha).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {inscription.hora && (
                          <p className="text-gray-800">Hora: {inscription.hora}</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1"><strong>Fecha de inscripción:</strong></p>
                        <p className="text-gray-800">
                          {new Date(inscription.fechaInscripcion).toLocaleDateString('es-AR')}
                        </p>
                      </div>

                      {inscription.activityId?.lugar && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1"><strong>Lugar:</strong></p>
                          <p className="text-gray-800">{inscription.activityId.lugar}</p>
                        </div>
                      )}

                      {inscription.notas && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1"><strong>Notas:</strong></p>
                          <p className="text-gray-800">{inscription.notas}</p>
                        </div>
                      )}

                      {inscription.userId?.tags && inscription.userId.tags.length > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1"><strong>Tags del usuario:</strong></p>
                          <div className="flex flex-wrap gap-2">
                            {inscription.userId.tags.map(tag => (
                              <span key={tag} className="badge badge-secondary">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {inscription.estado === 'pendiente' && (
                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <button
                        onClick={() => handleApprove(inscription._id)}
                        className="btn btn-success w-full"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(inscription._id)}
                        className="btn btn-danger w-full"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="card mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Resumen</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {inscriptions.filter(i => i.estado === 'pendiente').length}
              </p>
              <p className="text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {inscriptions.filter(i => i.estado === 'aceptada').length}
              </p>
              <p className="text-gray-600">Aceptadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {inscriptions.filter(i => i.estado === 'cancelada').length}
              </p>
              <p className="text-gray-600">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {inscriptions.filter(i => i.estado === 'en_espera').length}
              </p>
              <p className="text-gray-600">En espera</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionsManagement;

