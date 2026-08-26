import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import {
  formatLocalDateToString,
  formatUtcCalendarDateToString,
  formatUtcCalendarDayAndTime,
} from '../../utils/dateUtils';
import { getPagoEstadoLabel, getPagoEstadoTone, putComprobante } from '../../utils/paymentUtils';
import PageContainer from '../../components/layout/PageContainer';
import InscriptionStatusTag from '../../components/activities/InscriptionStatusTag';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  FileInput,
  Select,
  useConfirm,
  SkeletonRows,
} from '../../components/ui';

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'aceptada', label: 'Confirmadas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'en_espera', label: 'En lista de espera' },
];

const MyInscriptions = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reuploadingId, setReuploadingId] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);

  useEffect(() => {
    fetchInscriptions();
  }, [filter]);

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const params = filter ? `?estado=${filter}` : '';
      const response = await axios.get(`/inscriptions/my${params}`);

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

  const handleCancel = async (inscriptionId) => {
    const ok = await confirm({
      title: '¿Cancelar esta inscripción?',
      description: 'Si después querés volver, vas a tener que inscribirte de nuevo.',
      confirmLabel: 'Cancelar inscripción',
      cancelLabel: 'Volver',
    });
    if (!ok) return;

    try {
      await axios.put(`/inscriptions/${inscriptionId}/cancel`);
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
      <Card className="mb-8">
        <Field label="Filtrar por estado" className="mb-0">
          <Select
            options={ESTADOS}
            value={filter}
            onChange={(value) => setFilter(value ?? '')}
            className="max-w-xs"
          />
        </Field>
      </Card>

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
        <Card padding="none" className="divide-y divide-surface-border overflow-hidden">
          {inscriptions.map((inscription) => {
            const activity = inscription.activityId;
            const horaEv = inscription.hora || activity?.hora || '';
            const hasPago = !!inscription.pago?.comprobante?.url;

            return (
              <div
                key={inscription._id}
                className="flex flex-col gap-3 px-4 py-3 transition-control duration-fast hover:bg-primary-50/40 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="truncate text-base font-semibold text-ink sm:max-w-[42%] sm:shrink-0 sm:pr-2">
                      {activity?.titulo || 'Actividad eliminada'}
                    </div>
                    <div className="text-base font-medium tabular-nums text-ink-soft sm:min-w-0 sm:flex-1 sm:text-lg">
                      {formatUtcCalendarDayAndTime(inscription.fecha, horaEv)}
                    </div>
                  </div>

                  {hasPago && (
                    <div className="space-y-1 text-sm text-ink-muted">
                      <Badge tone={getPagoEstadoTone(inscription.pago.estadoPago)} dot>
                        {getPagoEstadoLabel(inscription.pago.estadoPago)}
                      </Badge>
                      {inscription.pago.estadoPago === 'rechazado' &&
                        inscription.pago.motivoRechazo && (
                          <p className="text-danger-600">
                            Motivo: {inscription.pago.motivoRechazo}
                          </p>
                        )}
                      {inscription.pago.estadoPago === 'pendiente' &&
                        inscription.estado === 'pendiente' && (
                          <p>
                            Tu comprobante está en revisión. Te avisaremos cuando se confirme la
                            inscripción.
                          </p>
                        )}
                    </div>
                  )}

                  {hasPago && inscription.pago.estadoPago === 'rechazado' && (
                    <div className="mt-1 space-y-2">
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

                <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm sm:justify-end">
                  <InscriptionStatusTag estado={inscription.estado} aceptadaLabel="Confirmada" />
                  {inscription.estado !== 'cancelada' && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon="close"
                      onClick={() => handleCancel(inscription._id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </PageContainer>
  );
};

export default MyInscriptions;
