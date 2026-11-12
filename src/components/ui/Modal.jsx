import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import cn from './cn';
import { useIdioma } from '../../i18n/IdiomaContext';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal accesible.
 *
 * Lo que un modal necesita para no ser una trampa, y que la app hoy resuelve
 * distinto en cada uno de los modales que tiene:
 *
 * - El foco entra al abrir y VUELVE al elemento que lo abrió al cerrar.
 * - El Tab queda atrapado adentro (si no, se tabula al fondo invisible).
 * - Escape cierra.
 * - El body no scrollea por detrás.
 * - Se renderiza por portal, así ningún `overflow: hidden` de un padre lo corta.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  closeOnOverlay = true,
  footer,
  className,
  children,
}) => {
  const { t } = useIdioma();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  const trapFocus = useCallback((e) => {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    // Shift+Tab desde el primero va al último, y viceversa: el ciclo se cierra.
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      else trapFocus(e);
    };

    document.addEventListener('keydown', onKeyDown);

    // Bloquea el scroll de fondo sin que la página salte al reponerlo.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Espera al pintado para que el nodo exista antes de enfocarlo.
    const focusTimer = setTimeout(() => {
      const target = panelRef.current?.querySelector(FOCUSABLE);
      (target ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-overlay-in motion-reduce:animate-none"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col bg-surface shadow-overlay',
          // En mobile sube desde abajo y ocupa el ancho: es el patrón que la
          // gente espera en el teléfono.
          'rounded-t-panel sm:rounded-panel',
          'animate-sheet-in sm:animate-modal-in motion-reduce:animate-none',
          SIZES[size],
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 border-b border-surface-border p-5">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('ui.cerrar')}
                className="-m-1.5 shrink-0 rounded-control p-1.5 text-ink-faint transition-colors duration-fast hover:bg-ink/[0.05] hover:text-ink"
              >
                <Icon name="close" size="md" />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-surface-border p-4 sm:rounded-b-panel">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
