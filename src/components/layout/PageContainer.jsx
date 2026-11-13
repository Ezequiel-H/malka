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
 * Layout estándar de página.
 *
 * El título es una barra compacta —tinta, tamaño contenido, acciones a la
 * derecha en la misma fila— y no un cartel: la sección ya la anuncia el ítem
 * activo del sidebar, así que el h1 confirma dónde estás sin gritarlo. En
 * desktop la barra queda pegajosa al scrollear, para que las acciones de la
 * pantalla no se pierdan al bajar.
 *
 * - `title`: si se pasa, renderiza la barra con el <h1>.
 * - `back`: botón/vínculo de vuelta, a la izquierda del título.
 * - `actions`: contenido alineado a la derecha del título (botones, etc.).
 * - `maxWidth`: ancho máximo del contenedor interno (por defecto '7xl').
 * - `className`: clases extra para el contenedor interno.
 */
const PageContainer = ({ title, back, actions, maxWidth = '7xl', className = '', children }) => {
  const maxWidthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS['7xl'];

  return (
    <div className="min-h-screen bg-surface-page pb-8 sm:pb-12">
      {title != null && (
        <header className="border-b border-surface-border/70 bg-surface-page/85 backdrop-blur-md lg:sticky lg:top-0 lg:z-30">
          {/* La barra usa siempre el ancho completo aunque el contenido sea
              angosto (Ajustes, perfiles): así el título queda en la misma X
              en todas las pantallas y el ojo no lo busca. */}
          <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {back}
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-ink">
                {title}
              </h1>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </header>
      )}

      <div
        className={`${maxWidthClass} mx-auto min-w-0 px-4 sm:px-6 ${
          title != null ? 'pt-6' : 'pt-8 sm:pt-12'
        } ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
