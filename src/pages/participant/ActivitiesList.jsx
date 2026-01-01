import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

// Helper function to format date as YYYY-MM-DD - simple date, no timezone conversion
// Just extract the year, month, day as simple numbers
const formatDateToString = (date) => {
  if (!date) return '';
  
  // If it's already a string in YYYY-MM-DD format, return it as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.substring(0, 10);
  }
  
  // For Date objects, extract year, month, day as simple numbers
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelPolicyModal, setShowCancelPolicyModal] = useState(false);

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

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showCancelPolicyModal) {
          setShowCancelPolicyModal(false);
        } else if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedActivity(null);
          setAvailableDates([]);
        } else if (showDateModal) {
          setShowDateModal(false);
          setSelectedActivity(null);
          setAvailableDates([]);
        } else if (showConfirmModal) {
          setShowConfirmModal(false);
          setSelectedDate(null);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showDateModal, showConfirmModal, showCancelPolicyModal]);

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
        return { fechaDesde: formatDateToString(monday), fechaHasta: formatDateToString(sunday) };
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
        return { fechaDesde: formatDateToString(monday), fechaHasta: formatDateToString(sunday) };
      }
      case 'este-mes': {
        // Primer día del mes actual
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        // Último día del mes actual
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        return { fechaDesde: formatDateToString(firstDay), fechaHasta: formatDateToString(lastDay) };
      }
      case 'siguiente-mes': {
        // Primer día del siguiente mes
        const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        firstDay.setHours(0, 0, 0, 0);
        // Último día del siguiente mes
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        lastDay.setHours(23, 59, 59, 999);
        return { fechaDesde: formatDateToString(firstDay), fechaHasta: formatDateToString(lastDay) };
      }
      default:
        return { fechaDesde: '', fechaHasta: '' };
    }
  };

  const getPeriodLabel = (periodo) => {
    if (!periodo) return 'Todos los períodos';
    
    const { fechaDesde, fechaHasta } = getDateRange(periodo);
    if (!fechaDesde || !fechaHasta) return 'Todos los períodos';
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };
    
    const desde = formatDate(fechaDesde);
    const hasta = formatDate(fechaHasta);
    
    switch (periodo) {
      case 'esta-semana':
        return `Esta semana (${desde} - ${hasta})`;
      case 'semana-que-viene':
        return `Semana que viene (${desde} - ${hasta})`;
      case 'este-mes': {
        const today = new Date();
        const monthName = today.toLocaleDateString('es-AR', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return capitalizedMonth;
      }
      case 'siguiente-mes': {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const monthName = nextMonth.toLocaleDateString('es-AR', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return capitalizedMonth;
      }
      default:
        return 'Todos los períodos';
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
      const updatedActivities = response.data.activities;
      setActivities(updatedActivities);
      
      // Si hay una actividad seleccionada, actualizarla también
      if (selectedActivity) {
        const updatedActivity = updatedActivities.find(a => a._id === selectedActivity._id);
        if (updatedActivity) {
          setSelectedActivity(updatedActivity);
        }
      }
      
      return updatedActivities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
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
      
      // Recargar las actividades primero (esto actualizará selectedActivity automáticamente)
      await fetchActivities();
      
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
        if (!showDetailModal) {
          setSelectedActivity(null);
        }
        setAvailableDates([]);
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

  const handleActivityClick = (activity, e) => {
    // Evitar que se abra el modal si se hace clic en un botón o enlace
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    setSelectedActivity(activity);
    setShowDetailModal(true);
    
    // Si es actividad recurrente, cargar fechas disponibles
    if (activity.tipo === 'recurrente') {
      setLoadingDates(true);
      axios.get(`/inscriptions/activity/${activity._id}/available-dates`)
        .then(response => {
          setAvailableDates(response.data.availableDates);
        })
        .catch(error => {
          console.error('Error fetching available dates:', error);
        })
        .finally(() => {
          setLoadingDates(false);
        });
    }
  };

  const handleInscribeClick = async (activity, e) => {
    if (e) {
      e.stopPropagation();
    }
    // Si es actividad única, inscribirse directamente
    if (activity.tipo === 'unica') {
      const fecha = activity.fecha ? formatDateToString(activity.fecha) : null;
      await handleInscribe(activity._id, fecha);
      return;
    }

    // Si es recurrente, cargar fechas disponibles
    if (activity.tipo === 'recurrente') {
      setSelectedActivity(activity);
      setLoadingDates(true);
      setShowDateModal(true);
      setShowDetailModal(false);
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
                <option value="esta-semana">{getPeriodLabel('esta-semana')}</option>
                <option value="semana-que-viene">{getPeriodLabel('semana-que-viene')}</option>
                <option value="este-mes">{getPeriodLabel('este-mes')}</option>
                <option value="siguiente-mes">{getPeriodLabel('siguiente-mes')}</option>
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
              <div 
                key={activity._id} 
                className="card hover:shadow-xl transition-shadow cursor-pointer flex flex-col"
                onClick={(e) => handleActivityClick(activity, e)}
              >
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

                <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                  {activity.estadoInscripcion ? (
                    <div className="flex-1 flex flex-col gap-2">
                      {getEstadoInscripcionBadge(activity.estadoInscripcion)}
                      {activity.tipo === 'recurrente' && activity.fechaInscripcion && (
                        <p className="text-sm text-gray-600">
                          Inscrito para: {new Date(activity.fechaInscripcion).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleInscribeClick(activity, e)}
                      className="btn btn-primary flex-1"
                    >
                      Inscribirse
                    </button>
                  )}
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

        {/* Modal de detalles de actividad */}
        {showDetailModal && selectedActivity && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailModal(false);
                setSelectedActivity(null);
                setAvailableDates([]);
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-3xl font-bold text-gray-800 pr-4">
                    {selectedActivity.titulo}
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedActivity(null);
                      setAvailableDates([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-3xl flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                {/* Imágenes */}
                {selectedActivity.fotos && selectedActivity.fotos.length > 0 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedActivity.fotos.map((foto, index) => (
                        <img
                          key={index}
                          src={foto}
                          alt={`${selectedActivity.titulo} - Imagen ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Descripción completa */}
                {selectedActivity.descripcion && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Descripción</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedActivity.descripcion}</p>
                  </div>
                )}

                {/* Categorías */}
                {selectedActivity.categorias && selectedActivity.categorias.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Categorías</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.categorias.map(cat => (
                        <span key={cat} className="badge badge-secondary">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información detallada */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Información</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedActivity.tipo === 'recurrente' && selectedActivity.proximaOcurrencia ? (
                      <div>
                        <span className="font-semibold text-gray-700">Próxima fecha:</span>
                        <span className="ml-2 text-gray-800">
                          {new Date(selectedActivity.proximaOcurrencia).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    ) : selectedActivity.fecha && (
                      <div>
                        <span className="font-semibold text-gray-700">Fecha:</span>
                        <span className="ml-2 text-gray-800">
                          {new Date(selectedActivity.fecha).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    
                    {selectedActivity.hora && (
                      <div>
                        <span className="font-semibold text-gray-700">Hora:</span>
                        <span className="ml-2 text-gray-800">{selectedActivity.hora}</span>
                      </div>
                    )}
                    
                    {selectedActivity.duracion && (
                      <div>
                        <span className="font-semibold text-gray-700">Duración:</span>
                        <span className="ml-2 text-gray-800">{selectedActivity.duracion} minutos</span>
                      </div>
                    )}
                    
                    {selectedActivity.lugar && (
                      <div>
                        <span className="font-semibold text-gray-700">Lugar:</span>
                        <span className="ml-2 text-gray-800">{selectedActivity.lugar}</span>
                      </div>
                    )}
                    
                    {selectedActivity.ubicacionOnline && (
                      <div>
                        <span className="font-semibold text-gray-700">Ubicación:</span>
                        <a 
                          href={selectedActivity.ubicacionOnline} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          Ver en Google Maps
                        </a>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-semibold text-gray-700">Precio:</span>
                      <span className="ml-2 text-gray-800">
                        {selectedActivity.esGratuita ? 'Gratis' : `$${selectedActivity.precio}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estado de inscripción */}
                {selectedActivity.estadoInscripcion && (
                  <div className="mb-6">
                    {getEstadoInscripcionBadge(selectedActivity.estadoInscripcion)}
                    {selectedActivity.tipo === 'recurrente' && selectedActivity.fechaInscripcion && (
                      <p className="text-sm text-gray-600 mt-2">
                        Inscrito para: {new Date(selectedActivity.fechaInscripcion).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                )}

                {/* Fechas disponibles para actividades recurrentes */}
                {selectedActivity.tipo === 'recurrente' && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Fechas Disponibles</h3>
                    {loadingDates ? (
                      <div className="text-center py-8">
                        <div className="spinner mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando fechas disponibles...</p>
                      </div>
                    ) : availableDates.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No hay fechas disponibles en los próximos 30 días.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableDates.slice(0, 5).map((dateOption, index) => {
                          const isInscribed = !!dateOption.estadoInscripcion;
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-2 ${
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
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">
                                    {new Date(dateOption.fecha).toLocaleDateString('es-AR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  {dateOption.hora && (
                                    <p className="text-sm text-gray-600">Hora: {dateOption.hora}</p>
                                  )}
                                  {dateOption.cuposDisponibles !== null && (
                                    <p className={`text-sm font-semibold ${
                                      dateOption.cuposDisponibles > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {dateOption.cuposDisponibles > 0
                                        ? `${dateOption.cuposDisponibles} cupos disponibles`
                                        : 'Sin cupo'}
                                    </p>
                                  )}
                                </div>
                                {getEstadoInscripcionBadge(dateOption.estadoInscripcion)}
                              </div>
                            </div>
                          );
                        })}
                        {availableDates.length > 5 && (
                          <p className="text-sm text-gray-600 text-center mt-2">
                            Y {availableDates.length - 5} fecha(s) más...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4 flex-wrap">
                  {!selectedActivity.estadoInscripcion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInscribeClick(selectedActivity, e);
                      }}
                      className="btn btn-primary flex-1 min-w-[150px]"
                    >
                      Inscribirse
                    </button>
                  )}
                  
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
                  
                  {selectedActivity.tipo === 'recurrente' && availableDates.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetailModal(false);
                        setShowDateModal(true);
                      }}
                      className="btn btn-secondary"
                    >
                      Ver todas las fechas
                    </button>
                  )}
                  
                  {selectedActivity.politicaCancelacion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancelPolicyModal(true);
                      }}
                      className="btn btn-secondary"
                    >
                      📋 Política de Cancelación
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedActivity(null);
                      setAvailableDates([]);
                    }}
                    className="btn btn-outline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Política de Cancelación */}
        {showCancelPolicyModal && selectedActivity && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCancelPolicyModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Política de Cancelación
                  </h2>
                  <button
                    onClick={() => setShowCancelPolicyModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-3xl flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {selectedActivity.titulo}
                  </h3>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedActivity.politicaCancelacion}
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowCancelPolicyModal(false)}
                    className="btn btn-primary"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
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

