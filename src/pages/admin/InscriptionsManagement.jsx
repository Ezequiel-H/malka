import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';
import { getPagoEstadoLabel, getPagoEstadoTone } from '../../utils/paymentUtils';
import PendingPaymentProofsModal from '../../components/admin/PendingPaymentProofsModal';
import WaitlistExitModal from '../../components/activities/WaitlistExitModal';
import PageContainer from '../../components/layout/PageContainer';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  EmptyState,
  Field,
  Select,
  SkeletonRows,
  useConfirm,
} from '../../components/ui';

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'en_espera', label: 'En lista de espera' },
];

const ESTADO_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...ESTADO_OPTIONS,
];

/* Números en tinta: cuatro colores fuertes convertían el resumen en un
   semáforo. El estado ya lo dice el label. */
const RESUMEN = [
  { estado: 'pendiente', label: 'Pendientes' },
  { estado: 'aceptada', label: 'Aceptadas' },
  { estado: 'cancelada', label: 'Canceladas' },
  { estado: 'en_espera', label: 'En espera' },
];

const adminUserPath = (userRef) => {
  const uid = typeof userRef === 'object' && userRef !== null ? userRef._id : userRef;
  return uid ? `/admin/users/${uid}` : null;
};

const InscriptionsManagement = () => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [inscriptions, setInscriptions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [showProofsModal, setShowProofsModal] = useState(false);
  const [filters, setFilters] = useState({
    estado: searchParams.get('estado') || 'pendiente',
    activityId: searchParams.get('activityId') || '',
    fecha: searchParams.get('fecha') || ''
  });

  useEffect(() => {
    fetchActivities();
    fetchInscriptions();
    fetchPendingCount();
  }, [filters]);

  const fetchPendingCount = async () => {
    try {
      const response = await axios.get('/inscriptions/pending-payments');
      setPendingPaymentsCount(response.data.count ?? response.data.inscriptions?.length ?? 0);
    } catch {
      setPendingPaymentsCount(0);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/activities?estado=publicada');
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchInscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.estado) {
        params.append('estado', filters.estado);
      }
      if (filters.activityId) {
        params.append('activityId', filters.activityId);
      }
      if (filters.fecha) {
        params.append('fecha', filters.fecha);
      }

      const response = await axios.get(`/inscriptions?${params.toString()}`);
      setInscriptions(response.data.inscriptions || []);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
      showError('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  /* Sacar a alguien de la lista de espera tiene su propio modal: ahí el admin
     decide si le manda el mail y lo ve antes. */
  const [waitlistExit, setWaitlistExit] = useState(null);

  const handleWaitlistExit = async (notificar) => {
    const { inscription, estado } = waitlistExit;
    try {
      await axios.put(`/inscriptions/${inscription._id}/status`, { estado, notificar });
      showSuccess(notificar ? 'Estado actualizado y mail enviado' : `Estado actualizado a ${getEstadoLabel(estado)}`);
      setWaitlistExit(null);
      fetchInscriptions();
      fetchPendingCount();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleStatusChange = async (inscription, newStatus) => {
    if (inscription.estado === 'en_espera' && ['pendiente', 'aceptada'].includes(newStatus)) {
      setWaitlistExit({ inscription, estado: newStatus });
      return;
    }

    const inscriptionId = inscription._id;
    const ok = await confirm({
      title: `¿Cambiar el estado a "${getEstadoLabel(newStatus)}"?`,
      description: 'La persona ve este estado en sus inscripciones.',
      confirmLabel: 'Cambiar estado',
      tone: newStatus === 'cancelada' ? 'danger' : 'primary',
    });
    if (!ok) return;

    try {
      await axios.put(`/inscriptions/${inscriptionId}/status`, { estado: newStatus });
      showSuccess(`Estado actualizado a ${getEstadoLabel(newStatus)}`);
      fetchInscriptions();
      fetchPendingCount();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleProofReviewed = () => {
    fetchInscriptions();
    fetchPendingCount();
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      aceptada: 'Aceptada',
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
      en_espera: 'En lista de espera'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <PageContainer title="Inscripciones">
        <SkeletonRows count={8} />
      </PageContainer>
    );
  }

  const activityOptions = [
    { value: '', label: 'Todas las actividades' },
    ...activities.map((activity) => ({ value: activity._id, label: activity.titulo })),
  ];

  return (
    <PageContainer
      title="Inscripciones"
      actions={
        <Button
          icon="document"
          onClick={() => setShowProofsModal(true)}
          className="w-full sm:w-auto"
        >
          Revisar comprobantes
          {pendingPaymentsCount > 0 && (
            /* Contador integrado al botón: pill translúcido del mismo esquema,
               no un badge de otro color peleando con el fondo verde. */
            <span className="ml-1 rounded-pill bg-white/25 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
              {pendingPaymentsCount}
            </span>
          )}
        </Button>
      }
    >

        <Card className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Estado" className="mb-0">
              <Select
                options={ESTADO_FILTER_OPTIONS}
                value={filters.estado}
                onChange={(value) => setFilters({ ...filters, estado: value ?? '' })}
              />
            </Field>

            <Field label="Actividad" className="mb-0">
              <Select
                options={activityOptions}
                value={filters.activityId}
                onChange={(value) => setFilters({ ...filters, activityId: value ?? '' })}
                searchable={activityOptions.length > 8}
              />
            </Field>

            <Field label="Fecha" className="mb-0">
              <DatePicker
                value={filters.fecha}
                onChange={(value) => setFilters({ ...filters, fecha: value })}
                placeholder="Todas las fechas"
                clearable
              />
            </Field>
          </div>
        </Card>

        {inscriptions.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon="search"
              title="Sin resultados"
              description="No encontramos inscripciones con los filtros seleccionados."
            />
          </Card>
        ) : (
          <Card padding="none" className="divide-y divide-surface-border overflow-hidden">
            {/* Encabezado: la lista sin rótulos obligaba a adivinar qué era
                cada columna. */}
            <div className="hidden border-b border-surface-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-12 sm:gap-x-3">
              <div className="sm:col-span-4">Participante</div>
              <div className="sm:col-span-4">Actividad</div>
              <div className="sm:col-span-4 text-right">Estado</div>
            </div>

            {inscriptions.map(inscription => {
              const horaEv = inscription.hora || inscription.activityId?.hora || '';
              const nombreCompleto = [inscription.userId?.nombre, inscription.userId?.apellido]
                .filter(Boolean)
                .join(' ')
                .trim();
              const contacto = [inscription.userId?.email, inscription.userId?.telefono]
                .filter(Boolean)
                .join(' · ');
              const userHref = adminUserPath(inscription.userId);
              const linkLabel =
                nombreCompleto ||
                (typeof inscription.userId === 'object' && inscription.userId?.email) ||
                'Ver perfil';

              return (
                <div
                  key={inscription._id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 text-sm transition-control duration-fast hover:bg-primary-50/40 sm:grid-cols-12 sm:items-center sm:gap-x-3"
                >
                  {/* Persona: nombre arriba, contacto abajo en chico. Todo en
                      una línea aplastaba la fila y rompía en dos renglones. */}
                  <div className="min-w-0 sm:col-span-4">
                    {userHref ? (
                      <Link
                        to={userHref}
                        className="block truncate font-medium text-ink hover:text-primary hover:underline"
                      >
                        {linkLabel}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium text-ink">{nombreCompleto || '—'}</span>
                    )}
                    <span className="block truncate text-xs text-ink-muted">{contacto || '—'}</span>
                  </div>

                  <div className="min-w-0 sm:col-span-4">
                    <span className="block truncate text-ink-soft">
                      {inscription.activityId?.titulo || 'Actividad no encontrada'}
                    </span>
                    <span className="block whitespace-nowrap text-xs tabular-nums text-ink-muted">
                      {formatUtcCalendarDayAndTime(inscription.fecha, horaEv)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:col-span-4 sm:justify-end">
                    {inscription.pago?.comprobante?.url && (
                      <Badge tone={getPagoEstadoTone(inscription.pago.estadoPago)} dot>
                        {getPagoEstadoLabel(inscription.pago.estadoPago)}
                      </Badge>
                    )}
                    <Select
                      options={ESTADO_OPTIONS}
                      value={inscription.estado}
                      onChange={(value) => handleStatusChange(inscription, value)}
                      size="sm"
                      className="w-44"
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <Card className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold text-ink">Resumen</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {RESUMEN.map(({ estado, label }) => (
              <div key={estado} className="rounded-card border border-surface-border bg-surface px-3 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">
                  {inscriptions.filter((i) => i.estado === estado).length}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>

      <PendingPaymentProofsModal
        open={showProofsModal}
        onClose={() => setShowProofsModal(false)}
        onReviewed={handleProofReviewed}
      />

      {waitlistExit && (
        <WaitlistExitModal
          inscription={waitlistExit.inscription}
          estado={waitlistExit.estado}
          onClose={() => setWaitlistExit(null)}
          onConfirm={handleWaitlistExit}
        />
      )}
    </PageContainer>
  );
};

export default InscriptionsManagement;
