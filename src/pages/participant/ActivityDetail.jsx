import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
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
import InscriptionConfirmModal from '../../components/activities/InscriptionConfirmModal';
import { Button, Card, EmptyState, Icon, Modal, Spinner } from '../../components/ui';
import { useIdioma } from '../../i18n';

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { t, idioma } = useIdioma();

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

  // El cierre con Escape, la trampa de foco y el bloqueo de scroll los
  // resuelve ui/Modal. Antes había acá un listener global de keydown que
  // hacía sólo la primera de las tres cosas.

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
      showError(error.response?.data?.message || t('detalle.errorCarga'));
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
      // El mensaje del back está en castellano: en otro idioma va el propio.
      showSuccess((idioma === 'es' && response.data.message) || t('cartelera.inscripcionOk'));
      setShowConfirmModal(false);
      setShowDateModal(false);
      setSelectedDate(null);
      setComprobanteFile(null);
      await fetchActivity();
    } catch (error) {
      showError(error.response?.data?.message || t('cartelera.inscripcionError'));
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
        showError(t('cartelera.errorFechas'));
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
      showError(t('cartelera.faltaComprobante'));
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
    return <LoadingScreen message={t('detalle.cargando')} />;
  }

  if (!activity) return null;

  return (
    <PageContainer maxWidth="4xl">
        <Button variant="link" size="sm" icon="back" to="/activities" className="mb-6 min-h-0 px-0">
          {t('detalle.volver')}
        </Button>

        <Card padding="none" className="min-w-0">
          <div className="p-4 sm:p-6">
            <h1 dir="auto" className="mb-6 text-xl font-bold text-ink sm:text-2xl md:text-3xl">
              {activity.titulo}
            </h1>

            {activity.fotos && activity.fotos.length > 0 ? (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {activity.fotos.map((foto, index) => (
                    <img
                      key={index}
                      src={foto}
                      alt={`${activity.titulo} - Imagen ${index + 1}`}
                      className="h-64 w-full rounded-card object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                aria-hidden="true"
                className="mb-6 flex h-32 items-center justify-center rounded-card"
                style={{ background: 'linear-gradient(135deg, #689b7814, #689b7842)' }}
              >
                <Icon
                  name={activity.tipo === 'viaje' ? 'location' : activity.tipo === 'recurrente' ? 'time' : 'activity'}
                  size="2xl"
                  className="text-primary"
                  strokeWidth={1.5}
                />
              </div>
            )}

            <ActivityDescription activity={activity} variant="detail" />

            <ActivityTags activity={activity} catalog={publicTagCatalog} variant="detail" />

            <ActivityInfo activity={activity} variant="detail" />

            {activity.estadoInscripcion && activity.tipo === 'recurrente' && activity.fechaInscripcion && (
              <div className="mb-6">
                <p className="text-sm text-ink-muted">
                  Inscrito para: {formatUtcCalendarDateEsAR(activity.fechaInscripcion)}
                </p>
              </div>
            )}

            {activity.tipo === 'recurrente' && (
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold text-ink">{t('detalle.fechasDisponibles')}</h2>
                {loadingDates ? (
                  <div className="flex flex-col items-center py-8">
                    <Spinner size="lg" label={t('fechas.cargando')} />
                    <p className="mt-4 text-ink-muted">{t('fechas.cargando')}</p>
                  </div>
                ) : availableDates.length === 0 ? (
                  <EmptyState
                    icon="activity"
                    title={t('fechas.sinFechas')}
                    description={t('fechas.sinFechasTexto')}
                  />
                ) : (
                  <div className="space-y-2">
                    {availableDates.slice(0, 5).map((dateOption, index) => (
                      <div
                        key={index}
                        className={`rounded-card border-2 p-3 ${
                          dateOption.estadoInscripcion === 'aceptada'
                            ? 'border-success-500 bg-success-50'
                            : dateOption.estadoInscripcion === 'pendiente'
                            ? 'border-warning-500 bg-warning-50'
                            : dateOption.estadoInscripcion === 'en_espera'
                            ? 'border-info-500 bg-info-50'
                            : dateOption.tieneCupo
                            ? 'border-surface-border bg-surface'
                            : 'border-surface-border bg-surface opacity-50'
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink">
                              {formatUtcCalendarDateEsAR(dateOption.fecha, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {dateOption.hora && (
                              <p className="text-sm text-ink-muted">{t('fechas.hora', { hora: dateOption.hora })}</p>
                            )}
                            {dateOption.cuposDisponibles !== null && (
                              <p className={`text-sm font-semibold ${
                                dateOption.cuposDisponibles > 0 ? 'text-success-600' : 'text-danger-600'
                              }`}>
                                {dateOption.cuposDisponibles > 0
                                  ? t('fechas.cupos', { cupos: dateOption.cuposDisponibles })
                                  : t('fechas.sinCupo')}
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
                      <p className="mt-2 text-center text-sm text-ink-muted">
                        {t('detalle.masFechas', { cantidad: availableDates.length - 5 })}
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
                <Button onClick={handleInscribeClick} icon="check" className="w-full sm:w-auto">
                  {t('cartelera.inscribirse')}
                </Button>
              )}

              {(activity.tipo === 'unica' || activity.tipo === 'viaje') && activity.fecha && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="addToCalendar"
                  onClick={() => handleAddToCalendar()}
                  title={t('confirmar.agregarCalendario')}
                  className="w-full sm:w-auto"
                >
                  {t('confirmar.agregarCalendario')}
                </Button>
              )}

              {activity.ubicacionOnline && (
                <Button
                  variant="secondary"
                  icon="location"
                  href={activity.ubicacionOnline}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('cartelera.comoLlegoTitulo')}
                  className="w-full sm:w-auto sm:whitespace-nowrap"
                >
                  {t('cartelera.comoLlego')}
                </Button>
              )}

              {activity.tipo === 'recurrente' && availableDates.length > 0 && (
                <Button
                  variant="secondary"
                  icon="activity"
                  onClick={() => setShowDateModal(true)}
                  className="w-full sm:w-auto"
                >
                  {t('detalle.todasLasFechas')}
                </Button>
              )}

              {activity.politicaCancelacion && (
                <Button
                  variant="secondary"
                  icon="policy"
                  onClick={() => setShowCancelPolicyModal(true)}
                  className="w-full sm:w-auto"
                >
                  {t('detalle.politica')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Modal
          open={showCancelPolicyModal}
          onClose={() => setShowCancelPolicyModal(false)}
          title={t('detalle.politica')}
          footer={
            <Button onClick={() => setShowCancelPolicyModal(false)}>{t('comun.cerrar')}</Button>
          }
        >
          <div className="rounded-card border border-surface-border bg-surface p-4 sm:p-6">
            <p dir="auto" className="whitespace-pre-wrap leading-relaxed text-ink-soft">
              {activity.politicaCancelacion}
            </p>
          </div>
        </Modal>

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
