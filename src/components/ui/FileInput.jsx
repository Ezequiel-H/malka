import { forwardRef, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import Button from './Button';
import { useField } from './Field';
import cn from './cn';
import { useIdioma } from '../../i18n/IdiomaContext';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (file) => file?.type?.startsWith('image/');
const isPdf = (file) => file?.type === 'application/pdf';

/**
 * Selector de archivo, pensado para el flujo de comprobantes de pago.
 *
 * El <input type="file"> nativo es el control menos estilizable del HTML y se
 * ve distinto en cada navegador. Acá el nativo queda oculto y se dibuja una
 * zona propia que además:
 *
 * - acepta arrastrar y soltar, y también pegar desde el portapapeles
 *   (Cmd+V con una captura es como la mayoría manda un comprobante)
 * - muestra miniatura real si es imagen
 * - valida tamaño máximo antes de subir, en vez de fallar al enviar
 * - permite reemplazar sin tener que quitar primero
 */
const FileInput = forwardRef(
  (
    {
      accept,
      onChange,
      value,
      maxSize,
      hint: hintProp,
      disabled = false,
      invalid: invalidProp,
      progress,
      className,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const { t } = useIdioma();
    const hint = hintProp ?? t('ui.archivoAyuda');
    const field = useField();
    const invalid = invalidProp ?? field.invalid;
    const id = idProp ?? field.id;

    const inputRef = useRef(null);
    const zoneRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState(null);
    const [preview, setPreview] = useState(null);

    /* La miniatura se genera con un object URL, que hay que revocar o el
       archivo queda retenido en memoria mientras viva la pestaña. */
    useEffect(() => {
      if (!isImage(value)) {
        setPreview(null);
        return undefined;
      }
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }, [value]);

    const accept_ = (file) => {
      if (!file) return;
      if (maxSize && file.size > maxSize) {
        setSizeError(t('ui.archivoPesado', { peso: formatSize(file.size), maximo: formatSize(maxSize) }));
        return;
      }
      setSizeError(null);
      onChange?.(file);
    };

    const clear = () => {
      setSizeError(null);
      onChange?.(null);
      // Sin esto, volver a elegir el MISMO archivo no dispara change.
      if (inputRef.current) inputRef.current.value = '';
    };

    /* Pegar una captura: sólo mientras la zona tiene el foco, para no robarle
       el paste al resto del formulario. */
    useEffect(() => {
      const node = zoneRef.current;
      if (!node || disabled || value) return undefined;

      const onPaste = (e) => {
        const file = Array.from(e.clipboardData?.files ?? [])[0];
        if (file) {
          e.preventDefault();
          accept_(file);
        }
      };

      node.addEventListener('paste', onPaste);
      return () => node.removeEventListener('paste', onPaste);
      // Con deps explícitas: sin ellas el efecto corre en CADA render y
      // reengancha el listener una y otra vez.
    }, [disabled, value, maxSize]);

    const uploading = typeof progress === 'number' && progress < 100;

    if (value) {
      return (
        <div className={className}>
          <div
            className={cn(
              'group relative flex items-center gap-3 overflow-hidden rounded-card border bg-surface p-3 shadow-subtle',
              'transition-control duration-fast',
              invalid ? 'border-danger-500' : 'border-surface-border'
            )}
          >
            {/* Miniatura para imágenes; marca de tipo para el resto. */}
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-control',
                preview ? 'bg-ink/[0.04]' : 'bg-primary-50 text-primary'
              )}
            >
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="document" size="lg" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{value.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                {typeof value.size === 'number' && <span>{formatSize(value.size)}</span>}
                {isPdf(value) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>PDF</span>
                  </>
                )}
              </p>

              {uploading ? (
                <div className="mt-2">
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1 overflow-hidden rounded-pill bg-ink/[0.08]"
                  >
                    <div
                      className="h-full rounded-pill bg-primary transition-[width] duration-base ease-standard"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                progress === 100 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success-600">
                    <Icon name="success" size="xs" />
                    Subido
                  </p>
                )
              )}
            </div>

            {!disabled && !uploading && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon="upload"
                  iconOnly
                  label={t('ui.reemplazarArchivo')}
                  onClick={() => inputRef.current?.click()}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="delete"
                  iconOnly
                  label={`Quitar ${value.name}`}
                  onClick={clear}
                  className="hover:bg-danger-50 hover:text-danger-600"
                />
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={(e) => accept_(e.target.files?.[0])}
            className="sr-only"
            {...props}
          />
        </div>
      );
    }

    return (
      <div className={className}>
        <div
          ref={zoneRef}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={hint}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={(e) => {
            // Sólo apaga cuando el puntero sale de la zona entera, no al pasar
            // por encima de un hijo.
            if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) accept_(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'group flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-4 py-8 text-center',
            'transition-chrome duration-fast ease-standard motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
            dragging
              ? 'scale-[1.01] border-primary bg-primary-50'
              : 'border-surface-border bg-surface hover:border-primary-300 hover:bg-primary-50/40',
            (invalid || sizeError) && 'border-danger-500 bg-danger-50/40',
            disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
          )}
        >
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-pill',
              'transition-chrome duration-fast ease-spring motion-reduce:transition-none',
              dragging
                ? 'scale-110 bg-primary text-white'
                : 'bg-primary-50 text-primary group-hover:scale-105'
            )}
          >
            <Icon name="upload" size="lg" />
          </span>

          <span>
            <span className="block text-sm font-medium text-ink">
              {dragging ? t('ui.soltaArchivo') : hint}
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {[accept?.replace(/,/g, ', '), maxSize && t('ui.archivoHasta', { maximo: formatSize(maxSize) })]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </div>

        {sizeError && (
          <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger-600">
            <Icon name="error" size="xs" />
            {sizeError}
          </p>
        )}

        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => accept_(e.target.files?.[0])}
          aria-invalid={invalid || undefined}
          aria-describedby={field.describedBy}
          className="sr-only"
          {...props}
        />
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';

export default FileInput;
