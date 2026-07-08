import { useEffect } from 'react';

/**
 * Shell de modal centrado: overlay oscuro, cierre opcional con click afuera y
 * con la tecla Escape.
 *
 * - Si se pasa `title`, renderiza el header estándar (título + botón cerrar) y
 *   envuelve el contenido con padding (`p-4 sm:p-6`). Ideal para diálogos simples.
 * - Para layouts a medida (header propio, secciones con scroll interno), omitir
 *   `title` y componer todo como children; en ese caso la caja usa `flex flex-col`
 *   y el consumidor maneja padding y scroll.
 */
const Modal = ({
  onClose,
  title,
  titleClassName = 'text-xl font-bold text-gray-800 sm:text-2xl',
  maxWidth = 'max-w-2xl',
  className = '',
  closeOnBackdrop = true,
  closeOnEsc = true,
  children,
}) => {
  useEffect(() => {
    if (!closeOnEsc) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOnEsc, onClose]);

  const hasHeader = title != null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-lg w-full ${maxWidth} max-h-[90vh] min-w-0 ${
          hasHeader ? 'overflow-y-auto' : 'flex flex-col'
        } ${className}`}
      >
        {hasHeader ? (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className={`min-w-0 flex-1 ${titleClassName}`}>{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 text-2xl text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Modal;
