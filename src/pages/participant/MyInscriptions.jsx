import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import {
  formatLocalDateToString,
  formatUtcCalendarDateToString,
  formatUtcCalendarDayAndTime,
} from '../../utils/dateUtils';
import { getPagoEstadoLabel, getPagoEstadoTone, putComprobante } from '../../utils/paymentUtils';
import PageContainer from '../../components/layout/PageContainer';
import {
  Badge,
  Button,
  Card,
  cn,
  EmptyState,
  FileInput,
  Icon,
  useConfirm,
  SkeletonRows,
} from '../../components/ui';

/* Secciones en orden de urgencia: lo pendiente puede requerir acción (un
   comprobante rechazado), lo cancelado es archivo. */
const GRUPOS = [
  { estado: 'pendiente', label: 'Pendientes' },
  { estado: 'aceptada', label: 'Confirmadas' },
  { estado: 'en_espera', label: 'En lista de espera' },
  { estado: 'cancelada', label: 'Canceladas' },
];

const MyInscriptions = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reuploadingId, setReuploadingId] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);

  useEffect(() => {
    fetchInscriptions();
  }, []);

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/inscriptions/my');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayStr = formatLocalDateToString(yesterday);

      const filteredInscriptions = response.data.inscriptions.filter((inscription) => {
        if (!inscription.fecha) return false;
        const dayStr = formatUtcCalendarDateToString(inscription.fecha);
        if (!dayStr) return false;
        return dayStr >= yesterdayStr;
      });

      setInscriptions(filteredInscriptions);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (inscription) => {
    const titulo = inscription.activityId?.titulo;
    const ok = await confirm({
      title: titulo ? `¿Cancelar tu inscripción a «${titulo}»?` : '¿Cancelar esta inscripción?',
      description: 'Si después querés volver, vas a tener que inscribirte de nuevo.',
      confirmLabel: 'Cancelar inscripción',
      cancelLabel: 'Volver',
    });
    if (!ok) return;

    try {
      await axios.put(`/inscriptions/${inscription._id}/cancel`);
      showSuccess('Inscripción cancelada exitosamente');
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al cancelar inscripción');
    }
  };

  const handleReupload = async (inscriptionId) => {
    if (!reuploadFile) {
      showError('Seleccioná un comprobante para subir');
      return;
    }
    try {
      const response = await putComprobante(axios, inscriptionId, reuploadFile);
      showSuccess(response.data.message || 'Comprobante actualizado');
      setReuploadingId(null);
      setReuploadFile(null);
      fetchInscriptions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al subir comprobante');
    }
  };

  if (loading) {
    return (
      <PageContainer title="Mis inscripciones">
        <SkeletonRows count={5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Mis inscripciones">
      {inscriptions.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="activity"
            title="Todavía no tenés inscripciones"
            description="Cuando te anotes en una actividad, va a aparecer acá."
            action={
              <Button to="/activities" icon="activity" size="sm">
                Ver actividades
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {GRUPOS.map(({ estado, label }) => {
            const grupo = inscriptions.filter((i) => i.estado === estado);
            if (grupo.length === 0) return null;
            const cancelada = estado === 'cancelada';

            return (
              <section key={estado}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  {label} <span className="font-normal text-ink-faint">· {grupo.length}</span>
                </h2>
                <Card
                  padding="none"
                  className={cn(
                    'divide-y divide-surface-border overflow-hidden',
                    cancelada && 'opacity-70'
                  )}
                >
                  {grupo.map((inscription) => {
                    const activity = inscription.activityId;
                    const horaEv = inscription.hora || activity?.hora || '';
                    const hasPago = !!inscription.pago?.comprobante?.url;

                    return (
                      <div
                        key={inscription._id}
                        className="flex flex-col gap-2 px-4 py-3 sm:px-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                          <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:items-baseline">
                            {activity ? (
                              <Link
                                to={`/activities/${activity._id}`}
                                className="truncate text-base font-semibold text-ink transition-control duration-fast hover:text-primary hover:underline"
                              >
                                {activity.titulo}
                              </Link>
                            ) : (
                              <span className="truncate text-base font-semibold text-ink-muted">
                                Actividad eliminada
                              </span>
                            )}
                            <span className="flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-ink-soft">
                              <Icon name="activity" size="sm" className="shrink-0 text-ink-faint" />
                              {formatUtcCalendarDayAndTime(inscription.fecha, horaEv)}
                            </span>
                          </div>

                          {cancelada ? (
                            activity && (
                              <Button
                                size="sm"
                                variant="link"
                                iconRight="forward"
                                to={`/activities/${activity._id}`}
                                className="min-h-0 shrink-0 px-0"
                              >
                                Inscribirse de nuevo
                              </Button>
                            )
                          ) : (
                            /* Acción destructiva pero secundaria: presencia mínima
                               hasta el hover, la confirmación fuerte vive en el
                               diálogo. */
                            <Button
                              size="sm"
                              variant="ghost"
                              icon="close"
                              onClick={() => handleCancel(inscription)}
                              className="min-h-0 shrink-0 px-2 py-1 text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>

                        {hasPago && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                            <Badge tone={getPagoEstadoTone(inscription.pago.estadoPago)} dot>
                              {getPagoEstadoLabel(inscription.pago.estadoPago)}
                            </Badge>
                            {inscription.pago.estadoPago === 'rechazado' &&
                              inscription.pago.motivoRechazo && (
                                <span className="text-danger-600">
                                  Motivo: {inscription.pago.motivoRechazo}
                                </span>
                              )}
                            {inscription.pago.estadoPago === 'pendiente' &&
                              inscription.estado === 'pendiente' && (
                                <span>
                                  Tu comprobante está en revisión. Te avisaremos cuando se confirme la
                                  inscripción.
                                </span>
                              )}
                          </div>
                        )}

                        {hasPago && inscription.pago.estadoPago === 'rechazado' && (
                          <div className="space-y-2">
                            {reuploadingId === inscription._id ? (
                              <div className="space-y-2">
                                <FileInput
                                  accept="image/*,application/pdf"
                                  value={reuploadFile}
                                  onChange={setReuploadFile}
                                  maxSize={5 * 1024 * 1024}
                                  hint="Arrastrá el comprobante, pegalo o hacé click"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    icon="upload"
                                    onClick={() => handleReupload(inscription._id)}
                                  >
                                    Enviar nuevo comprobante
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setReuploadingId(null);
                                      setReuploadFile(null);
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon="upload"
                                onClick={() => {
                                  setReuploadingId(inscription._id);
                                  setReuploadFile(null);
                                }}
                              >
                                Volver a subir comprobante
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

export default MyInscriptions;
