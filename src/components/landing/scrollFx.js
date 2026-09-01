import { useEffect, useRef } from 'react';

/**
 * Coreografía de scroll, con un solo bucle para toda la página.
 *
 * El error clásico es que cada bloque se enganche a `scroll` por su cuenta:
 * con ocho elementos son ocho handlers midiendo el layout en el mismo frame,
 * y ahí es donde el scroll se pone gomoso. Acá hay un único
 * `requestAnimationFrame` compartido: los elementos se suscriben, el bucle
 * arranca con el primero y se apaga solo cuando se va el último.
 *
 * Cada suscriptor recibe su progreso `p` de 0 a 1 — 0 cuando el elemento
 * asoma por abajo de la pantalla, 1 cuando termina de salir por arriba — y
 * escribe directo en el DOM. A propósito no pasa por el estado de React:
 * sesenta re-renders por segundo para mover un `transform` es exactamente lo
 * que no hay que hacer.
 */

const suscriptos = new Set();
let corriendo = false;

const clamp = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

const frame = () => {
  const alto = window.innerHeight;

  for (const { el, fn } of suscriptos) {
    const rect = el.getBoundingClientRect();
    /* Fuera de pantalla no se toca: mover algo que nadie ve es trabajo
       tirado, y en una landing larga la mayoría de los bloques están fuera
       casi todo el tiempo. */
    if (rect.bottom < -alto || rect.top > alto * 2) continue;
    fn(el, clamp((alto - rect.top) / (alto + rect.height)));
  }

  if (suscriptos.size) requestAnimationFrame(frame);
  else corriendo = false;
};

const suscribir = (entrada) => {
  suscriptos.add(entrada);
  if (!corriendo) {
    corriendo = true;
    requestAnimationFrame(frame);
  }
  return () => suscriptos.delete(entrada);
};

export const quiereQuietud = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Engancha un elemento a la coreografía.
 *
 *   const ref = useScrollFx((el, p) => {
 *     el.style.transform = `translate3d(0, ${-p * 16}%, 0)`;
 *   });
 *
 * Si el sistema pidió menos movimiento, no se suscribe a nada y el elemento
 * se queda donde lo dejó el CSS.
 */
export const useScrollFx = (fn) => {
  const ref = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const el = ref.current;
    if (!el || quiereQuietud()) return;
    return suscribir({ el, fn: (nodo, p) => fnRef.current(nodo, p) });
  }, []);

  return ref;
};

export default useScrollFx;
