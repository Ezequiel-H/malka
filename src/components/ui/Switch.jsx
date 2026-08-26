import { forwardRef, useId } from 'react';
import cn from './cn';

/**
 * Switch (toggle).
 *
 * Cuándo usar Switch y cuándo Checkbox: el switch aplica el cambio al
 * instante ("actividad publicada"), el checkbox espera a que se envíe el
 * formulario ("acepto los términos"). Si el usuario tiene que apretar Guardar
 * después, va checkbox.
 */
const Switch = forwardRef(
  ({ label, description, disabled = false, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <label
        htmlFor={id}
        className={cn(
          'group flex items-start gap-3',
          disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
          className
        )}
      >
        {/* role="switch" hace que se anuncie como "activado/desactivado" en
            vez de "casilla marcada". */}
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />

        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-pill border-2 border-transparent bg-surface-border p-0.5',
            'transition-colors duration-base ease-standard motion-reduce:transition-none',
            'peer-checked:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1',
            'peer-checked:[&>span]:translate-x-4'
          )}
        >
          <span className="h-4 w-4 rounded-pill bg-white shadow-subtle transition-transform duration-base ease-spring motion-reduce:transition-none" />
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

Switch.displayName = 'Switch';

export default Switch;
