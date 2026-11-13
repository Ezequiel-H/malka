import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import cn from './cn';

const ZOOMS = [1, 1.75, 2.5];

/**
 * Visor de imagen en la misma página, con zoom.
 *
 * Para revisar un comprobante no hace falta irse a otra pestaña: se abre acá,
 * se hace zoom para leer el monto y se cierra sin perder el lugar en la lista.
 *
 * - Click sobre la imagen (o los botones +/−) cicla los niveles de zoom.
 * - Con zoom, el paneo es por scroll del contenedor — funciona con rueda,
 *   trackpad y arrastre en touch, sin reimplementar drag.
 * - Escape cierra y el foco vuelve a quien lo abrió.
 * - Si la URL es un PDF, se embebe el visor del navegador (que ya trae zoom).
 *
 *   <ImageLightbox open={!!url} src={url} title="Comprobante" onClose={...} />
 */
const ImageLightbox = ({ open, onClose, src, alt = '', title }) => {
  const [zoomIndex, setZoomIndex] = useState(0);
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);

  const isPdf = /\.pdf($|\?)/i.test(src || '');
  const zoom = ZOOMS[zoomIndex];

  const cycleZoom = useCallback(() => {
    setZoomIndex((i) => (i + 1) % ZOOMS.length);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    setZoomIndex(0);
    previouslyFocused.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === '+' || e.key === '=') setZoomIndex((i) => Math.min(i + 1, ZOOMS.length - 1));
      if (e.key === '-') setZoomIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Imagen ampliada'}
      // z por encima de cualquier modal: el lightbox puede abrirse desde uno.
      className="fixed inset-0 z-[80] flex flex-col bg-ink/85 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
    >
      {/* Barra superior */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate text-sm font-medium text-white/90">{title}</p>

        <div className="flex shrink-0 items-center gap-1">
          {!isPdf && (
            <>
              <button
                type="button"
                onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
                disabled={zoomIndex === 0}
                aria-label="Alejar"
                className="rounded-control p-2 text-white/80 transition-control duration-fast hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Icon name="remove" size="sm" />
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-white/70">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOMS.length - 1))}
                disabled={zoomIndex === ZOOMS.length - 1}
                aria-label="Acercar"
                className="rounded-control p-2 text-white/80 transition-control duration-fast hover:bg-white/10 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Icon name="add" size="sm" />
              </button>
            </>
          )}

          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir original en otra pestaña"
            title="Abrir original"
            className="ml-1 rounded-control p-2 text-white/80 transition-control duration-fast hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Icon name="external" size="sm" />
          </a>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-control p-2 text-white/80 transition-control duration-fast hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Icon name="close" size="md" />
          </button>
        </div>
      </div>

      {/* Lienzo: el fondo también cierra */}
      {isPdf ? (
        <div className="min-h-0 flex-1 px-4 pb-4">
          <iframe src={src} title={title || 'PDF'} className="h-full w-full rounded-card bg-white" />
        </div>
      ) : (
        <div
          className={cn(
            'min-h-0 flex-1 overflow-auto overscroll-contain px-4 pb-4',
            zoomIndex === 0 && 'flex items-center justify-center'
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <img
            src={src}
            alt={alt}
            onClick={cycleZoom}
            className={cn(
              'select-none rounded-card',
              zoomIndex === 0
                ? 'max-h-full max-w-full cursor-zoom-in object-contain'
                : 'mx-auto max-w-none cursor-zoom-out'
            )}
            style={zoomIndex === 0 ? undefined : { width: `${zoom * 100}%` }}
            draggable={false}
          />
        </div>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
