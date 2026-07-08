import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { postInscription } from '../../utils/paymentUtils';
import ActivityDescription from '../../components/activities/ActivityDescription';
import ActivityTags from '../../components/activities/ActivityTags';
import ActivityInfo from '../../components/activities/ActivityInfo';
import InscriptionStatusBadge from '../../components/activities/InscriptionStatusBadge';
import DateSelectionModal from '../../components/activities/DateSelectionModal';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import Modal from '../../components/layout/Modal';
import InscriptionConfirmModal from '../../components/activities/InscriptionConfirmModal';
import EmptyState from '../../components/common/EmptyState';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCancelPolicyModal, setShowCancelPolicyModal] = useState(false);
  const [publicTagCatalog, setPublicTagCatalog] = useState([]);
  const [comprobanteFile, setComprobanteFile] = useState(null);

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
    fetchActivity();
  }, [id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (showCancelPolicyModal) {
        setShowCancelPolicyModal(false);
      } else if (showDateModal) {
        setShowDateModal(false);
        setSelectedDate(null);
      } else if (showConfirmModal) {
        setShowConfirmModal(false);
        setSelectedDate(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDateModal, showConfirmModal, showCancelPolicyModal]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/activities/${id}`);
      const fetched = response.data.activity;
      setActivity(fetched);

      if (fetched.tipo === 'recurrente') {
        setLoadingDates(true);
        try {
          const datesRes = await axios.get(`/inscriptions/activity/${id}/available-dates`);
          setAvailableDates(datesRes.data.availableDates);
        } catch (error) {
          console.error('Error fetching available dates:', error);
        } finally {
          setLoadingDates(false);
        }
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      showError(error.response?.data?.message || 'No se pudo cargar la actividad');
      navigate('/activities');
    } finally {
      setLoading(false);
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
      setShowDateModal(false);
      setSelectedDate(null);
      setComprobanteFile(null);
      await fetchActivity();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al inscribirse');
    }
  };

  const openConfirmForUnica = (act) => {
    const fechaStr = act.fecha ? formatUtcCalendarDateToString(act.fecha) : null;
    setSelectedDate({
      fecha: act.fecha,
      fechaStr,
      hora: act.hora,
    });
    setComprobanteFile(null);
    setShowConfirmModal(true);
  };

  const handleInscribeClick = async () => {
    if (activity.tipo === 'unica' || activity.tipo === 'viaje') {
      if (!activity.esGratuita) {
        openConfirmForUnica(activity);
        return;
      }
      const fecha = activity.fecha ? formatUtcCalendarDateToString(activity.fecha) : null;
      await handleInscribe(activity, fecha);
      return;
    }

    if (activity.tipo === 'recurrente') {
      setLoadingDates(true);
      setShowDateModal(true);
      try {
        const response = await axios.get(`/inscriptions/activity/${activity._id}/available-dates`);
        setAvailableDates(response.data.availableDates);
      } catch (error) {
        console.error('Error fetching available dates:', error);
        showError('Error al cargar fechas disponibles');
        setShowDateModal(false);
      } finally {
        setLoadingDates(false);
      }
    }
  };

  const handleInscribeButtonClick = (dateOption) => {
    setSelectedDate(dateOption);
    setComprobanteFile(null);
    setShowConfirmModal(true);
  };

  const handleConfirmInscription = () => {
    if (!selectedDate || !activity) return;
    if (!activity.esGratuita && activity.tipo !== 'viaje' && !comprobanteFile) {
      showError('Debes subir un comprobante de transferencia');
      return;
    }
    handleInscribe(activity, selectedDate.fechaStr, comprobanteFile);
  };

  const handleAddToCalendar = (dateOption = null) => {
    if (!activity) return;
    const url = buildGoogleCalendarTemplateUrl(activity, dateOption);
    if (url) window.open(url, '_blank');
  };

  if (loading) {
    return <LoadingScreen message="Cargando actividad..." />;
  }

  if (!activity) return null;

  return (
    <PageContainer maxWidth="4xl">
        <Link
          to="/activities"
          className="inline-flex items-center gap-1 text-primary hover:underline mb-6 text-sm font-medium"
        >
          ← Volver a la cartelera
        </Link>

        <div className="bg-white rounded-lg shadow-md min-w-0">
          <div className="p-4 sm:p-6">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl mb-6">
              {activity.titulo}
            </h1>

            {activity.fotos && activity.fotos.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.fotos.map((foto, index) => (
                    <img
                      key={index}
                      src={foto}
                      alt={`${activity.titulo} - Imagen ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            <ActivityDescription activity={activity} variant="detail" />

            <ActivityTags activity={activity} catalog={publicTagCatalog} variant="detail" />

            <ActivityInfo activity={activity} variant="detail" />

            {activity.estadoInscripcion && activity.tipo === 'recurrente' && activity.fechaInscripcion && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Inscrito para: {formatUtcCalendarDateEsAR(activity.fechaInscripcion)}
                </p>
              </div>
            )}

            {activity.tipo === 'recurrente' && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Fechas Disponibles</h2>
                {loadingDates ? (
                  <div className="text-center py-8">
                    <div className="spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando fechas disponibles...</p>
                  </div>
                ) : availableDates.length === 0 ? (
                  <EmptyState card={false} message="No hay fechas disponibles en los próximos 30 días." />
                ) : (
                  <div className="space-y-2">
                    {availableDates.slice(0, 5).map((dateOption, index) => (
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800">
                              {formatUtcCalendarDateEsAR(dateOption.fecha, {
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
                          <div className="shrink-0 self-start sm:self-center">
                            <InscriptionStatusBadge estado={dateOption.estadoInscripcion} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {availableDates.length > 5 && (
                      <p className="text-sm text-gray-600 text-center mt-2">
                        Y {availableDates.length - 5} fecha(s) más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
              {activity.estadoInscripcion ? (
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-1">
                  <InscriptionStatusBadge estado={activity.estadoInscripcion} />
                </div>
              ) : (
                <button
                  onClick={handleInscribeClick}
                  className="btn btn-primary w-full justify-center min-w-0 sm:w-auto sm:min-w-[140px] sm:flex-1"
                >
                  Inscribirse
                </button>
              )}

              {(activity.tipo === 'unica' || activity.tipo === 'viaje') && activity.fecha && (
                <button
                  onClick={() => handleAddToCalendar()}
                  className="btn btn-secondary w-full justify-center sm:w-auto"
                  title="Agregar al calendario"
                >
                  📅 Agregar al Calendario
                </button>
              )}

              {activity.ubicacionOnline && (
                <a
                  href={activity.ubicacionOnline}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full justify-center text-center sm:w-auto sm:whitespace-nowrap"
                  title="Ver ubicación en Google Maps"
                >
                  🗺️ ¿Cómo llego?
                </a>
              )}

              {activity.tipo === 'recurrente' && availableDates.length > 0 && (
                <button
                  onClick={() => setShowDateModal(true)}
                  className="btn btn-secondary w-full justify-center sm:w-auto"
                >
                  Ver todas las fechas
                </button>
              )}

              {activity.politicaCancelacion && (
                <button
                  onClick={() => setShowCancelPolicyModal(true)}
                  className="btn btn-secondary w-full justify-center sm:w-auto"
                >
                  📋 Política de Cancelación
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Política de Cancelación */}
        {showCancelPolicyModal && (
          <Modal onClose={() => setShowCancelPolicyModal(false)} title="Política de Cancelación">
            <div className="rounded-lg bg-gray-50 p-4 sm:p-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {activity.politicaCancelacion}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowCancelPolicyModal(false)}
                className="btn btn-primary w-full justify-center sm:w-auto"
              >
                Cerrar
              </button>
            </div>
          </Modal>
        )}

        {showDateModal && (
          <DateSelectionModal
            activity={activity}
            availableDates={availableDates}
            loading={loadingDates}
            onClose={() => {
              setShowDateModal(false);
              setShowConfirmModal(false);
              setSelectedDate(null);
            }}
            onSelect={handleInscribeButtonClick}
          />
        )}

        {showConfirmModal && selectedDate && (
          <InscriptionConfirmModal
            activity={activity}
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

export default ActivityDetail;
