import { useState } from 'react';
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
  const [selectValue, setSelectValue] = useState('');

  const addTag = (nombre) => {
    if (!nombre || disabled) return;
    const lower = String(nombre).trim().toLowerCase();
    if (!lower) return;
    if (selectedNames.some(t => String(t).trim().toLowerCase() === lower)) return;
    const fromCat = catalogTagByName(availableTags, nombre);
    onChange([...selectedNames, fromCat ? fromCat.nombre : nombre.trim()]);
    setSelectValue('');
  };

  const removeTag = (nombre) => {
    if (disabled) return;
    onChange(selectedNames.filter(t => t !== nombre));
  };

  return (
    <div className="form-group">
      <div className="flex gap-3 mb-3">
        <select
          value={selectValue}
          onChange={(e) => setSelectValue(e.target.value)}
          className="flex-1 bg-white"
          disabled={disabled}
        >
          <option value="">Seleccionar tag</option>
          {availableTags.length > 0 ? (
            availableTags
              .filter(
              tag =>
                !selectedNames.some(
                  t => String(t).trim().toLowerCase() === String(tag.nombre).trim().toLowerCase()
                )
            )
              .map(tag => (
                <option key={tag._id} value={tag.nombre}>
                  {tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1)}
                  {tag.descripcion && ` — ${tag.descripcion}`}
                </option>
              ))
          ) : (
            <option value="" disabled>No hay tags disponibles</option>
          )}
        </select>
        <button
          type="button"
          onClick={() => addTag(selectValue)}
          className="btn btn-secondary"
          disabled={!selectValue || disabled}
        >
          Agregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedNames.map(tagNombre => {
          const tagColor = publicTagColor(availableTags, tagNombre);
          return (
            <span
              key={tagNombre}
              className="badge flex items-center gap-2 text-white"
              style={{ backgroundColor: tagColor }}
            >
              {tagNombre.charAt(0).toUpperCase() + tagNombre.slice(1)}
              <button
                type="button"
                onClick={() => removeTag(tagNombre)}
                className="bg-transparent border-none text-white cursor-pointer hover:text-gray-200 font-bold"
                disabled={disabled}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      {availableTags.length === 0 && emptyHint}
    </div>
  );
};

export default PublicTagPicker;
