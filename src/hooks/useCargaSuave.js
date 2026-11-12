import { useEffect, useRef, useState } from 'react';

const GRACIA_MS = 150;
const MINIMO_VISIBLE_MS = 450;

/**
 * Pide datos sin que la pantalla parpadee.
 *
 * - Una carga corta no muestra nada: el «cargando» aparece recién a los 150 ms.
 * - Si aparece, queda al menos 450 ms, para que no sea un destello.
 * - Al cambiar el período o el filtro, el dato anterior queda en pantalla
 *   (la pantalla lo atenúa con `actualizando`), nunca un blanco.
 *
 * `pedir` recibe una señal de cancelación y devuelve una promesa con los datos.
 * Se vuelve a llamar cada vez que cambia `clave` (p. ej. "desde|hasta").
 */
export default function useCargaSuave(pedir, clave) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [esperando, setEsperando] = useState(false);
  const [cargandoVisible, setCargandoVisible] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  const pedirRef = useRef(pedir);
  pedirRef.current = pedir;

  useEffect(() => {
    const control = new AbortController();
    let visibleDesde = null;
    setEsperando(true);
    setError(null);

    const gracia = window.setTimeout(() => {
      visibleDesde = performance.now();
      setCargandoVisible(true);
    }, GRACIA_MS);

    const terminar = (aplicar) => {
      window.clearTimeout(gracia);
      const restante = visibleDesde === null ? 0 : Math.max(0, MINIMO_VISIBLE_MS - (performance.now() - visibleDesde));
      window.setTimeout(() => {
        if (control.signal.aborted) return;
        aplicar();
        setEsperando(false);
        setCargandoVisible(false);
      }, restante);
    };

    pedirRef
      .current(control.signal)
      .then((nuevos) => terminar(() => setDatos(nuevos)))
      .catch((err) => {
        if (control.signal.aborted) return;
        terminar(() => setError(err));
      });

    return () => {
      control.abort();
      window.clearTimeout(gracia);
    };
  }, [clave, vuelta]);

  return {
    datos,
    error,
    /* Primera carga, todavía sin nada que mostrar. */
    cargando: datos === null && cargandoVisible,
    /* Ya hay datos y se están pidiendo los del filtro nuevo. */
    actualizando: datos !== null && esperando,
    /* Vuelve a pedir lo mismo (después de cargar o borrar algo). */
    recargar: () => setVuelta((v) => v + 1),
  };
}
