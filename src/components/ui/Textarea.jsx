import { forwardRef } from 'react';
import { useField } from './Field';
import { controlBase, controlBorder, controlSizes } from './Input';
import cn from './cn';

/**
 * Textarea del sistema. Mismo lenguaje visual que Input.
 *
 * Dos cosas deliberadas acá:
 *
 * 1. La transición hereda `transition-control` de controlBase, que NO incluye
 *    height. Con `transition-all`, arrastrar el handle de resize dispara una
 *    animación por cada pixel y el arrastre se siente pegajoso.
 *
 * 2. El contador va DEBAJO del campo, no flotando encima. Superpuesto, el
 *    texto le pasa por abajo al scrollear y se lee como un glitch.
 */
const Textarea = forwardRef(
  (
    {
      size = 'md',
      rows = 4,
      invalid: invalidProp,
      maxLength,
      value,
      className,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const field = useField();
    const invalid = invalidProp ?? field.invalid;
    const id = idProp ?? field.id;

    const used = typeof value === 'string' ? value.length : 0;
    const nearLimit = maxLength && used >= maxLength * 0.9;

    return (
      <>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          aria-invalid={invalid || undefined}
          aria-describedby={field.describedBy}
          aria-required={field.required || undefined}
          className={cn(
            controlBase,
            controlSizes[size],
            controlBorder(invalid),
            'block min-h-[100px] resize-y',
            className
          )}
          {...props}
        />

        {maxLength && (
          <div
            className={cn(
              'mt-1 text-end text-xs tabular-nums',
              nearLimit ? 'font-medium text-warning-600' : 'text-ink-faint'
            )}
          >
            {/* aria-live: avisa que se está por llegar al límite, pero recién
                cerca del final para no cantar cada tecla. */}
            <span aria-live={nearLimit ? 'polite' : 'off'}>
              {used}/{maxLength}
            </span>
          </div>
        )}
      </>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
