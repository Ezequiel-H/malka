import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import Calendar, { DEFAULT_MONTHS } from './Calendar';
import { useField } from './Field';
import { controlBase, controlBorder, controlSizes } from './Input';
import { computeAnchoredPosition } from './anchorPosition';
import cn from './cn';
import { useIdioma } from '../../i18n/IdiomaContext';

/**
 * Selector de fecha.
 *
 * Portado de todos-los-perfumes/packages/ui/src/components/date_picker/DatePicker.tsx,
 * adaptado a JS y a las primitivas de Malka (mismo alto, borde y foco que
 * Input y Select, para que en un formulario los tres campos se vean iguales).
 *
 * El valor viaja como string: 'YYYY-MM-DD' en variante date, 'YYYY-MM' en
 * variante month — el mismo formato que devuelve y espera la API.
 *
 *   <DatePicker value={fecha} onChange={setFecha} clearable />
 *   <DatePicker value={mes} onChange={setMes} variant="month" />
 *   <DatePicker value={desde} onChange={setDesde} max={hasta} />
 */
const formatLabel = (value, variant, monthLabels, locale) => {
  const parts = value.split('-').map(Number);
  const [year, month, day] = parts;
  if (!year || !month) return value;
  if (variant === 'month') return `${monthLabels[month - 1]} ${year}`;
  if (!day) return value;
  // El orden del día y el mes depende del idioma (15/05/1990 o 05/15/1990).
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale, {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const DatePicker = ({
  value,
  onChange,
  variant = 'date',
  placeholder: placeholderProp,
  size = 'md',
  clearable = false,
  disabled = false,
  invalid: invalidProp,
  weekdayLabels,
  monthLabels: monthLabelsProp,
  min,
  max,
  className,
  id: idProp,
  name,
  ...props
}) => {
  const { t, locale } = useIdioma();
  const placeholder = placeholderProp ?? t('ui.elegiFecha');
  const monthLabels = monthLabelsProp ?? t('ui.meses') ?? DEFAULT_MONTHS;
  const field = useField();
  const invalid = invalidProp ?? field.invalid;
  const id = idProp ?? field.id;

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    setPos(
      computeAnchoredPosition(triggerRef.current.getBoundingClientRect(), {
        desiredHeight: 360,
        menuWidth: 288,
      })
    );
  }, []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    reposition();

    const onDown = (event) => {
      const target = event.target;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        close(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    // El panel está en `fixed`, así que hay que recalcular al scrollear.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition, close]);

  const label = value ? formatLabel(value, variant, monthLabels, locale) : '';

  return (
    <div className={cn('relative', className)} {...props}>
      {/* Espejo nativo, para que participe de un <form> normal. */}
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={field.describedBy}
        aria-required={field.required || undefined}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          controlBase,
          controlSizes[size],
          controlBorder(invalid),
          'flex items-center gap-2 text-start',
          open && 'border-primary ring-2 ring-primary/40',
          !label && 'text-ink-faint'
        )}
      >
        <Icon name="activity" size="sm" className="shrink-0 text-ink-muted" />

        <span className="flex-1 truncate">{label || placeholder}</span>

        {clearable && value && !disabled && (
          /* <span> y no <button>: anidar botones es HTML inválido. */
          <span
            role="button"
            tabIndex={-1}
            aria-label={t('ui.limpiarFecha')}
            onClick={(event) => {
              event.stopPropagation();
              onChange('');
            }}
            className="shrink-0 rounded-pill p-0.5 text-ink-faint transition-control duration-fast hover:bg-ink/[0.05] hover:text-ink-soft"
          >
            <Icon name="close" size="xs" />
          </span>
        )}

        <Icon
          name="chevronDown"
          size="sm"
          className={cn(
            'shrink-0 text-ink-muted transition-transform duration-fast ease-standard motion-reduce:transition-none',
            open && 'rotate-180'
          )}
        />
      </button>

      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t('ui.calendario')}
            data-calendario
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left }}
            className="z-[70] animate-scale-in motion-reduce:animate-none"
          >
            <Calendar
              value={value}
              variant={variant}
              weekdayLabels={weekdayLabels}
              monthLabels={monthLabelsProp}
              min={min}
              max={max}
              onSelect={(next) => {
                onChange(next);
                close();
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default DatePicker;
