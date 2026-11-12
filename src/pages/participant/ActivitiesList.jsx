import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { activityPublicTags, publicTagColor, publicTagIcon, DEFAULT_PUBLIC_TAG_COLOR } from '../../utils/tagFields';
import { formatDateEsAR, formatDateToString, formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { postInscription } from '../../utils/paymentUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import { useDebounce } from '../../hooks/useDebounce';
import ActivityDescription from '../../components/activities/ActivityDescription';
import ActivityTags from '../../components/activities/ActivityTags';
import ActivityInfo from '../../components/activities/ActivityInfo';
import PageContainer from '../../components/layout/PageContainer';
import InscriptionStatusTag from '../../components/activities/InscriptionStatusTag';
import DateSelectionModal from '../../components/activities/DateSelectionModal';
import InscriptionConfirmModal from '../../components/activities/InscriptionConfirmModal';
import BirthDatePrompt from '../../components/profile/BirthDatePrompt';
import { useIdioma } from '../../i18n';
import {
  Badge,
  Button, Card, EmptyState, Field, Input, Select,
  cn,
  Icon,
  SkeletonCards,
} from '../../components/ui';

const ActivitiesList = () => {
  const { showSuccess, showError } = useToast();
  const { t, idioma, locale } = useIdioma();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    periodo: '',
    categoria: ''
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    if (!periodo) return t('cartelera.todosLosPeriodos');
    
    const { fechaDesde, fechaHasta } = getDateRange(periodo);
    if (!fechaDesde || !fechaHasta) return t('cartelera.todosLosPeriodos');
    
    const formatDate = (dateStr) => {
      return formatDateEsAR(dateStr, { day: '2-digit', month: '2-digit' });
    };
    
    const desde = formatDate(fechaDesde);
    const hasta = formatDate(fechaHasta);
    
    switch (periodo) {
      case 'esta-semana':
        return t('cartelera.estaSemana', { desde, hasta });
      case 'semana-que-viene':
        return t('cartelera.semanaQueViene', { desde, hasta });
      case 'este-mes': {
        const today = new Date();
        const monthName = today.toLocaleDateString(locale, { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return capitalizedMonth;
      }
      case 'siguiente-mes': {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const monthName = nextMonth.toLocaleDateString(locale, { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return capitalizedMonth;
      }
      default:
        return t('cartelera.todosLosPeriodos');
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
      // El mensaje del back está en castellano: en otro idioma va el propio.
      showSuccess((idioma === 'es' && response.data.message) || t('cartelera.inscripcionOk'));
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
      showError(error.response?.data?.message || t('cartelera.inscripcionError'));
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
      showError(t('cartelera.faltaComprobante'));
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
        showError(t('cartelera.errorFechas'));
        setShowDateModal(false);
        setSelectedActivity(null);
      } finally {
        setLoadingDates(false);
      }
    }
  };

  // El Select del DS toma opciones como datos, no como <option> sueltos.
  // getPeriodLabel arma la etiqueta con el rango de fechas real, así que las
  // opciones se derivan en cada render y no pueden vivir fuera del componente.
  const PERIODO_OPTIONS = [
    { value: '', label: t('cartelera.todosLosPeriodos') },
    { value: 'esta-semana', label: getPeriodLabel('esta-semana') },
    { value: 'semana-que-viene', label: getPeriodLabel('semana-que-viene') },
    { value: 'este-mes', label: getPeriodLabel('este-mes') },
    { value: 'siguiente-mes', label: getPeriodLabel('siguiente-mes') },
  ];

  const tagOptions = [
    { value: '', label: t('cartelera.todosLosTags') },
    ...categoriasOptions.map((cat) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];

  const activeFilterCount = [filters.periodo, filters.categoria].filter(Boolean).length;

  if (initialLoad) {
    return (
      <PageContainer title={t('cartelera.titulo')}>
        <SkeletonCards />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('cartelera.titulo')}>
      <BirthDatePrompt className="mb-6" />

        {/* Filtros. En mobile los selects viven detrás de un toggle: la card
            entera ocupaba la primera pantalla y la cartelera quedaba abajo. */}
        <Card className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('cartelera.buscar')} className="mb-0">
              <Input
                type="search"
                icon="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('cartelera.buscarPlaceholder')}
              />
            </Field>

            <div className={cn(filtersOpen ? 'contents' : 'max-sm:hidden sm:contents')}>
              <Field label={t('cartelera.periodo')} className="mb-0">
                <Select
                  options={PERIODO_OPTIONS}
                  value={filters.periodo}
                  onChange={(value) => setFilters({ ...filters, periodo: value ?? '' })}
                />
              </Field>

              <Field label={t('cartelera.tags')} className="mb-0">
                <Select
                  options={tagOptions}
                  value={filters.categoria}
                  onChange={(value) => setFilters({ ...filters, categoria: value ?? '' })}
                  searchable={tagOptions.length > 8}
                  emptyMessage={t('cartelera.sinTags')}
                />
              </Field>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon="filter"
            iconRight={filtersOpen ? 'chevronUp' : 'chevronDown'}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
            className="mt-3 min-h-0 px-2 py-1 sm:hidden"
          >
            {t('cartelera.filtros')}{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </Button>
        </Card>

        {/* Lista de actividades */}
        <div className={loading ? 'opacity-50 transition-opacity pointer-events-none' : 'transition-opacity'}>
        {activities.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="search"
              title={t('cartelera.sinResultados')}
              description={t('cartelera.sinResultadosTexto')}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map(activity => (
              <Card
                key={activity._id}
                interactive
                className="flex flex-col"
                onClick={(e) => handleActivityClick(activity, e)}
              >
                {activity.fotos && activity.fotos.length > 0 ? (
                  <img
                    src={activity.fotos[0]}
                    alt={activity.titulo}
                    className="mb-4 h-48 w-full rounded-card object-cover"
                  />
                ) : (
                  /* Sin foto, la card no se queda en texto plano: una banda
                     con el color de su primera tag (o el verde de marca) y el
                     icono del tipo de actividad. */
                  (() => {
                    const tagColor =
                      publicTagColor(publicTagCatalog, activityPublicTags(activity)[0]) ||
                      DEFAULT_PUBLIC_TAG_COLOR;
                    const tipoIcon =
                      publicTagIcon(publicTagCatalog, activityPublicTags(activity)[0]) ||
                      (activity.tipo === 'viaje'
                        ? 'location'
                        : activity.tipo === 'recurrente'
                          ? 'time'
                          : 'activity');
                    return (
                      <div
                        aria-hidden="true"
                        className="mb-4 flex h-28 items-center justify-center rounded-card"
                        style={{
                          background: `linear-gradient(135deg, ${tagColor}14, ${tagColor}42)`,
                        }}
                      >
                        <Icon name={tipoIcon} size="2xl" style={{ color: tagColor }} strokeWidth={1.5} />
                      </div>
                    );
                  })()
                )}
                <div className="mb-3 flex items-start justify-between gap-3">
                  {/* dir="auto": el título lo carga el equipo (en castellano) y
                      tiene que leerse bien aunque la página esté en hebreo. */}
                  <h2 dir="auto" className="min-w-0 text-lg font-bold leading-snug text-ink">
                    {activity.titulo}
                  </h2>
                  {activity.esGratuita ? (
                    <Badge tone="success" className="shrink-0">
                      {t('comun.gratis')}
                    </Badge>
                  ) : (
                    <span className="shrink-0 font-semibold tabular-nums text-ink">
                      {formatActivityPrice(activity)}
                    </span>
                  )}
                </div>
                <ActivityDescription activity={activity} variant="card" />

                <ActivityTags activity={activity} catalog={publicTagCatalog} variant="card" />

                <ActivityInfo activity={activity} variant="card" showPrice={false} />

                <div
                  className="mt-auto flex items-center justify-between gap-3 border-t border-surface-border pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activity.estadoInscripcion ? (
                    <div className="flex min-w-0 flex-col gap-1">
                      <InscriptionStatusTag
                        estado={activity.estadoInscripcion}
                        aceptadaLabel={t('cartelera.confirmada')}
                      />
                      {activity.tipo === 'recurrente' && activity.fechaInscripcion && (
                        <p className="text-xs text-ink-muted">
                          {t('cartelera.inscriptoPara', { fecha: formatUtcCalendarDateEsAR(activity.fechaInscripcion) })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      iconRight="forward"
                      to={`/activities/${activity._id}`}
                      className="min-h-0 px-0"
                    >
                      {t('cartelera.verDetalle')}
                    </Button>
                  )}

                  <div className="flex shrink-0 items-center gap-2">
                    {activity.ubicacionOnline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="location"
                        iconOnly
                        label={t('cartelera.comoLlego')}
                        title={t('cartelera.comoLlegoTitulo')}
                        href={activity.ubicacionOnline}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    )}
                    {!activity.estadoInscripcion && (
                      <Button size="sm" icon="check" onClick={(e) => handleInscribeClick(activity, e)}>
                        {t('cartelera.inscribirse')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
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

