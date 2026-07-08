/**
 * Mensaje de "no hay resultados" centrado. Por defecto lo envuelve en un `card`;
 * usar `card={false}` cuando ya está dentro de un contenedor.
 */
const EmptyState = ({ message, children, card = true }) => {
  const content = (
    <p className="text-gray-600 text-center py-4">{children ?? message}</p>
  );

  return card ? <div className="card">{content}</div> : content;
};

export default EmptyState;
