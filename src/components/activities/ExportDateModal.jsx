import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import { Card, EmptyState, Modal, Spinner } from '../ui';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Modal para elegir la fecha de una actividad recurrente a exportar a Excel.
 */
const ExportDateModal = ({ activity, dates, loading, onClose, onSelect }) => {
  if (!activity) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Exportar Excel — ${activity.titulo}`}
      description="Últimas 3 y próximas 3 fechas con inscripciones."
    >
      {loading ? (
        <div className="flex flex-col items-center py-8">
          <Spinner size="lg" label="Cargando fechas" />
          <p className="mt-4 text-ink-muted">Cargando fechas...</p>
        </div>
      ) : dates.length === 0 ? (
        <EmptyState
          icon="activity"
          title="Sin fechas para exportar"
          description="No hay fechas recientes con inscripciones."
        />
      ) : (
        <div className="space-y-2">
          {dates.map((dateOption) => (
            <Card
              key={dateOption.fechaStr}
              as="button"
              type="button"
              interactive
              padding="sm"
              onClick={() => onSelect(dateOption.fechaStr)}
              className="w-full text-left"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-ink">
                  {formatUtcCalendarDateEsAR(`${dateOption.fechaStr}T00:00:00.000Z`, LONG_DATE_OPTS)}
                </p>
                <p className="text-sm text-ink-muted">
                  {dateOption.count} {dateOption.count === 1 ? 'inscripción' : 'inscripciones'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ExportDateModal;
