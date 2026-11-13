import { catalogTagByName, publicTagColor, publicTagIcon } from '../../utils/tagFields';
import { Icon, cn } from '../../components/ui';

/**
 * Selector múltiple de tags públicos por nombre (catálogo GET /tags).
 *
 * - variant "chip": pastillas compactas, para formularios (registro).
 * - variant "tile": grilla de tarjetas con el icono protagonista, para
 *   pantallas donde el picker ES el contenido (Mis intereses).
 *
 * Los botones llevan `aria-pressed` porque son de dos estados: sin eso un
 * lector de pantalla los anuncia como botones comunes y no hay forma de
 * saber cuáles están elegidos.
 *
 * El color de fondo sale del dato de cada tag, así que va inline: es el único
 * caso legítimo de color fuera de los tokens, porque lo define el admin.
 */
const PublicTagPicker = ({
  availableTags,
  selectedNames,
  onChange,
  emptyHint,
  disabled = false,
  variant = 'chip'
}) => {
  const toggleTag = (nombre) => {
    if (!nombre || disabled) return;
    const lower = String(nombre).trim().toLowerCase();
    if (!lower) return;
    const alreadySelected = selectedNames.some(t => String(t).trim().toLowerCase() === lower);

    if (alreadySelected) {
      onChange(selectedNames.filter(t => String(t).trim().toLowerCase() !== lower));
      return;
    }

    const fromCat = catalogTagByName(availableTags, nombre);
    onChange([...selectedNames, fromCat ? fromCat.nombre : nombre.trim()]);
  };

  const isTile = variant === 'tile';

  return (
    <div>
      <div
        className={
          isTile
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
            : 'flex flex-wrap gap-2'
        }
      >
        {availableTags.map(tag => {
          const isSelected = selectedNames.some(
            t => String(t).trim().toLowerCase() === String(tag.nombre).trim().toLowerCase()
          );
          const tagColor = publicTagColor(availableTags, tag.nombre);
          const tagIcon = publicTagIcon(availableTags, tag.nombre);
          const label = tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1);

          if (isTile) {
            return (
              <button
                key={tag._id}
                type="button"
                onClick={() => toggleTag(tag.nombre)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-card border p-4',
                  'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-55',
                  isSelected
                    ? 'border-transparent text-white shadow-subtle'
                    : 'border-surface-border bg-surface text-ink-soft hover:border-primary-300 hover:bg-primary-50',
                  !disabled && 'active:scale-[0.97]'
                )}
                style={isSelected ? { backgroundColor: tagColor } : undefined}
                title={tag.descripcion || tag.nombre}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isSelected ? 'bg-white/20' : ''
                  )}
                  style={isSelected ? undefined : { backgroundColor: `${tagColor}1A`, color: tagColor }}
                >
                  <Icon name={tagIcon || 'tag'} size="md" />
                </span>
                <span className="text-sm font-semibold">{label}</span>
              </button>
            );
          }

          return (
            <button
              key={tag._id}
              type="button"
              onClick={() => toggleTag(tag.nombre)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={cn(
                'inline-flex items-center rounded-pill border px-3 py-1 text-xs font-semibold',
                'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-55',
                isSelected
                  ? 'border-transparent text-white shadow-subtle'
                  : 'border-surface-border bg-surface text-ink-soft hover:border-primary-300 hover:bg-primary-50',
                !disabled && 'active:scale-95'
              )}
              style={isSelected ? { backgroundColor: tagColor } : undefined}
              title={tag.descripcion || tag.nombre}
            >
              {tagIcon && <Icon name={tagIcon} size="xs" className="me-1" />}
              {label}
            </button>
          );
        })}
      </div>
      {availableTags.length === 0 && emptyHint}
    </div>
  );
};

export default PublicTagPicker;
