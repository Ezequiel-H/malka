import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';
import { getPagoEstadoLabel, getPagoEstadoBadgeClass } from '../../utils/paymentUtils';
import PendingPaymentProofsModal from '../../components/admin/PendingPaymentProofsModal';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import EmptyState from '../../components/common/EmptyState';
import InscriptionStatusTag from '../../components/activities/InscriptionStatusTag';

const adminUserPath = (userRef) => {
  const uid = typeof userRef === 'object' && userRef !== null ? userRef._id : userRef;
  return uid ? `/admin/users/${uid}` : null;
};

const InscriptionsManagement = () => {
  const { showSuccess, showError } = useToast();
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

  const handleStatusChange = async (inscriptionId, newStatus) => {
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
    return <LoadingScreen message="Cargando inscripciones..." />;
  }

  return (
    <PageContainer
      title="Gestión de Inscripciones"
      actions={
        <button
          type="button"
          onClick={() => setShowProofsModal(true)}
          className="btn btn-secondary w-full sm:w-auto justify-center relative"
        >
          Revisar comprobantes
          {pendingPaymentsCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-yellow-500 text-white text-xs font-bold">
              {pendingPaymentsCount}
            </span>
          )}
        </button>
      }
    >

        <div className="card mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="form-group">
              <label>Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptada">Aceptada</option>
                <option value="cancelada">Cancelada</option>
                <option value="en_espera">En lista de espera</option>
              </select>
            </div>

            <div className="form-group">
              <label>Actividad</label>
              <select
                value={filters.activityId}
                onChange={(e) => setFilters({ ...filters, activityId: e.target.value })}
                className="bg-white"
              >
                <option value="">Todas las actividades</option>
                {activities.map(activity => (
                  <option key={activity._id} value={activity._id}>
                    {activity.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={filters.fecha}
                onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {inscriptions.length === 0 ? (
          <EmptyState message="No se encontraron inscripciones con los filtros seleccionados." />
        ) : (
          <div className="card divide-y divide-gray-200 p-0 overflow-hidden">
            {inscriptions.map(inscription => {
              const horaEv = inscription.hora || inscription.activityId?.hora || '';
              const nombreCompleto = [inscription.userId?.nombre, inscription.userId?.apellido]
                .filter(Boolean)
                .join(' ')
                .trim();
              const tel = inscription.userId?.telefono || '—';
              const mail = inscription.userId?.email || '—';
              const userHref = adminUserPath(inscription.userId);
              const linkLabel =
                nombreCompleto ||
                (typeof inscription.userId === 'object' && inscription.userId?.email) ||
                'Ver perfil';
              const contactoSinLink = [
                nombreCompleto || '—',
                tel,
                mail,
              ].join(' · ');
              return (
                <div
                  key={inscription._id}
                  className="px-4 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-sm hover:bg-gray-50/80"
                >
                  <div className="min-w-0 flex-1 grid gap-1 sm:grid-cols-12 sm:gap-x-3 sm:items-center">
                    <div className="sm:col-span-4 font-medium text-gray-900 truncate">
                      {inscription.activityId?.titulo || 'Actividad no encontrada'}
                    </div>
                    <div className="sm:col-span-3 text-gray-600 tabular-nums whitespace-nowrap">
                      {formatUtcCalendarDayAndTime(inscription.fecha, horaEv)}
                    </div>
                    <div className="sm:col-span-5 text-gray-700 min-w-0 break-words">
                      {userHref ? (
                        <>
                          <Link to={userHref} className="text-primary font-medium hover:underline">
                            {linkLabel}
                          </Link>
                          <span>
                            {' · '}
                            {tel}
                            {' · '}
                            {mail}
                          </span>
                        </>
                      ) : (
                        contactoSinLink
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <InscriptionStatusTag estado={inscription.estado} />
                    {inscription.pago?.comprobante?.url && (
                      <span className={`badge ${getPagoEstadoBadgeClass(inscription.pago.estadoPago)}`}>
                        {getPagoEstadoLabel(inscription.pago.estadoPago)}
                      </span>
                    )}
                    <select
                      value={inscription.estado}
                      onChange={(e) => handleStatusChange(inscription._id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aceptada">Aceptada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="en_espera">En lista de espera</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Resumen</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">
                {inscriptions.filter(i => i.estado === 'pendiente').length}
              </p>
              <p className="text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {inscriptions.filter(i => i.estado === 'aceptada').length}
              </p>
              <p className="text-gray-600">Aceptadas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {inscriptions.filter(i => i.estado === 'cancelada').length}
              </p>
              <p className="text-gray-600">Canceladas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {inscriptions.filter(i => i.estado === 'en_espera').length}
              </p>
              <p className="text-gray-600">En espera</p>
            </div>
          </div>
        </div>

      <PendingPaymentProofsModal
        open={showProofsModal}
        onClose={() => setShowProofsModal(false)}
        onReviewed={handleProofReviewed}
      />
    </PageContainer>
  );
};

export default InscriptionsManagement;
