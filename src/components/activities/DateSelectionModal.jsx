import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import InscriptionStatusBadge from './InscriptionStatusBadge';
import { Button, EmptyState, Modal, Spinner, cn } from '../ui';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/* El borde comunica el estado de un vistazo, antes de leer el badge. */
const cardBorderClass = (dateOption) => {
  switch (dateOption.estadoInscripcion) {
    case 'aceptada':
      return 'border-success-500 bg-success-50';
    case 'pendiente':
      return 'border-warning-500 bg-warning-50';
    case 'en_espera':
      return 'border-info-500 bg-info-50';
    default:
      return dateOption.tieneCupo
        ? 'border-surface-border bg-surface'
        : 'border-surface-border bg-surface opacity-50';
  }
};

/**
 * Modal para elegir una fecha de una actividad recurrente.
 * El reseteo de estado al cerrar lo decide la página vía `onClose`.
 */
const DateSelectionModal = ({ activity, availableDates, loading, onClose, onSelect }) => {
  if (!activity) return null;

  return (
    <Modal open onClose={onClose} title={`Elegí una fecha — ${activity.titulo}`}>
      {loading ? (
        <div className="flex flex-col items-center py-8">
          <Spinner size="lg" label="Cargando fechas disponibles" />
          <p className="mt-4 text-ink-muted">Cargando fechas disponibles...</p>
        </div>
      ) : availableDates.length === 0 ? (
        <EmptyState
          icon="activity"
          title="Sin fechas disponibles"
          description="No hay fechas en los próximos 30 días."
        />
      ) : (
        <div className="space-y-2">
          {availableDates.map((dateOption, index) => {
            const isInscribed = !!dateOption.estadoInscripcion;

            return (
              <div
                key={index}
                className={cn('w-full rounded-card border-2 p-4', cardBorderClass(dateOption))}
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 font-semibold text-ink">
                      {formatUtcCalendarDateEsAR(dateOption.fecha, LONG_DATE_OPTS)}
                    </p>
                    {dateOption.hora && (
                      <p className="mb-2 text-sm text-ink-muted">Hora: {dateOption.hora}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 text-left sm:ml-4 sm:items-end sm:text-right">
                    {dateOption.cuposDisponibles !== null ? (
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          dateOption.cuposDisponibles > 0 ? 'text-success-600' : 'text-danger-600'
                        )}
                      >
                        {dateOption.cuposDisponibles > 0
                          ? `${dateOption.cuposDisponibles} cupos disponibles`
                          : 'Sin cupo'}
                      </p>
                    ) : (
                      <p className="text-sm text-ink-muted">Sin límite de cupo</p>
                    )}
                    <InscriptionStatusBadge estado={dateOption.estadoInscripcion} />
                  </div>
                </div>

                {isInscribed ? (
                  <Button disabled fullWidth icon="check">
                    Inscripción realizada
                  </Button>
                ) : dateOption.tieneCupo ? (
                  <Button fullWidth icon="check" onClick={() => onSelect(dateOption)}>
                    Inscribirse
                  </Button>
                ) : (
                  <p className="text-sm font-semibold text-danger-600">Sin cupo disponible</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default DateSelectionModal;
