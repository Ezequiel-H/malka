import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { formatUtcCalendarDayAndTime } from '../../utils/dateUtils';
import { isPdfComprobante } from '../../utils/paymentUtils';
import { formatPrice } from '../../utils/priceUtils';
import PdfFirstPageViewer from './PdfFirstPageViewer';
import { Button, EmptyState, ImageLightbox, Modal, Spinner, useConfirm } from '../ui';

const adminUserPath = (userRef) => {
  const uid = typeof userRef === 'object' && userRef !== null ? userRef._id : userRef;
  return uid ? `/admin/users/${uid}` : null;
};

const ProofReviewCard = ({ inscription, processingId, onClose, onApprove, onReject, onOpenLightbox }) => {
  const activity = inscription.activityId;
  const user = inscription.userId;
  const comprobanteUrl = inscription.pago?.comprobante?.url;
  const userHref = adminUserPath(user);
  const nombreCompleto =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim() || '—';
  const isPdf = isPdfComprobante(inscription);
  const isBusy = processingId === inscription._id;

  return (
    <div className="overflow-hidden rounded-card border border-surface-border">
      <div className="flex flex-col lg:flex-row lg:min-h-[28rem]">
        <div className="lg:w-[58%] bg-ink/[0.03] border-b lg:border-b-0 lg:border-r border-surface-border flex items-center justify-center p-4 min-h-[16rem] lg:min-h-0">
          {comprobanteUrl ? (
            isPdf ? (
              <PdfFirstPageViewer url={comprobanteUrl} inscriptionId={inscription._id} />
            ) : (
              /* Botón, no link: el zoom se hace acá mismo en el lightbox,
                 sin irse a otra pestaña. */
              <button
                type="button"
                onClick={() => onOpenLightbox?.(comprobanteUrl)}
                title="Ampliar comprobante"
                className="flex h-full w-full cursor-zoom-in items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <img
                  src={comprobanteUrl}
                  alt="Comprobante de transferencia"
                  className="max-h-[14rem] w-full rounded object-contain lg:max-h-[26rem]"
                />
              </button>
            )
          ) : (
            <p className="text-sm text-ink-muted">Sin comprobante adjunto</p>
          )}
        </div>

        <div className="lg:w-[42%] p-4 sm:p-5 flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Evento
            </h3>
            <p className="break-words text-lg font-semibold text-ink">
              {activity?.titulo || 'Actividad eliminada'}
            </p>
            <p className="mt-1 text-sm tabular-nums text-ink-muted">
              {formatUtcCalendarDayAndTime(
                inscription.fecha,
                inscription.hora || activity?.hora
              )}
            </p>
            <p className="mt-2 text-base font-semibold text-ink">
              {formatPrice(inscription.pago?.montoEsperado ?? activity?.precio, activity?.moneda)}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Persona
            </h3>
            <p className="font-medium text-ink">
              {userHref ? (
                <Link to={userHref} className="font-medium text-primary hover:underline" onClick={onClose}>
                  {nombreCompleto}
                </Link>
              ) : (
                nombreCompleto
              )}
            </p>
            {user?.email && (
              <p className="mt-1 break-all text-sm text-ink-muted">{user.email}</p>
            )}
            {user?.telefono && (
              <p className="mt-0.5 text-sm text-ink-muted">{user.telefono}</p>
            )}
            <p className="mt-2 text-xs text-ink-muted">
              Inscripción:{' '}
              {inscription.fechaInscripcion
                ? new Date(inscription.fechaInscripcion).toLocaleString('es-AR')
                : '—'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col mt-auto pt-2">
            <Button
              icon="check"
              loading={isBusy}
              onClick={() => onApprove(inscription._id)}
              fullWidth
            >
              {isBusy ? 'Procesando...' : 'Aprobar'}
            </Button>
            <Button
              variant="danger"
              icon="close"
              disabled={isBusy}
              onClick={() => onReject(inscription._id)}
              fullWidth
            >
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PendingPaymentProofsModal = ({ open, onClose, onReviewed, activityId }) => {
  const { showSuccess, showError } = useToast();
  const confirm = useConfirm();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchPending = useCallback(async (preserveIndex = false) => {
    try {
      setLoading(true);
      const response = await axios.get('/inscriptions/pending-payments', {
        params: activityId ? { activityId } : undefined,
      });
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
  }, [showError, activityId]);

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
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goPrev, goNext, inscriptions.length]);

  const handleApprove = async (inscriptionId) => {
    const ok = await confirm({
      title: '¿Aprobar este comprobante?',
      description: 'La inscripción queda confirmada y la persona recibe el estado aprobado.',
      confirmLabel: 'Aprobar',
      tone: 'primary',
    });
    if (!ok) return;

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
    const motivoRechazo = await confirm({
      title: '¿Rechazar este comprobante?',
      description: 'La persona va a tener que subir un comprobante nuevo.',
      confirmLabel: 'Rechazar',
      prompt: { label: 'Motivo del rechazo', optional: true, placeholder: 'Ej: el monto no coincide' },
    });
    if (motivoRechazo === false) return;

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
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Revisar comprobantes"
      description={
        loading
          ? 'Cargando...'
          : inscriptions.length === 0
            ? 'No hay comprobantes pendientes'
            : hasMultiple
              ? `${currentIndex + 1} de ${inscriptions.length} pendientes`
              : '1 pendiente'
      }
    >
      {hasMultiple && !loading && inscriptions.length > 0 && (
        <div className="-mx-5 -mt-5 mb-5 flex shrink-0 items-center justify-between gap-3 border-b border-surface-border px-5 py-3">
          <Button variant="secondary" size="sm" icon="back" onClick={goPrev} disabled={!canGoPrev}>
            Anterior
          </Button>
          <span className="text-sm tabular-nums text-ink-muted">
            {currentIndex + 1} / {inscriptions.length}
          </span>
          <Button
            variant="secondary"
            size="sm"
            iconRight="forward"
            onClick={goNext}
            disabled={!canGoNext}
          >
            Siguiente
          </Button>
        </div>
      )}

      <div>
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <Spinner size="lg" label="Cargando comprobantes" />
            <p className="mt-4 text-ink-muted">Cargando comprobantes...</p>
          </div>
        ) : inscriptions.length === 0 ? (
          <EmptyState
            icon="document"
            title="Todo al día"
            description="No hay comprobantes por revisar en este momento."
          />
        ) : inscription ? (
          <ProofReviewCard
            inscription={inscription}
            processingId={processingId}
            onClose={onClose}
            onApprove={handleApprove}
            onReject={handleReject}
            onOpenLightbox={setLightboxUrl}
          />
        ) : null}
      </div>
      <ImageLightbox
        open={Boolean(lightboxUrl)}
        src={lightboxUrl}
        title="Comprobante de transferencia"
        onClose={() => setLightboxUrl(null)}
      />
    </Modal>
  );
};

export default PendingPaymentProofsModal;
