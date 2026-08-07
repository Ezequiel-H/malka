import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import Modal from '../layout/Modal';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Modal para elegir la fecha de una actividad recurrente a exportar a Excel.
 */
const ExportDateModal = ({ activity, dates, loading, onClose, onSelect }) => {
  if (!activity) return null;

  return (
    <Modal
      onClose={onClose}
      titleClassName="text-lg font-bold leading-snug text-gray-800 sm:text-xl"
      title={
        <>
          <span className="block sm:inline">Exportar Excel — </span>
          <span className="break-words">{activity.titulo}</span>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-600">
        Últimas 3 y próximas 3 fechas con inscripciones.
      </p>

      {loading ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando fechas...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay fechas recientes con inscripciones para exportar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map((dateOption) => (
            <button
              key={dateOption.fechaStr}
              type="button"
              onClick={() => onSelect(dateOption.fechaStr)}
              className="w-full rounded-lg border-2 border-gray-300 bg-white p-4 text-left transition-colors hover:border-primary hover:bg-gray-50"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-gray-800">
                  {formatUtcCalendarDateEsAR(`${dateOption.fechaStr}T00:00:00.000Z`, LONG_DATE_OPTS)}
                </p>
                <p className="text-sm text-gray-600">
                  {dateOption.count} {dateOption.count === 1 ? 'inscripción' : 'inscripciones'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ExportDateModal;
