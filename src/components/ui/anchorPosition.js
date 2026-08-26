/**
 * Calcula dónde anclar un panel flotante respecto de su disparador.
 *
 * Portado de todos-los-perfumes/packages/ui/src/utils/anchorPosition.ts.
 *
 * Devuelve coordenadas para `position: fixed`, así el panel se renderiza por
 * portal en el body y ningún `overflow: hidden` de un contenedor padre lo
 * recorta — el problema clásico de un calendario dentro de una tabla.
 */
export const computeAnchoredPosition = (rect, options = {}) => {
  const { desiredHeight = 260, gap = 4, menuWidth = rect.width, margin = 8 } = options;

  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;

  // Abre hacia arriba sólo si abajo no entra Y arriba hay más lugar.
  const openUp = spaceBelow < Math.min(desiredHeight, 200) && spaceAbove > spaceBelow;

  const maxHeight = Math.max(140, Math.min(desiredHeight, openUp ? spaceAbove : spaceBelow));

  // Clamp horizontal: alineado a la izquierda del disparador, pero corrido
  // para no pasarse del borde derecho ni izquierdo de la ventana.
  const width = Math.max(rect.width, menuWidth);
  const maxLeft = window.innerWidth - width - margin;
  const left = Math.max(margin, Math.min(rect.left, maxLeft));

  if (openUp) {
    return {
      left,
      width: rect.width,
      maxHeight,
      placement: 'top',
      bottom: window.innerHeight - rect.top + gap,
    };
  }

  return {
    left,
    width: rect.width,
    maxHeight,
    placement: 'bottom',
    top: rect.bottom + gap,
  };
};

export default computeAnchoredPosition;
