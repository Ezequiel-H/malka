import cn from './cn';

/**
 * Tabla del sistema.
 *
 * `columns`: [{ key, header, align?, width?, render?(row, index) }]
 *
 * El scroll horizontal vive en un contenedor propio con `tabIndex=0` para que
 * también se pueda desplazar con el teclado — una tabla ancha que sólo
 * scrollea con el mouse deja afuera a parte de la gente.
 *
 * Para pantallas chicas conviene `stacked`, que convierte cada fila en una
 * tarjeta con etiquetas: una tabla de 8 columnas en un teléfono es ilegible.
 */
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

const Table = ({
  columns = [],
  rows = [],
  rowKey = (row, i) => row.id ?? row._id ?? i,
  onRowClick,
  empty,
  stacked = false,
  className,
}) => {
  if (!rows.length && empty) return empty;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Tabla de datos"
      className={cn(
        'overflow-x-auto rounded-card border border-surface-border bg-surface',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted',
                  ALIGN[col.align ?? 'left']
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              /* Una fila clickeable tiene que poder operarse con teclado:
                 entra al tab order y responde a Enter/Espacio como un botón.
                 Sin esto, la navegación por filas era sólo para el mouse. */
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row, index);
                      }
                    }
                  : undefined
              }
              className={cn(
                'border-b border-surface-border last:border-0',
                'transition-colors duration-fast motion-reduce:transition-none',
                onRowClick &&
                  'cursor-pointer hover:bg-primary-50/60 focus-visible:bg-primary-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                stacked && 'block border-b-8 border-surface-page sm:table-row sm:border-b'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  // data-label alimenta la etiqueta que se ve en modo apilado.
                  data-label={typeof col.header === 'string' ? col.header : undefined}
                  className={cn(
                    'px-4 py-3 text-ink',
                    ALIGN[col.align ?? 'left'],
                    stacked &&
                      'flex items-baseline justify-between gap-3 before:text-xs before:font-semibold before:uppercase before:text-ink-muted before:content-[attr(data-label)] sm:table-cell sm:before:content-none'
                  )}
                >
                  {col.render ? col.render(row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
