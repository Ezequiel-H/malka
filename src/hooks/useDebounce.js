import { useState, useEffect } from 'react';

// Devuelve una versión "retrasada" del valor: solo se actualiza cuando pasan
// `delay` ms sin cambios. Útil para no disparar una búsqueda por cada tecla.
export const useDebounce = (value, delay = 350) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
