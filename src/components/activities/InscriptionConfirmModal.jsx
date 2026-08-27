import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import { renderPlantilla, plantillaContext, buildWaLink } from '../../utils/whatsapp';
import { Alert, Button, Field, FileInput, Modal } from '../ui';

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
      title="Confirmar inscripción"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon="check" onClick={onConfirm}>
            Confirmar inscripción
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
          <InfoRow label={esViaje ? 'Inicio:' : 'Fecha:'}>
            {formatUtcCalendarDateEsAR(selectedDate.fecha, LONG_DATE_OPTS)}
            {esViaje && selectedDate.hora ? ` · ${selectedDate.hora}` : ''}
          </InfoRow>

          {esViaje && activity.fechaFin && (
            <InfoRow label="Finaliza:">
              {formatUtcCalendarDateEsAR(activity.fechaFin, LONG_DATE_OPTS)}
              {activity.horaFin ? ` · ${activity.horaFin}` : ''}
            </InfoRow>
          )}

          {selectedDate.hora && !esViaje && <InfoRow label="Hora:">{selectedDate.hora}</InfoRow>}

          {activity.lugar && <InfoRow label="Lugar:">{activity.lugar}</InfoRow>}

          <InfoRow label="Precio:">{formatActivityPrice(activity)}</InfoRow>

          {activity.duracion && <InfoRow label="Duración:">{activity.duracion} minutos</InfoRow>}

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
                title="Ver ubicación en Google Maps"
              >
                ¿Cómo llego?
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon="addToCalendar"
              onClick={onAddToCalendar}
              title="Agregar al calendario"
            >
              Agregar al calendario
            </Button>
          </div>
        </div>

        {!activity.esGratuita && !esViaje && (
          <Alert tone="warning" title="Instrucciones de pago">
            {activity.instruccionesPagoResueltas ? (
              <p className="whitespace-pre-wrap">{activity.instruccionesPagoResueltas}</p>
            ) : (
              <p>Realizá la transferencia por el monto indicado y subí el comprobante.</p>
            )}

            <Field label="Comprobante de transferencia" className="mb-0 mt-3" required>
              <FileInput
                accept="image/*,application/pdf"
                value={comprobante}
                onChange={handleComprobante}
                maxSize={5 * 1024 * 1024}
                hint="Arrastrá el comprobante, pegalo o hacé click"
              />
            </Field>
          </Alert>
        )}

        {!activity.esGratuita && esViaje && (
          <Alert tone="warning" title="Pago del viaje">
            No necesitás transferir ni subir comprobante ahora. Una vez confirmado tu cupo,
            coordinamos el pago por WhatsApp.
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
                  Escribinos por WhatsApp
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
