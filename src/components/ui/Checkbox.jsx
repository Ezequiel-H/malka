import { forwardRef, useId } from 'react';
import Icon from './Icon';
import cn from './cn';

/**
 * Checkbox del sistema.
 *
 * El <input> nativo sigue ahí pero invisible (`sr-only`), y el dibujo lo hace
 * un <span>. Es la técnica correcta: se pinta lo que se quiera sin perder
 * teclado, foco, formularios ni lectores de pantalla.
 *
 * Soporta estado indeterminado para "seleccionar todos" en las tablas.
 */
const Checkbox = forwardRef(
  (
    { label, description, indeterminate = false, disabled = false, className, id: idProp, ...props },
    ref
  ) => {
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
        <input
          ref={(node) => {
            // indeterminate no existe como atributo HTML, sólo como propiedad
            // del nodo — hay que setearlo por JS.
            if (node) node.indeterminate = indeterminate;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />

        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[0.35rem] border-2 border-surface-border bg-surface text-white',
            'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
            'peer-checked:border-primary peer-checked:bg-primary',
            'peer-indeterminate:border-primary peer-indeterminate:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-1',
            // El tilde vive DENTRO de este span, así que no es hermano del
            // input: `peer-checked:` no lo alcanza y hay que apuntarlo con un
            // selector de descendiente.
            'peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100',
            !disabled && 'group-hover:border-primary-300 peer-checked:group-hover:border-primary-600'
          )}
        >
          {indeterminate ? (
            <Icon name="remove" size="xs" strokeWidth={3} />
          ) : (
            <Icon
              name="check"
              size="xs"
              strokeWidth={3}
              className="scale-0 opacity-0 transition-chrome duration-fast ease-spring motion-reduce:transition-none"
            />
          )}
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
