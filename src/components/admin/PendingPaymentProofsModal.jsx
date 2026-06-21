import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';
import { isPdfComprobante } from '../../utils/paymentUtils';
import PdfFirstPageViewer from './PdfFirstPageViewer';

const adminUserPath = (userRef) => {
  const uid = typeof userRef === 'object' && userRef !== null ? userRef._id : userRef;
  return uid ? `/admin/users/${uid}` : null;
};

const ProofReviewCard = ({ inscription, processingId, onClose, onApprove, onReject }) => {
  const activity = inscription.activityId;
  const user = inscription.userId;
  const comprobanteUrl = inscription.pago?.comprobante?.url;
  const userHref = adminUserPath(user);
  const nombreCompleto =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim() || '—';
  const isPdf = isPdfComprobante(inscription);
  const isBusy = processingId === inscription._id;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:min-h-[28rem]">
        <div className="lg:w-[58%] bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-200 flex items-center justify-center p-4 min-h-[16rem] lg:min-h-0">
          {comprobanteUrl ? (
            isPdf ? (
              <PdfFirstPageViewer url={comprobanteUrl} inscriptionId={inscription._id} />
            ) : (
              <a
                href={comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full flex items-center justify-center"
              >
                <img
                  src={comprobanteUrl}
                  alt="Comprobante de transferencia"
                  className="max-h-[14rem] lg:max-h-[26rem] w-full object-contain rounded"
                />
              </a>
            )
          ) : (
            <p className="text-sm text-gray-500">Sin comprobante adjunto</p>
          )}
        </div>

        <div className="lg:w-[42%] p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Evento
            </h3>
            <p className="font-semibold text-gray-900 break-words text-lg">
              {activity?.titulo || 'Actividad eliminada'}
            </p>
            <p className="text-sm text-gray-600 tabular-nums mt-1">
              {formatUtcCalendarDayAndTime(
                inscription.fecha,
                inscription.hora || activity?.hora
              )}
            </p>
            <p className="text-base font-semibold text-gray-800 mt-2">
              ${inscription.pago?.montoEsperado ?? activity?.precio ?? '—'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Persona
            </h3>
            <p className="font-medium text-gray-900">
              {userHref ? (
                <Link to={userHref} className="text-primary hover:underline" onClick={onClose}>
                  {nombreCompleto}
                </Link>
              ) : (
                nombreCompleto
              )}
            </p>
            {user?.email && (
              <p className="text-sm text-gray-600 break-all mt-1">{user.email}</p>
            )}
            {user?.telefono && (
              <p className="text-sm text-gray-600 mt-0.5">{user.telefono}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Inscripción:{' '}
              {inscription.fechaInscripcion
                ? new Date(inscription.fechaInscripcion).toLocaleString('es-AR')
                : '—'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col mt-auto pt-2">
            <button
              type="button"
              onClick={() => onApprove(inscription._id)}
              disabled={isBusy}
              className="btn btn-primary w-full justify-center"
            >
              {isBusy ? 'Procesando...' : 'Aprobar'}
            </button>
            <button
              type="button"
              onClick={() => onReject(inscription._id)}
              disabled={isBusy}
              className="btn btn-danger w-full justify-center"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PendingPaymentProofsModal = ({ open, onClose, onReviewed }) => {
  const { showSuccess, showError } = useToast();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchPending = useCallback(async (preserveIndex = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/inscriptions/pending-payments');
      const list = response.data.inscriptions || [];
      setInscriptions(list);
      if (!preserveIndex) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex((prev) => Math.min(prev, Math.max(0, list.length - 1)));
      }
    } catch {
      showError('Error al cargar comprobantes pendientes');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
    fetchPending(false);
  }, [open, fetchPending]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(inscriptions.length - 1, i + 1));
  }, [inscriptions.length]);

  useEffect(() => {
    if (!open || inscriptions.length === 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext, inscriptions.length]);

  const handleApprove = async (inscriptionId) => {
    try {
      setProcessingId(inscriptionId);
      const response = await axios.put(`/inscriptions/${inscriptionId}/payment/approve`);
      showSuccess(response.data.message || 'Comprobante aprobado');
      await fetchPending(true);
      onReviewed?.();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (inscriptionId) => {
    const motivoRechazo = window.prompt('Motivo del rechazo (opcional):') ?? '';
    try {
      setProcessingId(inscriptionId);
      const response = await axios.put(`/inscriptions/${inscriptionId}/payment/reject`, { motivoRechazo });
      showSuccess(response.data.message || 'Comprobante rechazado');
      await fetchPending(true);
      onReviewed?.();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar');
    } finally {
      setProcessingId(null);
    }
  };

  if (!open) return null;

  const inscription = inscriptions[currentIndex];
  const hasMultiple = inscriptions.length > 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < inscriptions.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col min-w-0">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Revisar comprobantes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {loading
                ? 'Cargando...'
                : inscriptions.length === 0
                  ? 'No hay comprobantes pendientes'
                  : hasMultiple
                    ? `${currentIndex + 1} de ${inscriptions.length} pendientes`
                    : '1 pendiente'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700 shrink-0"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {hasMultiple && !loading && inscriptions.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="btn btn-secondary text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-600 tabular-nums">
              {currentIndex + 1} / {inscriptions.length}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="btn btn-secondary text-sm py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <div className="spinner" />
              <p className="mt-4 text-gray-600">Cargando comprobantes...</p>
            </div>
          ) : inscriptions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No hay comprobantes por revisar en este momento.
            </p>
          ) : inscription ? (
            <ProofReviewCard
              inscription={inscription}
              processingId={processingId}
              onClose={onClose}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentProofsModal;
