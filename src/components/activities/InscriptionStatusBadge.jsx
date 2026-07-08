const BADGES = {
  aceptada: {
    className: 'bg-green-100 text-green-800 border-green-300',
    text: '✓ Inscripción Confirmada',
  },
  pendiente: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    text: '⏳ Pendiente de Confirmación',
  },
  en_espera: {
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    text: '⏰ En Lista de Espera',
  },
};

/** Píldora con el estado de una inscripción (confirmada / pendiente / en espera). */
const InscriptionStatusBadge = ({ estado }) => {
  const badge = BADGES[estado];
  if (!badge) return null;

  return (
    <span
      className={`inline-flex w-fit min-h-[2.5rem] items-center justify-center text-center px-4 rounded-full text-sm font-semibold border ${badge.className}`}
    >
      {badge.text}
    </span>
  );
};

export default InscriptionStatusBadge;
