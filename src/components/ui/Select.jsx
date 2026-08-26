import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { useField } from './Field';
import { controlBase, controlBorder, controlSizes } from './Input';
import cn from './cn';

/**
 * Select propio, sin <select> nativo.
 *
 * Reemplazar el nativo significa reponer a mano todo lo que traía gratis. Lo
 * que está implementado acá:
 *
 * - Teclado completo: ↑↓ navega, Enter/Espacio selecciona, Esc cierra,
 *   Home/End van a los extremos, y escribir letras salta a la opción
 *   (type-ahead, igual que el nativo).
 * - ARIA de combobox: aria-expanded, aria-activedescendant, role=listbox.
 * - Cierre por click afuera y por scroll de la página.
 * - Flip automático hacia arriba si no entra abajo.
 * - El foco vuelve al trigger al cerrar, para no perder el lugar en el form.
 *
 * options: [{ value, label, icon?, disabled?, description? }]
 *
 *   <Select options={tipos} value={tipo} onChange={setTipo} placeholder="Elegí" />
 *   <Select options={usuarios} searchable clearable ... />
 */
const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  size = 'md',
  searchable = false,
  clearable = false,
  disabled = false,
  invalid: invalidProp,
  emptyMessage = 'Sin resultados',
  className,
  id: idProp,
  name,
  ...props
}) => {
  const field = useField();
  const invalid = invalidProp ?? field.invalid;
  const id = idProp ?? field.id;
  const listboxId = `${id}-listbox`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [flipUp, setFlipUp] = useState(false);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  /* Buffer del type-ahead: las teclas que se aprietan rápido se acumulan. */
  const typeahead = useRef({ text: '', timer: null });

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const pick = useCallback(
    (option) => {
      if (option.disabled) return;
      onChange?.(option.value, option);
      close();
    },
    [onChange, close]
  );

  /* Al abrir, arranca parado sobre la opción ya elegida. */
  const openMenu = useCallback(() => {
    if (disabled) return;
    const current = options.findIndex((o) => o.value === value);
    setActiveIndex(current >= 0 ? current : 0);
    setOpen(true);
  }, [disabled, options, value]);

  /* Decide si el menú va arriba o abajo ANTES de pintar, para que no salte. */
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    setFlipUp(below < 280 && rect.top > below);
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  /* Mantiene la opción activa dentro del área visible del scroll.
     El `typeof` no es paranoia: jsdom no implementa scrollIntoView, así que
     sin el guard cualquier test que abra un Select explota. */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    if (typeof node?.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
    };
    // capture: cierra aunque el scroll ocurra en un contenedor interno.
    const onScroll = (e) => {
      if (!rootRef.current?.contains(e.target)) close(false);
    };

    // Referencia con nombre: una flecha inline no se puede desenganchar
    // después, y el listener queda colgado para siempre.
    const onResize = () => close(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  const moveActive = (delta) => {
    if (!visible.length) return;
    setActiveIndex((prev) => {
      let next = prev;
      // Saltea deshabilitadas; da toda la vuelta como máximo.
      for (let i = 0; i < visible.length; i += 1) {
        next = (next + delta + visible.length) % visible.length;
        if (!visible[next]?.disabled) return next;
      }
      return prev;
    });
  };

  const runTypeahead = (char) => {
    clearTimeout(typeahead.current.timer);
    typeahead.current.text += char.toLowerCase();
    const match = visible.findIndex(
      (o) => !o.disabled && String(o.label).toLowerCase().startsWith(typeahead.current.text)
    );
    if (match >= 0) setActiveIndex(match);
    typeahead.current.timer = setTimeout(() => {
      typeahead.current.text = '';
    }, 600);
  };

  const onKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(visible.findIndex((o) => !o.disabled));
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(visible.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (visible[activeIndex]) pick(visible[activeIndex]);
        break;
      case ' ':
        // Con búsqueda abierta el espacio es un carácter, no un atajo.
        if (!searchable) {
          e.preventDefault();
          if (visible[activeIndex]) pick(visible[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        if (!searchable && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          runTypeahead(e.key);
        }
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)} {...props}>
      {/* Espejo nativo: hace que el Select participe de un <form> normal
          (FormData, submit) sin que el resto del código se entere. */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-describedby={field.describedBy}
        aria-required={field.required || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          controlBase,
          controlSizes[size],
          controlBorder(invalid),
          'flex items-center justify-between gap-2 text-left',
          open && 'border-primary ring-2 ring-primary/40',
          !selected && 'text-ink-faint'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon && <Icon name={selected.icon} size="sm" className="text-ink-muted" />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {clearable && selected && !disabled && (
            /* No es un <button>: anidar botones es HTML inválido. Un <span>
               con role=button y teclado propio hace lo mismo. */
            <span
              role="button"
              tabIndex={-1}
              aria-label="Limpiar selección"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(null, null);
              }}
              className="rounded-pill p-0.5 text-ink-faint transition-colors duration-fast hover:bg-ink/[0.05] hover:text-ink-soft"
            >
              <Icon name="close" size="xs" />
            </span>
          )}
          <Icon
            name="chevronDown"
            size="sm"
            className={cn(
              'text-ink-muted transition-transform duration-fast ease-standard motion-reduce:transition-none',
              open && 'rotate-180'
            )}
          />
        </span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 w-full rounded-control border border-surface-border bg-surface shadow-raised',
            'animate-scale-in origin-top',
            flipUp ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1'
          )}
        >
          {searchable && (
            <div className="border-b border-surface-border p-2">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-ink-faint">
                  <Icon name="search" size="sm" />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Buscar..."
                  aria-label="Buscar opción"
                  aria-controls={listboxId}
                  className="w-full rounded-control border border-surface-border bg-surface py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
            tabIndex={-1}
            className="max-h-60 overflow-y-auto overscroll-contain p-1"
          >
            {visible.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-ink-muted">{emptyMessage}</li>
            )}

            {visible.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value ?? `opt-${index}`}
                  id={`${id}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onClick={() => pick(option)}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-[0.5rem] px-3 py-2 text-sm transition-colors duration-instant',
                    isActive && !option.disabled && 'bg-primary-50',
                    isSelected ? 'font-medium text-primary-700' : 'text-ink',
                    option.disabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.icon && <Icon name={option.icon} size="sm" className="text-ink-muted" />}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-ink-muted">
                        {option.description}
                      </span>
                    )}
                  </span>

                  {isSelected && <Icon name="check" size="sm" className="text-primary" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
