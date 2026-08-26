import { forwardRef, useId } from 'react';
import cn from './cn';

/**
 * Radio suelto. Para un conjunto conviene RadioGroup, que se encarga del
 * `name` compartido y del rol de grupo.
 */
export const Radio = forwardRef(
  ({ label, description, disabled = false, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <label
        htmlFor={id}
        className={cn(
          'group flex items-start gap-2.5',
          disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
          className
        )}
      >
        <input ref={ref} id={id} type="radio" disabled={disabled} className="peer sr-only" {...props} />

        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-pill border-2 border-surface-border bg-surface',
            'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
            'peer-checked:border-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1',
            'peer-checked:[&>span]:scale-100',
            !disabled && 'group-hover:border-primary-300'
          )}
        >
          <span className="h-2 w-2 scale-0 rounded-pill bg-primary transition-transform duration-fast ease-spring motion-reduce:transition-none" />
        </span>

        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block text-sm font-medium text-ink">{label}</span>}
            {description && <span className="block text-xs text-ink-muted">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * Grupo de radios.
 *
 * `role="radiogroup"` + `aria-labelledby` es lo que hace que un lector de
 * pantalla anuncie "Tipo de actividad, 1 de 3" en vez de leer tres opciones
 * sueltas sin contexto.
 *
 *   <RadioGroup label="Tipo" name="tipo" value={tipo} onChange={setTipo}
 *     options={[{ value: 'unica', label: 'Única' }, ...]} />
 */
export const RadioGroup = ({
  label,
  name,
  value,
  onChange,
  options = [],
  direction = 'vertical',
  className,
}) => {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? `${groupId}-label` : undefined}
      className={className}
    >
      {label && (
        <span id={`${groupId}-label`} className="mb-2 block text-sm font-medium text-ink-soft">
          {label}
        </span>
      )}

      <div className={cn('flex gap-3', direction === 'vertical' ? 'flex-col' : 'flex-wrap')}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
          />
        ))}
      </div>
    </div>
  );
};

export default Radio;
