import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const MyInscriptions = () => {
  const { showSuccess, showError } = useToast();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchInscriptions();
  }, [filter]);

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const params = filter ? `?estado=${filter}` : '';
      const response = await axios.get(`/inscriptions/my${params}`);
      
      // Filtrar inscripciones: solo las que son de ayer o futuras
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const filteredInscriptions = response.data.inscriptions.filter(inscription => {
        if (!inscription.fecha) return false;
        const inscriptionDate = new Date(inscription.fecha);
        inscriptionDate.setHours(0, 0, 0, 0);
        return inscriptionDate >= yesterday;
      });
      
      setInscriptions(filteredInscriptions);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (inscriptionId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
      return;
    }

    try {
      await axios.put(`/inscriptions/${inscriptionId}/cancel`);
      showSuccess('Inscripción cancelada exitosamente');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cancelar inscripción');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      aceptada: { class: 'badge-success', text: 'Confirmada' },
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
        <h1 className="text-4xl font-bold mb-8 text-primary">Mis Inscripciones</h1>

        {/* Filtro */}
        <div className="card mb-8">
          <div className="form-group">
            <label>Filtrar por estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white max-w-xs"
            >
              <option value="">Todos</option>
              <option value="aceptada">Confirmadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cancelada">Canceladas</option>
              <option value="en_espera">En lista de espera</option>
            </select>
          </div>
        </div>

        {/* Lista de inscripciones */}
        {inscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No tienes inscripciones registradas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inscriptions.map(inscription => {
              const activity = inscription.activityId;
              return (
                <div key={inscription._id} className="card hover:shadow-xl transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex-1">{activity?.titulo || 'Actividad eliminada'}</h2>
                    {getEstadoBadge(inscription.estado)}
                  </div>

                  {activity && (
                    <>
                      <p className="text-gray-600 mb-4 line-clamp-3">{activity.descripcion}</p>
                      
                      <div className="mb-4 text-sm text-gray-600 space-y-1">
                        {inscription.fecha && (
                          <p><strong>Fecha:</strong> {new Date(inscription.fecha).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                        )}
                        {inscription.hora && <p><strong>Hora:</strong> {inscription.hora}</p>}
                        {activity.lugar && <p><strong>Lugar:</strong> {activity.lugar}</p>}
                        <p><strong>Precio:</strong> {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}</p>
                      </div>

                      {activity.ubicacionOnline && (
                        <div className="mb-4">
                          <a
                            href={activity.ubicacionOnline}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary w-full"
                            title="Ver ubicación en Google Maps"
                          >
                            🗺️ ¿Cómo llego?
                          </a>
                        </div>
                      )}

                      <div className="mb-4 text-xs text-gray-500 space-y-1">
                        <p>Inscrito el: {new Date(inscription.fechaInscripcion).toLocaleDateString('es-AR')}</p>
                        {inscription.fechaAprobacion && (
                          <p>Aprobado el: {new Date(inscription.fechaAprobacion).toLocaleDateString('es-AR')}</p>
                        )}
                        {inscription.fechaCancelacion && (
                          <p>Cancelado el: {new Date(inscription.fechaCancelacion).toLocaleDateString('es-AR')}</p>
                        )}
                      </div>

                      {inscription.notas && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <strong className="text-gray-700">Notas:</strong> <span className="text-gray-600">{inscription.notas}</span>
                        </div>
                      )}
                    </>
                  )}

                  {inscription.estado !== 'cancelada' && (
                    <button
                      onClick={() => handleCancel(inscription._id)}
                      className="btn btn-danger w-full mt-auto"
                    >
                      Cancelar Inscripción
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInscriptions;

