import { useMemo, useState } from 'react';
import Icon from './Icon';
import cn from './cn';

/**
 * Calendario de tres vistas: días → meses → años.
 *
 * Portado de todos-los-perfumes/packages/ui/src/components/calendar/Calendar.tsx,
 * pasado a JS, con iconos lucide y los tokens de Malka.
 *
 * La semana arranca en LUNES, como se usa en Argentina.
 *
 * Trabaja siempre con strings 'YYYY-MM-DD' (o 'YYYY-MM' en variante month) y
 * nunca con objetos Date en la interfaz. Es a propósito: un `new Date('2026-03-01')`
 * se interpreta como UTC y en Argentina (UTC-3) devuelve el 28 de febrero.
 * Comparando strings ese error no existe.
 */

const DEFAULT_WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
export const DEFAULT_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const isoMonth = (y, m) => `${y}-${pad(m + 1)}`;

const NAV_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-control text-ink-muted transition-control duration-fast hover:bg-ink/[0.05] hover:text-ink';

const CELL_CLASS =
  'flex h-9 items-center justify-center rounded-control text-sm text-ink transition-control duration-fast hover:bg-primary-50';

const Calendar = ({
  value,
  onSelect,
  variant = 'date',
  weekdayLabels = DEFAULT_WEEKDAYS,
  monthLabels = DEFAULT_MONTHS,
  min,
  max,
  className,
}) => {
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const parsed = value ? value.split('-').map(Number) : [];
  const monthsShort = monthLabels.map((m) => m.slice(0, 3));

  const [view, setView] = useState({
    year: parsed[0] || today.getFullYear(),
    month: parsed[1] ? parsed[1] - 1 : today.getMonth(),
  });
  const [mode, setMode] = useState(variant === 'month' ? 'months' : 'days');

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    // getDay() da 0=domingo; este corrimiento lo pasa a 0=lunes.
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(view.year, view.month + 1, 0).getDate();

    const list = [];
    for (let i = 0; i < offset; i += 1) list.push(null);
    for (let d = 1; d <= total; d += 1) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const decadeStart = Math.floor(view.year / 12) * 12;

  const goPrev = () => {
    if (mode === 'days') {
      const d = new Date(view.year, view.month - 1, 1);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    } else if (mode === 'months') {
      setView((v) => ({ ...v, year: v.year - 1 }));
    } else {
      setView((v) => ({ ...v, year: v.year - 12 }));
    }
  };

  const goNext = () => {
    if (mode === 'days') {
      const d = new Date(view.year, view.month + 1, 1);
      setView({ year: d.getFullYear(), month: d.getMonth() });
    } else if (mode === 'months') {
      setView((v) => ({ ...v, year: v.year + 1 }));
    } else {
      setView((v) => ({ ...v, year: v.year + 12 }));
    }
  };

  // Click en el título: días → meses → años → días.
  const cycleMode = () => {
    if (variant === 'month') {
      setMode(mode === 'months' ? 'years' : 'months');
    } else {
      setMode(mode === 'days' ? 'months' : mode === 'months' ? 'years' : 'days');
    }
  };

  const title =
    mode === 'days'
      ? `${monthLabels[view.month]} ${view.year}`
      : mode === 'months'
        ? String(view.year)
        : `${decadeStart} – ${decadeStart + 11}`;

  return (
    <div
      className={cn(
        'w-[17.5rem] select-none rounded-card border border-surface-border bg-surface p-3 shadow-raised',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Anterior" className={NAV_CLASS} onClick={goPrev}>
          <Icon name="chevronLeft" size="md" />
        </button>

        <button
          type="button"
          onClick={cycleMode}
          className="rounded-control px-2 py-1 text-sm font-semibold capitalize text-ink transition-control duration-fast hover:bg-ink/[0.05]"
        >
          {title}
        </button>

        <button type="button" aria-label="Siguiente" className={NAV_CLASS} onClick={goNext}>
          <Icon name="chevronRight" size="md" />
        </button>
      </div>

      {mode === 'years' ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((y) => (
            <button
              key={y}
              type="button"
              className={cn(CELL_CLASS, y === view.year && 'bg-primary text-white hover:bg-primary')}
              onClick={() => {
                setView((v) => ({ ...v, year: y }));
                setMode('months');
              }}
            >
              {y}
            </button>
          ))}
        </div>
      ) : mode === 'months' ? (
        <div className="grid grid-cols-3 gap-1">
          {monthsShort.map((m, i) => {
            const selected =
              variant === 'month' ? isoMonth(view.year, i) === value : i === view.month;
            return (
              <button
                key={m}
                type="button"
                className={cn(
                  CELL_CLASS,
                  'capitalize',
                  selected && 'bg-primary text-white hover:bg-primary'
                )}
                onClick={() => {
                  if (variant === 'month') {
                    onSelect(isoMonth(view.year, i));
                  } else {
                    setView((v) => ({ ...v, month: i }));
                    setMode('days');
                  }
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="animate-fade-in motion-reduce:animate-none">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-muted">
            {weekdayLabels.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} />;

              const dIso = isoDate(view.year, view.month, d);
              const isSelected = dIso === value;
              const isToday = dIso === todayIso;
              // Comparación de strings ISO: ordena igual que por fecha.
              const disabled = (min && dIso < min) || (max && dIso > max);

              return (
                <button
                  key={dIso}
                  type="button"
                  disabled={disabled || undefined}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(
                    CELL_CLASS,
                    'active:scale-90 motion-reduce:active:scale-100',
                    disabled && 'pointer-events-none text-ink-faint/50 hover:bg-transparent',
                    isSelected && 'bg-primary font-medium text-white hover:bg-primary',
                    !isSelected && isToday && 'font-semibold text-primary-700 ring-1 ring-primary/50'
                  )}
                  onClick={() => onSelect(dIso)}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
