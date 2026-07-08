import { formatUtcCalendarDateEsAR } from '../../utils/dateUtils';
import InscriptionStatusBadge from './InscriptionStatusBadge';
import Modal from '../layout/Modal';

const LONG_DATE_OPTS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const cardBorderClass = (dateOption) => {
  switch (dateOption.estadoInscripcion) {
    case 'aceptada':
      return 'border-green-500 bg-green-50';
    case 'pendiente':
      return 'border-yellow-500 bg-yellow-50';
    case 'en_espera':
      return 'border-blue-500 bg-blue-50';
    default:
      return dateOption.tieneCupo ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100 opacity-50';
  }
};

/**
 * Modal para elegir una fecha de una actividad recurrente.
 * El reseteo de estado al cerrar lo decide la página vía `onClose`.
 */
const DateSelectionModal = ({ activity, availableDates, loading, onClose, onSelect }) => {
  if (!activity) return null;

  return (
    <Modal
      onClose={onClose}
      titleClassName="text-lg font-bold leading-snug text-gray-800 sm:text-xl md:text-2xl"
      title={
        <>
          <span className="block sm:inline">Selecciona una fecha — </span>
          <span className="break-words">{activity.titulo}</span>
        </>
      }
    >
      {loading ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando fechas disponibles...</p>
        </div>
      ) : availableDates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No hay fechas disponibles en los próximos 30 días.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {availableDates.map((dateOption, index) => {
            const isInscribed = !!dateOption.estadoInscripcion;
            return (
              <div key={index} className={`w-full p-4 rounded-lg border-2 ${cardBorderClass(dateOption)}`}>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 font-semibold text-gray-800">
                      {formatUtcCalendarDateEsAR(dateOption.fecha, LONG_DATE_OPTS)}
                    </p>
                    {dateOption.hora && (
                      <p className="mb-2 text-sm text-gray-600">Hora: {dateOption.hora}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 text-left sm:ml-4 sm:items-end sm:text-right">
                    {dateOption.cuposDisponibles !== null ? (
                      <p className={`text-sm font-semibold ${
                        dateOption.cuposDisponibles > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dateOption.cuposDisponibles > 0
                          ? `${dateOption.cuposDisponibles} cupos disponibles`
                          : 'Sin cupo'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">Sin límite de cupo</p>
                    )}
                    <InscriptionStatusBadge estado={dateOption.estadoInscripcion} />
                  </div>
                </div>

                {isInscribed ? (
                  <button disabled className="btn btn-primary w-full opacity-50 cursor-not-allowed">
                    Inscripción Realizada
                  </button>
                ) : dateOption.tieneCupo ? (
                  <button onClick={() => onSelect(dateOption)} className="btn btn-primary w-full">
                    Inscribirse
                  </button>
                ) : (
                  <p className="text-sm text-red-600 font-semibold">Sin cupo disponible</p>
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
