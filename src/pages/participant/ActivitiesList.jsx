import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

const ActivitiesList = () => {
  const { showSuccess, showError } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    periodo: '',
    categoria: ''
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const navigate = useNavigate();

  // Extraer categorías únicas de las actividades cargadas
  const getAvailableCategories = () => {
    const allCategories = new Set();
    activities.forEach(activity => {
      if (activity.categorias && Array.isArray(activity.categorias)) {
        activity.categorias.forEach(cat => {
          if (cat && cat.trim()) {
            allCategories.add(cat);
          }
        });
      }
    });
    return Array.from(allCategories).sort();
  };

  const categoriasOptions = getAvailableCategories();

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const getDateRange = (periodo) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (periodo) {
      case 'esta-semana': {
        // Lunes de esta semana (0 = domingo, 1 = lunes, etc.)
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajuste para que lunes sea el inicio
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        // Domingo de esta semana
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { fechaDesde: monday.toISOString().split('T')[0], fechaHasta: sunday.toISOString().split('T')[0] };
      }
      case 'semana-que-viene': {
        // Lunes de la próxima semana
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff + 7); // Siguiente semana
        monday.setHours(0, 0, 0, 0);
        // Domingo de la próxima semana
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { fechaDesde: monday.toISOString().split('T')[0], fechaHasta: sunday.toISOString().split('T')[0] };
      }
      case 'este-mes': {
        // Primer día del mes actual
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        // Último día del mes actual
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        return { fechaDesde: firstDay.toISOString().split('T')[0], fechaHasta: lastDay.toISOString().split('T')[0] };
      }
      default:
        return { fechaDesde: '', fechaHasta: '' };
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Agregar búsqueda
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Agregar categoría
      if (filters.categoria) {
        params.append('categoria', filters.categoria);
      }
      
      // Agregar fechas según el período seleccionado
      if (filters.periodo) {
        const { fechaDesde, fechaHasta } = getDateRange(filters.periodo);
        if (fechaDesde) params.append('fechaDesde', fechaDesde);
        if (fechaHasta) params.append('fechaHasta', fechaHasta);
      }

      const response = await axios.get(`/activities?${params.toString()}`);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInscribe = async (activityId, fecha = null) => {
    try {
      await axios.post('/inscriptions', { activityId, fecha });
      showSuccess('Inscripción realizada exitosamente');
      setShowConfirmModal(false);
      setSelectedDate(null);
      
      // Recargar las fechas disponibles para actualizar el estado de inscripción
      if (selectedActivity && selectedActivity.tipo === 'recurrente') {
        try {
          const response = await axios.get(`/inscriptions/activity/${activityId}/available-dates`);
          setAvailableDates(response.data.availableDates);
        } catch (error) {
          console.error('Error reloading available dates:', error);
        }
      } else {
        setShowDateModal(false);
        setSelectedActivity(null);
        setAvailableDates([]);
        fetchActivities();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al inscribirse');
    }
  };

  const handleInscribeButtonClick = (dateOption) => {
    setSelectedDate(dateOption);
    setShowConfirmModal(true);
  };

  const handleConfirmInscription = () => {
    if (selectedDate && selectedActivity) {
      handleInscribe(selectedActivity._id, selectedDate.fechaStr);
    }
  };

  const handleAddToCalendar = (dateOption) => {
    if (!selectedActivity || !dateOption) return;

    const startDate = new Date(dateOption.fecha);
    const [hours, minutes] = (dateOption.hora || selectedActivity.hora || '19:00').split(':');
    startDate.setHours(parseInt(hours) || 19, parseInt(minutes) || 0, 0, 0);
    
    const duration = selectedActivity.duracion || 60; // Duración en minutos, default 60
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Formatear fechas para el formato de calendario (YYYYMMDDTHHmmss)
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Crear descripción
    const description = `${selectedActivity.descripcion || ''}\n\n${selectedActivity.lugar ? `Lugar: ${selectedActivity.lugar}\n` : ''}${selectedActivity.ubicacionOnline ? `Ubicación: ${selectedActivity.ubicacionOnline}\n` : ''}Precio: ${selectedActivity.esGratuita ? 'Gratis' : `$${selectedActivity.precio}`}`;
    
    // Crear URL para Google Calendar - usar el link de Google Maps en location
    const location = selectedActivity.ubicacionOnline || selectedActivity.lugar || '';
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedActivity.titulo)}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

    // Abrir en nueva pestaña
    window.open(googleCalendarUrl, '_blank');
  };

  const getEstadoInscripcionBadge = (estado) => {
    if (!estado) return null;
    
    switch (estado) {
      case 'aceptada':
        return <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">✓ Inscripción Confirmada</span>;
      case 'pendiente':
        return <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">⏳ Pendiente de Confirmación</span>;
      case 'en_espera':
        return <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-300">⏰ En Lista de Espera</span>;
      default:
        return null;
    }
  };

  const handleInscribeClick = async (activity) => {
    // Si es actividad única, inscribirse directamente
    if (activity.tipo === 'unica') {
      const fecha = activity.fecha ? new Date(activity.fecha).toISOString().split('T')[0] : null;
      await handleInscribe(activity._id, fecha);
      return;
    }

    // Si es recurrente, cargar fechas disponibles
    if (activity.tipo === 'recurrente') {
      setSelectedActivity(activity);
      setLoadingDates(true);
      setShowDateModal(true);
      try {
        const response = await axios.get(`/inscriptions/activity/${activity._id}/available-dates`);
        setAvailableDates(response.data.availableDates);
      } catch (error) {
        console.error('Error fetching available dates:', error);
        showError('Error al cargar fechas disponibles');
        setShowDateModal(false);
        setSelectedActivity(null);
      } finally {
        setLoadingDates(false);
      }
    }
  };

  const getEstadoBadge = (activity) => {
    // No mostrar badge de disponibilidad porque el cupo depende de la fecha
    // Para actividades recurrentes, el cupo se muestra en el modal de fechas
    return null;
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
        <h1 className="text-4xl font-bold mb-8 text-primary">Cartelera de Actividades</h1>

        {/* Filtros */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Título o descripción..."
                className="bg-white"
              />
            </div>

            <div className="form-group">
              <label>Período</label>
              <select
                value={filters.periodo}
                onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos los períodos</option>
                <option value="esta-semana">Esta semana</option>
                <option value="semana-que-viene">Semana que viene</option>
                <option value="este-mes">Este mes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <select
                value={filters.categoria}
                onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos los tags</option>
                {categoriasOptions.length > 0 ? (
                  categoriasOptions.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay tags disponibles</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de actividades */}
        {activities.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No se encontraron actividades con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map(activity => (
              <div key={activity._id} className="card hover:shadow-xl transition-shadow">
                {activity.fotos && activity.fotos.length > 0 && (
                  <img
                    src={activity.fotos[0]}
                    alt={activity.titulo}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h2 className="text-xl font-bold mb-3 text-gray-800">{activity.titulo}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{activity.descripcion}</p>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {activity.categorias.map(cat => (
                    <span key={cat} className="badge badge-secondary">
                      {cat}
                    </span>
                  ))}
                  {getEstadoBadge(activity)}
                </div>

                <div className="mb-4 text-sm text-gray-600 space-y-1">
                  {activity.tipo === 'recurrente' && activity.proximaOcurrencia ? (
                    <p><strong>Próxima fecha:</strong> {new Date(activity.proximaOcurrencia).toLocaleDateString('es-AR')}</p>
                  ) : activity.fecha && (
                    <p><strong>Fecha:</strong> {new Date(activity.fecha).toLocaleDateString('es-AR')}</p>
                  )}
                  {activity.hora && <p><strong>Hora:</strong> {activity.hora}</p>}
                  {activity.lugar && <p><strong>Lugar:</strong> {activity.lugar}</p>}
                  <p><strong>Precio:</strong> {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}</p>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleInscribeClick(activity)}
                    className="btn btn-primary flex-1"
                  >
                    Inscribirse
                  </button>
                  {activity.ubicacionOnline && (
                    <a
                      href={activity.ubicacionOnline}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary whitespace-nowrap"
                      title="Ver ubicación en Google Maps"
                    >
                      🗺️ ¿Cómo llego?
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de selección de fecha */}
        {showDateModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Selecciona una fecha - {selectedActivity.titulo}
                  </h2>
                  <button
                    onClick={() => {
                      setShowDateModal(false);
                      setShowConfirmModal(false);
                      setSelectedActivity(null);
                      setSelectedDate(null);
                      setAvailableDates([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {loadingDates ? (
                  <div className="text-center py-8">
                    <div className="spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando fechas disponibles...</p>
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No hay fechas disponibles en los próximos 30 días.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableDates.map((dateOption, index) => {
                      const isInscribed = !!dateOption.estadoInscripcion;
                      // Debug: mostrar el estado en la card
                      return (
                        <div
                          key={index}
                          className={`w-full p-4 rounded-lg border-2 ${
                            dateOption.estadoInscripcion === 'aceptada'
                              ? 'border-green-500 bg-green-50'
                              : dateOption.estadoInscripcion === 'pendiente'
                              ? 'border-yellow-500 bg-yellow-50'
                              : dateOption.estadoInscripcion === 'en_espera'
                              ? 'border-blue-500 bg-blue-50'
                              : dateOption.tieneCupo
                              ? 'border-gray-300 bg-white'
                              : 'border-gray-200 bg-gray-100 opacity-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 mb-2">
                                {new Date(dateOption.fecha).toLocaleDateString('es-AR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {dateOption.hora && (
                                <p className="text-sm text-gray-600 mb-2">Hora: {dateOption.hora}</p>
                              )}
                            </div>
                            <div className="text-right ml-4 flex flex-col items-end gap-2">
                              {dateOption.cuposDisponibles !== null ? (
                                <p className={`text-sm font-semibold ${
                                  dateOption.cuposDisponibles > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {dateOption.cuposDisponibles > 0
                                    ? `${dateOption.cuposDisponibles} cupos disponibles`
                                    : 'Sin cupo'}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-600">Sin límite de cupo</p>
                              )}
                              {getEstadoInscripcionBadge(dateOption.estadoInscripcion)}
                            </div>
                          </div>
                          
                          {isInscribed ? (
                            <button
                              disabled
                              className="btn btn-primary w-full opacity-50 cursor-not-allowed"
                            >
                              Inscripción Realizada
                            </button>
                          ) : dateOption.tieneCupo ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleInscribeButtonClick(dateOption)}
                                className="btn btn-primary flex-1"
                              >
                                Inscribirse
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="text-sm text-red-600 font-semibold">Sin cupo disponible</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de inscripción */}
        {showConfirmModal && selectedActivity && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Confirmar Inscripción
                  </h2>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedDate(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {selectedActivity.titulo}
                    </h3>
                    {selectedActivity.descripcion && (
                      <p className="text-gray-600 mb-4">{selectedActivity.descripcion}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Fecha:</span>
                      <span className="text-gray-800">
                        {new Date(selectedDate.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {selectedDate.hora && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Hora:</span>
                        <span className="text-gray-800">{selectedDate.hora}</span>
                      </div>
                    )}
                    {selectedActivity.lugar && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Lugar:</span>
                        <span className="text-gray-800">{selectedActivity.lugar}</span>
                      </div>
                    )}
                    {selectedActivity.ubicacionOnline && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Ubicación:</span>
                        <a 
                          href={selectedActivity.ubicacionOnline} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver en Google Maps
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-24">Precio:</span>
                      <span className="text-gray-800">
                        {selectedActivity.esGratuita ? 'Gratis' : `$${selectedActivity.precio}`}
                      </span>
                    </div>
                    {selectedActivity.duracion && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Duración:</span>
                        <span className="text-gray-800">{selectedActivity.duracion} minutos</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 flex-wrap">
                    <button
                      onClick={handleConfirmInscription}
                      className="btn btn-primary flex-1 min-w-[150px]"
                    >
                      Confirmar Inscripción
                    </button>
                    {selectedActivity.ubicacionOnline && (
                      <a
                        href={selectedActivity.ubicacionOnline}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary whitespace-nowrap"
                        title="Ver ubicación en Google Maps"
                      >
                        🗺️ ¿Cómo llego?
                      </a>
                    )}
                    <button
                      onClick={() => handleAddToCalendar(selectedDate)}
                      className="btn btn-secondary"
                      title="Agregar al calendario"
                    >
                      📅 Agregar al Calendario
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSelectedDate(null);
                      }}
                      className="btn btn-outline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesList;

