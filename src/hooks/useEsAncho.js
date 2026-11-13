import { useEffect, useState } from 'react';

/* ¿Pantalla de compu? Desde 1024 px el detalle va al costado; abajo, en una hoja. */
const ANCHO = '(min-width: 1024px)';

export default function useEsAncho() {
  const [ancho, setAncho] = useState(() => window.matchMedia?.(ANCHO).matches ?? true);
  useEffect(() => {
    if (!window.matchMedia) return undefined; // jsdom en las pruebas
    const mq = window.matchMedia(ANCHO);
    const cambio = () => setAncho(mq.matches);
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);
  return ancho;
}
