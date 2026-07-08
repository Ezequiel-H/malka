/**
 * Descripción de una actividad.
 * - variant "card": párrafo recortado a 3 líneas, sin título.
 * - variant "detail": bloque con título "Descripción" (solo si hay texto).
 */
const ActivityDescription = ({ activity, variant = 'detail' }) => {
  if (variant === 'card') {
    return (
      <p className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-wrap">
        {activity?.descripcion}
      </p>
    );
  }

  if (!activity?.descripcion) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Descripción</h2>
      <p className="text-gray-600 whitespace-pre-wrap">{activity.descripcion}</p>
    </div>
  );
};

export default ActivityDescription;
