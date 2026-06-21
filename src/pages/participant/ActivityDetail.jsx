import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { activityPublicTags, publicTagColor } from '../../utils/tagFields';
import { formatUtcCalendarDateEsAR, formatUtcCalendarDateToString } from '../../utils/dateUtils';
import { buildGoogleCalendarTemplateUrl } from '../../utils/googleCalendarActivityUrl';
import { postInscription } from '../../utils/paymentUtils';

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
    if (activity.tipo === 'unica') {
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
    if (!activity.esGratuita && !comprobanteFile) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando actividad...</p>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto min-w-0">
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

            {activity.descripcion && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Descripción</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{activity.descripcion}</p>
              </div>
            )}

            {activityPublicTags(activity).length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
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
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activity.tipo === 'recurrente' && activity.proximaOcurrencia ? (
                  <div>
                    <span className="font-semibold text-gray-700">Próxima fecha:</span>
                    <span className="ml-2 text-gray-800">
                      {formatUtcCalendarDateEsAR(activity.proximaOcurrencia, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                ) : activity.fecha && (
                  <div>
                    <span className="font-semibold text-gray-700">Fecha:</span>
                    <span className="ml-2 text-gray-800">
                      {formatUtcCalendarDateEsAR(activity.fecha, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {activity.hora && (
                  <div>
                    <span className="font-semibold text-gray-700">Hora:</span>
                    <span className="ml-2 text-gray-800">{activity.hora}</span>
                  </div>
                )}

                {activity.duracion && (
                  <div>
                    <span className="font-semibold text-gray-700">Duración:</span>
                    <span className="ml-2 text-gray-800">{activity.duracion} minutos</span>
                  </div>
                )}

                {activity.lugar && (
                  <div>
                    <span className="font-semibold text-gray-700">Lugar:</span>
                    <span className="ml-2 text-gray-800">{activity.lugar}</span>
                  </div>
                )}

                {activity.ubicacionOnline && (
                  <div>
                    <span className="font-semibold text-gray-700">Ubicación:</span>
                    <a
                      href={activity.ubicacionOnline}
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
                    {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}
                  </span>
                </div>
              </div>
            </div>

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
                  <p className="text-gray-600 text-center py-4">No hay fechas disponibles en los próximos 30 días.</p>
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
                            {getEstadoInscripcionBadge(dateOption.estadoInscripcion)}
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
                  {getEstadoInscripcionBadge(activity.estadoInscripcion)}
                </div>
              ) : (
                <button
                  onClick={handleInscribeClick}
                  className="btn btn-primary w-full justify-center min-w-0 sm:w-auto sm:min-w-[140px] sm:flex-1"
                >
                  Inscribirse
                </button>
              )}

              {activity.tipo === 'unica' && activity.fecha && (
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCancelPolicyModal(false);
            }}
          >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto min-w-0">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 text-xl font-bold text-gray-800 sm:text-2xl">
                    Política de Cancelación
                  </h2>
                  <button
                    onClick={() => setShowCancelPolicyModal(false)}
                    className="flex-shrink-0 text-2xl text-gray-500 hover:text-gray-700 sm:text-3xl"
                  >
                    ×
                  </button>
                </div>
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
              </div>
            </div>
          </div>
        )}

        {/* Modal de selección de fecha */}
        {showDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto min-w-0">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-gray-800 sm:text-xl md:text-2xl">
                    <span className="block sm:inline">Selecciona una fecha — </span>
                    <span className="break-words">{activity.titulo}</span>
                  </h2>
                  <button
                    onClick={() => {
                      setShowDateModal(false);
                      setShowConfirmModal(false);
                      setSelectedDate(null);
                    }}
                    className="flex-shrink-0 text-2xl text-gray-500 hover:text-gray-700"
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
                          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="mb-2 font-semibold text-gray-800">
                                {formatUtcCalendarDateEsAR(dateOption.fecha, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {dateOption.hora && (
                                <p className="mb-2 text-sm text-gray-600">Hora: {dateOption.hora}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 flex-col items-stretch gap-2 text-left sm:ml-4 sm:items-end sm:text-right">
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
                            <button
                              onClick={() => handleInscribeButtonClick(dateOption)}
                              className="btn btn-primary w-full"
                            >
                              Inscribirse
                            </button>
                          ) : (
                            <p className="text-sm text-red-600 font-semibold">Sin cupo disponible</p>
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
        {showConfirmModal && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto min-w-0">
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 flex-1 text-xl font-bold text-gray-800 sm:text-2xl">
                    Confirmar Inscripción
                  </h2>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedDate(null);
                      setComprobanteFile(null);
                    }}
                    className="flex-shrink-0 text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{activity.titulo}</h3>
                    {activity.descripcion && (
                      <p className="text-gray-600 mb-4">{activity.descripcion}</p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                      <span className="shrink-0 font-semibold text-gray-700 sm:w-24">Fecha:</span>
                      <span className="min-w-0 text-gray-800">
                        {formatUtcCalendarDateEsAR(selectedDate.fecha, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {selectedDate.hora && (
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="shrink-0 font-semibold text-gray-700 sm:w-24">Hora:</span>
                        <span className="text-gray-800">{selectedDate.hora}</span>
                      </div>
                    )}
                    {activity.lugar && (
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="shrink-0 font-semibold text-gray-700 sm:w-24">Lugar:</span>
                        <span className="min-w-0 break-words text-gray-800">{activity.lugar}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                      <span className="shrink-0 font-semibold text-gray-700 sm:w-24">Precio:</span>
                      <span className="text-gray-800">
                        {activity.esGratuita ? 'Gratis' : `$${activity.precio}`}
                      </span>
                    </div>
                  </div>

                  {!activity.esGratuita && (
                    <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <h4 className="font-semibold text-gray-800">Instrucciones de pago</h4>
                      {activity.instruccionesPagoResueltas ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{activity.instruccionesPagoResueltas}</p>
                      ) : (
                        <p className="text-gray-600 text-sm">
                          Realizá la transferencia por el monto indicado y subí el comprobante.
                        </p>
                      )}
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Comprobante de transferencia *
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white hover:file:opacity-90"
                        />
                        <p className="text-xs text-gray-500 mt-1">Imagen o PDF, máximo 5MB</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
                    <button
                      onClick={handleConfirmInscription}
                      className="btn btn-primary w-full justify-center min-w-0 sm:w-auto sm:min-w-[140px] sm:flex-1"
                    >
                      Confirmar Inscripción
                    </button>
                    <button
                      onClick={() => handleAddToCalendar(selectedDate)}
                      className="btn btn-secondary w-full justify-center sm:w-auto"
                    >
                      📅 Agregar al Calendario
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSelectedDate(null);
                      }}
                      className="btn btn-outline w-full justify-center sm:w-auto"
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

export default ActivityDetail;
