// Clases completas para que Tailwind no las purgue (no usar interpolación dinámica).
const MAX_WIDTHS = {
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

/**
 * Layout estándar de página: fondo, márgenes verticales, padding horizontal,
 * ancho máximo centrado y (opcionalmente) el título tipografiado.
 *
 * - `title`: si se pasa, renderiza el <h1> con la tipografía estándar.
 * - `actions`: contenido alineado a la derecha del título (botones, etc.).
 * - `maxWidth`: ancho máximo del contenedor interno (por defecto '7xl').
 * - `className`: clases extra para el contenedor interno.
 */
const PageContainer = ({ title, actions, maxWidth = '7xl', className = '', children }) => {
  const maxWidthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS['7xl'];

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className={`${maxWidthClass} mx-auto min-w-0 ${className}`.trim()}>
        {title != null && (
          actions ? (
            <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="min-w-0 text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{title}</h1>
              {actions}
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-primary">
              {title}
            </h1>
          )
        )}
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
