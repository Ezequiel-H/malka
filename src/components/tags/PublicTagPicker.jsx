import { catalogTagByName, publicTagColor } from '../../utils/tagFields';

/**
 * Selector múltiple de tags públicos por nombre (catálogo GET /tags).
 */
const PublicTagPicker = ({
  availableTags,
  selectedNames,
  onChange,
  emptyHint,
  disabled = false
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

  return (
    <div className="form-group">
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => {
          const isSelected = selectedNames.some(
            t => String(t).trim().toLowerCase() === String(tag.nombre).trim().toLowerCase()
          );
          const tagColor = publicTagColor(availableTags, tag.nombre);
          return (
            <button
              key={tag._id}
              type="button"
              onClick={() => toggleTag(tag.nombre)}
              disabled={disabled}
              className={`badge border transition-all ${
                isSelected
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              style={isSelected ? { backgroundColor: tagColor } : undefined}
              title={tag.descripcion || tag.nombre}
            >
              {tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1)}
            </button>
          );
        })}
      </div>
      {availableTags.length === 0 && emptyHint}
    </div>
  );
};

export default PublicTagPicker;
