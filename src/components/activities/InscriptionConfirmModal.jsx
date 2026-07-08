import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { formatActivityPrice } from '../../utils/priceUtils';
import Modal from '../layout/Modal';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
    <span className="shrink-0 font-semibold text-gray-700 sm:w-24">{label}</span>
    <span className="min-w-0 break-words text-gray-800">{children}</span>
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
  if (!activity || !selectedDate) return null;

  const esViaje = activity.tipo === 'viaje';

  return (
    <Modal onClose={onClose} title="Confirmar Inscripción" closeOnBackdrop={false} closeOnEsc={false}>
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{activity.titulo}</h3>
          {activity.descripcion && (
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{activity.descripcion}</p>
          )}
        </div>

        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
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

          {activity.ubicacionOnline && (
            <InfoRow label="Ubicación:">
              <a
                href={activity.ubicacionOnline}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Ver en Google Maps
              </a>
            </InfoRow>
          )}

          <InfoRow label="Precio:">{formatActivityPrice(activity)}</InfoRow>

          {activity.duracion && <InfoRow label="Duración:">{activity.duracion} minutos</InfoRow>}
        </div>

        {!activity.esGratuita && !esViaje && (
          <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="font-semibold text-gray-800">Instrucciones de pago</h4>
            {activity.instruccionesPagoResueltas ? (
              <p className="text-gray-700 whitespace-pre-wrap">{activity.instruccionesPagoResueltas}</p>
            ) : (
              <p className="text-gray-600 text-sm">
                Realizá la transferencia por el monto indicado y subí el comprobante.
              </p>
            )}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Comprobante de transferencia *
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onComprobanteChange(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white hover:file:opacity-90"
              />
              <p className="text-xs text-gray-500 mt-1">Imagen o PDF, máximo 5MB</p>
            </div>
          </div>
        )}

        {!activity.esGratuita && esViaje && (
          <div className="space-y-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="font-semibold text-gray-800">Pago del viaje</h4>
            <p className="text-gray-700 text-sm">
              No necesitás transferir ni subir comprobante ahora. Una vez confirmado tu cupo,
              coordinamos el pago por WhatsApp.
            </p>
            <a
              href="https://wa.me/5491134405730"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full justify-center sm:w-auto"
            >
              💬 Escribinos por WhatsApp
            </a>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
          <button
            onClick={onConfirm}
            className="btn btn-primary w-full justify-center min-w-0 sm:w-auto sm:min-w-[140px] sm:flex-1"
          >
            Confirmar Inscripción
          </button>
          {activity.ubicacionOnline && (
            <a
              href={activity.ubicacionOnline}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full justify-center text-center sm:w-auto sm:whitespace-nowrap"
              title="Ver ubicación en Google Maps"
            >
              🗺️ ¿Cómo llego?
            </a>
          )}
          <button
            onClick={onAddToCalendar}
            className="btn btn-secondary w-full justify-center sm:w-auto"
            title="Agregar al calendario"
          >
            📅 Agregar al Calendario
          </button>
          <button onClick={onClose} className="btn btn-outline w-full justify-center sm:w-auto">
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InscriptionConfirmModal;
