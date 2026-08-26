/**
 * Descripción de una actividad.
 * - variant "card": párrafo recortado a 3 líneas, sin título.
 * - variant "detail": bloque con título "Descripción" (solo si hay texto).
 */
const ActivityDescription = ({ activity, variant = 'detail' }) => {
  if (variant === 'card') {
    return (
      <p className="mb-4 line-clamp-3 whitespace-pre-wrap text-ink-muted">
        {activity?.descripcion}
      </p>
    );
  }

  if (!activity?.descripcion) return null;

  /* Sin heading "Descripción": debajo del título, el párrafo se explica solo. */
  return (
    <p className="mb-6 whitespace-pre-wrap leading-relaxed text-ink-soft">
      {activity.descripcion}
    </p>
  );
};

export default ActivityDescription;
