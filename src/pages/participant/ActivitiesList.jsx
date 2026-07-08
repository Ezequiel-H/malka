import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { activityPublicTags } from '../../utils/tagFields';
import { formatDateEsAR, formatDateToString, formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { postInscription } from '../../utils/paymentUtils';
import { useDebounce } from '../../hooks/useDebounce';
import ActivityDescription from '../../components/activities/ActivityDescription';
import ActivityTags from '../../components/activities/ActivityTags';
import ActivityInfo from '../../components/activities/ActivityInfo';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import InscriptionStatusBadge from '../../components/activities/InscriptionStatusBadge';
import DateSelectionModal from '../../components/activities/DateSelectionModal';
import InscriptionConfirmModal from '../../components/activities/InscriptionConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const ActivitiesList = () => {
  const { showSuccess, showError } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState('');
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
  const [publicTagCatalog, setPublicTagCatalog] = useState([]);
  const [comprobanteFile, setComprobanteFile] = useState(null);

  const navigate = useNavigate();

  // Extraer categorías únicas de las actividades cargadas
  const getAvailableCategories = () => {
    const allCategories = new Set();
    activities.forEach(activity => {
      activityPublicTags(activity).forEach(cat => {
        if (cat && String(cat).trim()) {
          allCategories.add(cat);
        }
      });
    });
    return Array.from(allCategories).sort();
  };

  const categoriasOptions = getAvailableCategories();

  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    setFilters(prev => (
      prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch }
    ));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchActivities();
  }, [filters]);

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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDateModal) {
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
  }, [showDateModal, showConfirmModal]);

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
      return formatDateEsAR(dateStr, { day: '2-digit', month: '2-digit' });
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
      setInitialLoad(false);
    }
  };

  const handleInscribe = async (activityData, fecha = null, file = null) => {
    try {
      const response = await postInscription(axios, {
        activityId: activityData._id,
        fecha,
        comprobanteFile: file,
        esGratuita: activityData.esGratuita,
        tipo: activityData.tipo,
      });
      showSuccess(response.data.message || 'Inscripción realizada exitosamente');
      setShowConfirmModal(false);
      setSelectedDate(null);
      setComprobanteFile(null);
      
      // Recargar las actividades primero (esto actualizará selectedActivity automáticamente)
      await fetchActivities();
      
      // Recargar las fechas disponibles para actualizar el estado de inscripción
      if (selectedActivity && selectedActivity.tipo === 'recurrente') {
        try {
          const responseDates = await axios.get(`/inscriptions/activity/${activityData._id}/available-dates`);
          setAvailableDates(responseDates.data.availableDates);
        } catch (error) {
          console.error('Error reloading available dates:', error);
        }
      } else {
        setShowDateModal(false);
        setSelectedActivity(null);
        setAvailableDates([]);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Error al inscribirse');
    }
  };

  const openConfirmForUnica = (activity) => {
    const fechaStr = activity.fecha ? formatUtcCalendarDateToString(activity.fecha) : null;
    setSelectedActivity(activity);
    setSelectedDate({
      fecha: activity.fecha,
      fechaStr,
      hora: activity.hora,
    });
    setComprobanteFile(null);
    setShowConfirmModal(true);
  };

  const handleInscribeButtonClick = (dateOption) => {
    setSelectedDate(dateOption);
    setComprobanteFile(null);
    setShowConfirmModal(true);
  };

  const handleConfirmInscription = () => {
    if (!selectedDate || !selectedActivity) return;
    if (!selectedActivity.esGratuita && selectedActivity.tipo !== 'viaje' && !comprobanteFile) {
      showError('Debes subir un comprobante de transferencia');
      return;
    }
    handleInscribe(selectedActivity, selectedDate.fechaStr, comprobanteFile);
  };

  const handleAddToCalendar = (dateOption = null) => {
    if (!selectedActivity) return;
    const url = buildGoogleCalendarTemplateUrl(selectedActivity, dateOption);
    if (url) window.open(url, '_blank');
  };

  const handleActivityClick = (activity, e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/activities/${activity._id}`);
  };

  const handleInscribeClick = async (activity, e) => {
    if (e) {
      e.stopPropagation();
    }
    // Actividad única o viaje: inscribirse directamente o abrir confirmación si es paga
    if (activity.tipo === 'unica' || activity.tipo === 'viaje') {
      if (!activity.esGratuita) {
        openConfirmForUnica(activity);
        return;
      }
      const fecha = activity.fecha ? formatUtcCalendarDateToString(activity.fecha) : null;
      await handleInscribe(activity, fecha);
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

  if (initialLoad) {
    return <LoadingScreen message="Cargando actividades..." />;
  }

  return (
    <PageContainer title="Cartelera de Actividades">

        {/* Filtros */}
        <div className="card mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Buscar</label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
        <div className={loading ? 'opacity-50 transition-opacity pointer-events-none' : 'transition-opacity'}>
        {activities.length === 0 ? (
          <EmptyState message="No se encontraron actividades con los filtros seleccionados." />
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
                <ActivityDescription activity={activity} variant="card" />

                <ActivityTags activity={activity} catalog={publicTagCatalog} variant="card" />

                <ActivityInfo activity={activity} variant="card" />

                <div
                  className="mt-auto flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activity.estadoInscripcion ? (
                    <div className="flex w-full flex-1 flex-col gap-2">
                      <InscriptionStatusBadge estado={activity.estadoInscripcion} />
                      {activity.tipo === 'recurrente' && activity.fechaInscripcion && (
                        <p className="text-sm text-gray-600">
                          Inscrito para: {formatUtcCalendarDateEsAR(activity.fechaInscripcion)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleInscribeClick(activity, e)}
                      className="btn btn-primary w-full justify-center sm:w-auto sm:flex-1"
                    >
                      Inscribirse
                    </button>
                  )}
                  {activity.ubicacionOnline && (
                    <a
                      href={activity.ubicacionOnline}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full justify-center whitespace-normal text-center sm:w-auto sm:whitespace-nowrap"
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
        </div>


        {showDateModal && selectedActivity && (
          <DateSelectionModal
            activity={selectedActivity}
            availableDates={availableDates}
            loading={loadingDates}
            onClose={() => {
              setShowDateModal(false);
              setShowConfirmModal(false);
              setSelectedActivity(null);
              setSelectedDate(null);
              setAvailableDates([]);
            }}
            onSelect={handleInscribeButtonClick}
          />
        )}

        {showConfirmModal && selectedActivity && selectedDate && (
          <InscriptionConfirmModal
            activity={selectedActivity}
            selectedDate={selectedDate}
            onComprobanteChange={setComprobanteFile}
            onConfirm={handleConfirmInscription}
            onAddToCalendar={() => handleAddToCalendar(selectedDate)}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedDate(null);
              setComprobanteFile(null);
            }}
          />
        )}
    </PageContainer>
  );
};

export default ActivitiesList;

