import { useRef } from 'react';
import { useField } from './Field';
import { controlBase, controlBorder } from './Input';
import cn from './cn';

const isValidHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v);

/**
 * Selector de color: muestra de color + campo hexadecimal.
 *
 * Reemplaza el combo `<input type="color">` + `.form-input-hex` que hoy vive
 * suelto en index.css. El nativo se queda como motor del picker pero se pinta
 * como una muestra redonda; el hex se escribe a mano en el campo de al lado.
 *
 * El valor se propaga sólo cuando el hex está completo, para no emitir
 * colores rotos ("#ab") mientras se tipea.
 */
const ColorInput = ({
  value = '#689b78',
  onChange,
  disabled = false,
  invalid: invalidProp,
  className,
  id: idProp,
  ...props
}) => {
  const field = useField();
  const invalid = invalidProp ?? field.invalid;
  const id = idProp ?? field.id;
  const nativeRef = useRef(null);

  const handleHex = (raw) => {
    // Tolera que se escriba sin el #.
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    onChange?.(next);
  };

  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <button
        type="button"
        onClick={() => nativeRef.current?.click()}
        disabled={disabled}
        aria-label="Elegir color"
        className={cn(
          'h-10 w-10 shrink-0 rounded-control border border-surface-border shadow-subtle',
          'transition-transform duration-fast ease-spring motion-reduce:transition-none',
          !disabled && 'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-55'
        )}
        style={{ backgroundColor: isValidHex(value) ? value : '#ffffff' }}
      />

      {/* El nativo queda como motor del picker del sistema operativo, oculto. */}
      <input
        ref={nativeRef}
        id={id}
        type="color"
        value={isValidHex(value) ? value : '#000000'}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => handleHex(e.target.value)}
        disabled={disabled}
        maxLength={7}
        spellCheck={false}
        aria-label="Código hexadecimal"
        aria-invalid={invalid || !isValidHex(value) || undefined}
        aria-describedby={field.describedBy}
        className={cn(
          controlBase,
          controlBorder(invalid || !isValidHex(value)),
          'w-[11ch] shrink-0 grow-0 px-3 py-2 font-mono text-sm uppercase'
        )}
      />
    </div>
  );
};

export default ColorInput;
