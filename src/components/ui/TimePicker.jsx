import { useMemo } from 'react';
import Select from './Select';
import cn from './cn';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Selector de hora en dos partes: hora y minutos.
 *
 * Trabaja con un string 'HH:mm' —el mismo formato que guarda y devuelve la
 * API— así que no hay que convertir a Date en ningún lado.
 *
 * Reemplaza los cuatro pares de <select> hora/minuto que estaban copiados en
 * el formulario de actividad, cada uno con su propia lógica de recomponer el
 * string.
 *
 *   <TimePicker value={hora} onChange={setHora} />
 *   <TimePicker value={hora} onChange={setHora} minuteStep={15} />
 */
const TimePicker = ({
  value = '',
  onChange,
  minuteStep = 5,
  size = 'md',
  disabled = false,
  invalid,
  className,
}) => {
  const [hour = '', minute = ''] = String(value || '').split(':');

  const hourOptions = useMemo(
    () => [
      { value: '', label: 'Hora' },
      ...Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) })),
    ],
    []
  );

  const minuteOptions = useMemo(
    () => [
      { value: '', label: 'Min' },
      ...Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => {
        const m = pad(i * minuteStep);
        return { value: m, label: m };
      }),
    ],
    [minuteStep]
  );

  /* Si sólo se elige una de las dos partes, la otra cae en '00' en vez de
     quedar a medias — un 'HH:' no es una hora válida para la API. */
  const emit = (nextHour, nextMinute) => {
    if (!nextHour && !nextMinute) {
      onChange?.('');
      return;
    }
    onChange?.(`${nextHour || '00'}:${nextMinute || '00'}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        options={hourOptions}
        value={hour}
        onChange={(next) => emit(next ?? '', minute)}
        size={size}
        disabled={disabled}
        invalid={invalid}
        placeholder="Hora"
        className="flex-1"
      />

      <span aria-hidden="true" className="font-bold text-ink-faint">
        :
      </span>

      <Select
        options={minuteOptions}
        value={minute}
        onChange={(next) => emit(hour, next ?? '')}
        size={size}
        disabled={disabled}
        invalid={invalid}
        placeholder="Min"
        className="flex-1"
      />
    </div>
  );
};

export default TimePicker;
