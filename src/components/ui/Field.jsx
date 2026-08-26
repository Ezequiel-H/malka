import { createContext, useContext, useId } from 'react';
import Icon from './Icon';
import cn from './cn';

const FieldContext = createContext(null);

/**
 * Lo que un control (Input, Select, Textarea...) necesita saber del campo que
 * lo contiene. Devuelve valores neutros si el control se usa suelto, para que
 * `<Input />` sin `<Field>` alrededor siga funcionando.
 */
export const useField = () => useContext(FieldContext) ?? {
  id: undefined,
  describedBy: undefined,
  invalid: false,
  required: false,
};

/**
 * Envoltorio de campo: label, hint, error y el cableado de accesibilidad.
 *
 * El objetivo es que ningún formulario tenga que acordarse de conectar
 * `htmlFor`/`id`, `aria-describedby` ni `aria-invalid` a mano — hoy eso está
 * suelto en cada pantalla y en varias falta.
 *
 *   <Field label="Email" error={errors.email} required>
 *     <Input type="email" value={email} onChange={...} />
 *   </Field>
 */
const Field = ({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className,
  labelClassName,
  children,
}) => {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;

  // El error se anuncia después del hint para que el lector de pantalla lea
  // primero la instrucción y después el problema.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('mb-5', className)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'mb-2 block text-sm font-medium text-ink-soft',
              // El asterisco va por CSS y no como nodo del DOM: si fuera un
              // <span>, entraría en el textContent del label y el nombre
              // accesible del campo pasaría a ser "Nombre*". Eso rompe tanto a
              // los lectores de pantalla como a getByLabelText en los tests.
              // La obligatoriedad ya la comunica `required`/aria-required.
              required && "after:ml-0.5 after:text-danger-500 after:content-['*']",
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {children}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-ink-muted">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger-600"
          >
            <Icon name="error" size="xs" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
};

export default Field;
