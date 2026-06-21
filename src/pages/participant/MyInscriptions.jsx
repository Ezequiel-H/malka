import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';
import {
  formatLocalDateToString,
  formatUtcCalendarDateToString,
  formatUtcCalendarDayAndTime,
} from '../../utils/dateUtils';
import { getPagoEstadoLabel, getPagoEstadoBadgeClass, putComprobante } from '../../utils/paymentUtils';

const MyInscriptions = () => {
  const { showSuccess, showError } = useToast();
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
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
      return;
    }

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

  const getEstadoBadge = (estado) => {
    const badges = {
      aceptada: { class: 'badge-success', text: 'Confirmada' },
      pendiente: { class: 'badge-warning', text: 'Pendiente' },
      cancelada: { class: 'badge-danger', text: 'Cancelada' },
      en_espera: { class: 'badge-info', text: 'En lista de espera' }
    };
    const badge = badges[estado] || badges.pendiente;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Cargando inscripciones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-primary">Mis Inscripciones</h1>

        <div className="card mb-8">
          <div className="form-group">
            <label>Filtrar por estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white max-w-xs"
            >
              <option value="">Todos</option>
              <option value="aceptada">Confirmadas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cancelada">Canceladas</option>
              <option value="en_espera">En lista de espera</option>
            </select>
          </div>
        </div>

        {inscriptions.length === 0 ? (
          <div className="card">
            <p className="text-gray-600 text-center py-4">No tienes inscripciones registradas.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-200 p-0 overflow-hidden">
            {inscriptions.map(inscription => {
              const activity = inscription.activityId;
              const horaEv = inscription.hora || activity?.hora || '';
              const hasPago = !!inscription.pago?.comprobante?.url;
              return (
                <div
                  key={inscription._id}
                  className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 hover:bg-gray-50/80"
                >
                  <div className="min-w-0 flex-1 flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-6">
                      <div className="font-semibold text-gray-900 truncate text-base sm:max-w-[42%] sm:shrink-0 sm:pr-2">
                        {activity?.titulo || 'Actividad eliminada'}
                      </div>
                      <div className="text-gray-800 tabular-nums text-base font-medium sm:text-lg sm:flex-1 sm:min-w-0">
                        {formatUtcCalendarDayAndTime(inscription.fecha, horaEv)}
                      </div>
                    </div>
                    {hasPago && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <span className={`badge ${getPagoEstadoBadgeClass(inscription.pago.estadoPago)}`}>
                          {getPagoEstadoLabel(inscription.pago.estadoPago)}
                        </span>
                        {inscription.pago.estadoPago === 'rechazado' && inscription.pago.motivoRechazo && (
                          <p className="text-red-600">Motivo: {inscription.pago.motivoRechazo}</p>
                        )}
                        {inscription.pago.estadoPago === 'pendiente' && inscription.estado === 'pendiente' && (
                          <p>Tu comprobante está en revisión. Te avisaremos cuando se confirme la inscripción.</p>
                        )}
                      </div>
                    )}
                    {hasPago && inscription.pago.estadoPago === 'rechazado' && (
                      <div className="mt-1 space-y-2">
                        {reuploadingId === inscription._id ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => setReuploadFile(e.target.files?.[0] || null)}
                              className="text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleReupload(inscription._id)}
                              className="btn btn-primary text-xs py-1.5 px-3"
                            >
                              Enviar nuevo comprobante
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReuploadingId(null);
                                setReuploadFile(null);
                              }}
                              className="btn btn-outline text-xs py-1.5 px-3"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReuploadingId(inscription._id);
                              setReuploadFile(null);
                            }}
                            className="btn btn-secondary text-xs py-1.5 px-3"
                          >
                            Volver a subir comprobante
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end text-sm">
                    {getEstadoBadge(inscription.estado)}
                    {inscription.estado !== 'cancelada' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(inscription._id)}
                        className="btn btn-danger text-xs py-1.5 px-3"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInscriptions;
