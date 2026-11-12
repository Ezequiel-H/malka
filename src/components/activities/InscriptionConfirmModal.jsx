import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import { renderPlantilla, plantillaContext, buildWaLink } from '../../utils/whatsapp';
import { Alert, Button, Field, FileInput, Modal } from '../ui';
import { useIdioma } from '../../i18n/IdiomaContext';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="shrink-0 font-semibold text-ink-soft sm:w-24">{label}</span>
    <span className="min-w-0 break-words text-ink">{children}</span>
  </div>
);

/**
 * Modal para confirmar una inscripción: resumen del evento en la fecha elegida,
 * instrucciones de pago (o coordinación por WhatsApp para viajes) y acciones.
 */
const InscriptionConfirmModal = ({
  activity,
  selectedDate,
  onComprobanteChange,
  onConfirm,
  onAddToCalendar,
  onClose,
}) => {
  /* El archivo se refleja acá sólo para poder mostrarlo en el FileInput; la
     página sigue siendo la dueña del valor que se envía. */
  const [comprobante, setComprobante] = useState(null);
  const { user } = useAuth();
  const { t } = useIdioma();

  if (!activity || !selectedDate) return null;

  const esViaje = activity.tipo === 'viaje';

  /* El número y la plantilla vienen de Ajustes (resueltos por el back en la
     actividad); las variables se completan acá, que conocemos al usuario. */
  const waViajeLink = buildWaLink(
    activity.whatsappViaje?.numero,
    renderPlantilla(
      activity.whatsappViaje?.mensaje,
      plantillaContext({ user, activity, fecha: selectedDate.fecha, hora: selectedDate.hora })
    )
  );

  const handleComprobante = (file) => {
    setComprobante(file);
    onComprobanteChange(file);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('confirmar.titulo')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('comun.cancelar')}
          </Button>
          <Button icon="check" onClick={onConfirm}>
            {t('confirmar.titulo')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-xl font-semibold text-ink">{activity.titulo}</h3>
          {activity.descripcion && (
            <p className="mb-4 whitespace-pre-wrap text-ink-muted">{activity.descripcion}</p>
          )}
        </div>

        <div className="space-y-3 rounded-card border border-surface-border bg-surface p-4">
          <InfoRow label={esViaje ? t('info.inicio') : t('info.fecha')}>
            {formatUtcCalendarDateEsAR(selectedDate.fecha, LONG_DATE_OPTS)}
            {esViaje && selectedDate.hora ? ` · ${selectedDate.hora}` : ''}
          </InfoRow>

          {esViaje && activity.fechaFin && (
            <InfoRow label={t('info.finaliza')}>
              {formatUtcCalendarDateEsAR(activity.fechaFin, LONG_DATE_OPTS)}
              {activity.horaFin ? ` · ${activity.horaFin}` : ''}
            </InfoRow>
          )}

          {selectedDate.hora && !esViaje && <InfoRow label={t('info.hora')}>{selectedDate.hora}</InfoRow>}

          {activity.lugar && <InfoRow label={t('info.lugar')}>{activity.lugar}</InfoRow>}

          <InfoRow label={t('info.precio')}>{formatActivityPrice(activity)}</InfoRow>

          {activity.duracion && <InfoRow label={t('info.duracion')}>{t('info.minutos', { minutos: activity.duracion })}</InfoRow>}

          {/* Las acciones sobre la fecha y el lugar viven junto a los datos a
              los que refieren, no sueltas al pie del modal. */}
          <div className="flex flex-wrap gap-2 border-t border-surface-border pt-3">
            {activity.ubicacionOnline && (
              <Button
                variant="secondary"
                size="sm"
                icon="location"
                href={activity.ubicacionOnline}
                target="_blank"
                rel="noopener noreferrer"
                title={t('cartelera.comoLlegoTitulo')}
              >
                {t('cartelera.comoLlego')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon="addToCalendar"
              onClick={onAddToCalendar}
              title={t('confirmar.agregarCalendario')}
            >
              {t('confirmar.agregarCalendario')}
            </Button>
          </div>
        </div>

        {!activity.esGratuita && !esViaje && (
          <Alert tone="warning" title={t('confirmar.instruccionesPago')}>
            {activity.instruccionesPagoResueltas ? (
              <p className="whitespace-pre-wrap">{activity.instruccionesPagoResueltas}</p>
            ) : (
              <p>{t('confirmar.transferencia')}</p>
            )}

            <Field label={t('confirmar.comprobante')} className="mb-0 mt-3" required>
              <FileInput
                accept="image/*,application/pdf"
                value={comprobante}
                onChange={handleComprobante}
                maxSize={5 * 1024 * 1024}
                hint={t('confirmar.comprobanteAyuda')}
              />
            </Field>
          </Alert>
        )}

        {!activity.esGratuita && esViaje && (
          <Alert tone="warning" title={t('confirmar.pagoViaje')}>
            {t('confirmar.pagoViajeTexto')}
            {waViajeLink && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="whatsapp"
                  href={waViajeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('confirmar.escribinos')}
                </Button>
              </div>
            )}
          </Alert>
        )}
      </div>
    </Modal>
  );
};

export default InscriptionConfirmModal;
