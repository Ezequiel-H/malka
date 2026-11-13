import { Badge, Button, Field, Icon, Select } from '../ui';

/**
 * Asignador de tags: un Select con el catálogo disponible, un botón para
 * sumar, y los ya asignados como chips con su color.
 *
 * Vive acá porque el mismo bloque aparecía cuatro veces —tags públicos y
 * privados, en la ficha de usuario y en el formulario de actividad— idéntico
 * salvo textos y color por defecto.
 */
const TagAssigner = ({
  label,
  placeholder,
  emptyMessage,
  catalog,
  assigned,
  value,
  onValueChange,
  onAdd,
  onRemove,
  defaultColor,
  emptyHint,
}) => {
  const options = catalog
    .filter((tag) => !assigned.some((t) => t.toLowerCase() === tag.nombre.toLowerCase()))
    .map((tag) => ({
      value: tag.nombre,
      label: tag.nombre.charAt(0).toUpperCase() + tag.nombre.slice(1),
      description: tag.descripcion || undefined,
      icon: tag.icono || 'tag',
    }));

  return (
    <Field label={label}>
      <div className="mb-3 flex gap-3">
        <Select
          options={options}
          value={value}
          onChange={(next) => onValueChange(next ?? '')}
          placeholder={placeholder}
          emptyMessage={emptyMessage}
          searchable={options.length > 8}
          className="flex-1"
        />
        <Button type="button" variant="secondary" icon="add" onClick={onAdd} disabled={!value}>
          Agregar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {assigned.map((nombre) => {
          const tag = catalog.find((t) => t.nombre.toLowerCase() === nombre.toLowerCase());
          return (
            <Badge
              key={nombre}
              solid
              icon={tag?.icono || undefined}
              className="gap-1.5 pr-1.5"
              style={{ backgroundColor: tag?.color || defaultColor }}
            >
              {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
              <button
                type="button"
                onClick={() => onRemove(nombre)}
                aria-label={`Quitar ${nombre}`}
                className="rounded-pill p-0.5 text-white/80 transition-control duration-fast hover:bg-white/20 hover:text-white"
              >
                <Icon name="close" size="xs" strokeWidth={2.5} />
              </button>
            </Badge>
          );
        })}
      </div>

      {catalog.length === 0 && emptyHint}
    </Field>
  );
};


export default TagAssigner;
