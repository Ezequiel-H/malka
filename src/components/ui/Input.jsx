import { forwardRef, useState } from 'react';
import Icon from './Icon';
import { useField } from './Field';
import cn from './cn';

/* Compartido con Textarea y Select para que los tres campos se vean idénticos. */
export const controlBase = cn(
  'w-full rounded-control border bg-surface text-ink',
  'placeholder:text-ink-faint',
  'transition-control duration-fast ease-standard',
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
  'disabled:cursor-not-allowed disabled:bg-ink/[0.04] disabled:text-ink-faint',
  'motion-reduce:transition-none'
);

export const controlSizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-base min-h-[44px] sm:min-h-[42px]',
  lg: 'px-5 py-3 text-base min-h-[48px]',
};

export const controlBorder = (invalid) =>
  invalid
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
    : 'border-surface-border';

/**
 * Input de texto del sistema. Cubre todos los `type` textuales
 * (text, email, password, number, tel, url, date, time, search).
 *
 * Los tipos que NO son texto tienen su propio componente porque su
 * comportamiento y su dibujo no se parecen en nada: Checkbox, Radio, Switch,
 * ColorInput y FileInput.
 *
 * Extras sobre el <input> nativo:
 * - `icon` / `suffix` para adornos internos sin romper el padding
 * - `type="password"` trae botón de mostrar/ocultar
 * - toma id, aria-describedby y aria-invalid del <Field> que lo contiene
 */
const Input = forwardRef(
  (
    {
      type = 'text',
      size = 'md',
      icon,
      suffix,
      invalid: invalidProp,
      className,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const field = useField();
    const [revealed, setRevealed] = useState(false);

    const invalid = invalidProp ?? field.invalid;
    const id = idProp ?? field.id;

    const isPassword = type === 'password';
    const resolvedType = isPassword && revealed ? 'text' : type;

    /* El botón del password ocupa el mismo lugar que un suffix, así que se
       excluyen entre sí. */
    const hasSuffix = Boolean(suffix) || isPassword;

    const input = (
      <input
        ref={ref}
        id={id}
        type={resolvedType}
        aria-invalid={invalid || undefined}
        aria-describedby={field.describedBy}
        aria-required={field.required || undefined}
        className={cn(
          controlBase,
          controlSizes[size],
          controlBorder(invalid),
          icon && 'pl-10',
          hasSuffix && 'pr-11',
          className
        )}
        {...props}
      />
    );

    if (!icon && !hasSuffix) return input;

    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-faint">
            <Icon name={icon} size="sm" />
          </span>
        )}

        {input}

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            /* tabIndex -1: al tabular por el formulario el foco va al próximo
               campo, no a este botón auxiliar. Sigue siendo clickeable. */
            tabIndex={-1}
            aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-control px-3 text-ink-faint transition-colors duration-fast hover:text-ink-soft"
          >
            <Icon name={revealed ? 'hide' : 'view'} size="sm" />
          </button>
        ) : (
          suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-ink-muted">
              {suffix}
            </span>
          )
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
